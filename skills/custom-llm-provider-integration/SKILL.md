---
name: custom-llm-provider-integration
description: >
  Configurer les outils pilotés par LLM (Strix, etc.) avec un backend OpenAI-compatible
  personnalisé : Cloudflare Workers AI, Azure OpenAI, vLLM local, etc. Couvre le pattern
  LiteLLM (env vars), Docker-in-Docker pour sandbox, et les timeouts Caido.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [llm, provider, strix, cloudflare, liteollm, docker, sandbox]
    related_skills: [strix-pentesting, devops-automator]
---

# Custom LLM Provider Integration

Configurer n'importe quel outil basé sur **LiteLLM** (Strix, Open Interpreter, etc.)
avec un endpoint OpenAI-compatible non standard — Cloudflare Workers AI, Azure OpenAI,
ou une instance locale (vLLM, Ollama, llama.cpp).

## Déclencheurs

- L'utilisateur fournit des credentials pour un provider LLM non standard (Cloudflare, Azure)
- L'utilisateur demande de configurer Strix avec un LLM custom
- Erreur « Tool server failed to start », « Caido not ready », ou « Connection timeout »
  au premier lancement du sandbox

## Le pattern LiteLLM

Ces outils utilisent un ensemble commun de variables d'environnement :

| Variable | Rôle | Exemple Cloudflare |
|---|---|---|
| `STRIX_LLM` | Provider + nom du modèle | `openai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| `LLM_API_KEY` | Token d'authentification | `cfut_xxxxxxxxx` |
| `LLM_API_BASE` | URL de base du provider | `https://api.cloudflare.com/client/v4/accounts/{ID}/ai/v1/` |
| `STRIX_IMAGE` | Image Docker du sandbox | `strix-sandbox-fixed` (ou tag officiel) |

Le format est toujours `openai/<model-name>` car le provider est compatible
OpenAI, même si le modèle a un nom exotique (ex: `@cf/...`).

## Providers spécifiques

### Cloudflare Workers AI

**Endpoint** : `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/`

Workers AI expose une API OpenAI-compatible. Le modèle est passé **avec son namespace complet** :

```bash
STRIX_LLM=openai/@cf/meta/llama-3.3-70b-instruct-fp8-fast
LLM_API_KEY=cfut_xxxxxxxxx
LLM_API_BASE=https://api.cloudflare.com/client/v4/accounts/618fc58025826a8b715c13b4cd79b6f6/ai/v1/
```

Vérifier la disponibilité d'un modèle :

```bash
curl -s -H "Authorization: Bearer $LLM_API_KEY" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models/search" \
  | jq '.result | .[].name' | grep -i deepseek
```

### Azure OpenAI

```bash
STRIX_LLM=openai/gpt-4o              # = deployment name
LLM_API_KEY=sk-azure-xxxxx
LLM_API_BASE=https://{resource}.openai.azure.com/
```

### Local (vLLM / Ollama / llama.cpp)

```bash
STRIX_LLM=openai/mistral-7b-instruct
LLM_API_KEY=not-needed               # ou une valeur factice
LLM_API_BASE=http://host.docker.internal:8000/v1
```

Pour un service local accessible depuis le conteneur Docker, utiliser
`host.docker.internal` au lieu de `localhost`.

## Docker-in-Docker pour Strix

Strix a besoin de créer des conteneurs sandbox. Configuration `docker-compose.yml` minimale :

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock   # socket Docker
  - /usr/bin/docker:/usr/bin/docker               # binaire Docker
```

L'image sandbox (`ghcr.io/usestrix/strix-sandbox:1.0.0`) pèse ~11 GB et
est téléchargée automatiquement au premier lancement. Compter 5–15 min selon
le débit.

### Conteneur Strix principal

```yaml
services:
  strix:
    build: .
    image: strix-local
    container_name: strix
    env_file:
      - .env
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - STRIX_LLM=${STRIX_LLM:-openai/gpt-5.4}
      - LLM_API_BASE=${LLM_API_BASE}
      - STRIX_REASONING_EFFORT=${STRIX_REASONING_EFFORT:-high}
      - STRIX_SANDBOX_CONNECT_TIMEOUT=${STRIX_SANDBOX_CONNECT_TIMEOUT:-60}
      - STRIX_SANDBOX_EXECUTION_TIMEOUT=${STRIX_SANDBOX_EXECUTION_TIMEOUT:-300}
    volumes:
      - ./workspace:/workspace
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
    working_dir: /workspace
```

## Timeouts sandbox (Caido)

Le sandbox Strix intègre **Caido** comme proxy HTTP d'interception. Au premier
démarrage, Caido génère ses certificats CA et crée un projet temporaire, ce qui
peut prendre >10 secondes. Augmenter les timeouts :

```bash
STRIX_SANDBOX_CONNECT_TIMEOUT=60    # défaut 10s — trop court pour Caido
STRIX_SANDBOX_EXECUTION_TIMEOUT=300 # défaut 120s
```

## Problème connu : certificat RSA incompatible avec Caido ≥0.56

**Ne pas confondre avec un simple timeout.** Le symptôme « Instance not ready
after 5 attempts » peut cacher un crash pur de Caido.

### Cause racine

Caido 0.56.0 **supporte uniquement les clés Elliptic Curve (EC)** pour son
certificat CA importé via `--import-ca-cert`. L'image sandbox officielle
`ghcr.io/usestrix/strix-sandbox:1.0.0` génère une clé **RSA 2048** dans son
`docker-entrypoint.sh`, ce qui provoque :

```
Failed to parse p12: InvalidCertificate(Only Elliptic Curve keys are supported)
→ panic / crash de Caido au démarrage
→ le port 48080 ne répond jamais
→ Strix lève InstanceNotReadyError après 5 tentatives
```

### Solution : image sandbox avec certificats EC

1. Créer un `Dockerfile.sandbox` patchant les certificats :

```dockerfile
FROM ghcr.io/usestrix/strix-sandbox:1.0.0

# Caido 0.56.0 only supports Elliptic Curve keys, not RSA.
# Pre-generate EC certs at the paths expected by docker-entrypoint.sh.
RUN openssl ecparam -genkey -name prime256v1 -out /app/certs/ca.key && \
    openssl req -x509 -new -key /app/certs/ca.key -out /app/certs/ca.crt \
      -days 365 -nodes -subj "/C=US/O=Strix/CN=Strix CA" && \
    openssl pkcs12 -export -in /app/certs/ca.crt -inkey /app/certs/ca.key \
      -out /app/certs/ca.p12 -passout pass:
```

2. Builder l'image corrigée :

```bash
docker build -t strix-sandbox-fixed -f Dockerfile.sandbox .
```

3. Pointer Strix vers l'image corrigée via `.env` :

```bash
STRIX_IMAGE=strix-sandbox-fixed
```

4. Vérifier que le sandbox démarre correctement :

```bash
docker run --rm strix-sandbox-fixed
# Attendre 10-15s, vérifier les logs : "Caido API is ready"
# et "Container ready"
```

### Variable `STRIX_IMAGE`

Contrôle l'image Docker utilisée pour le sandbox Strix. Défaut :
`ghcr.io/usestrix/strix-sandbox:0.1.12` mais peut varier selon la version
de Strix. Surcharger via `.env` :

```bash
STRIX_IMAGE=strix-sandbox-fixed
```

Cette variable est aussi utilisable pour tester des forks, des images
pré-chargées hors-ligne, ou des versions patchées du sandbox.

## Pièges à éviter

### LLM_API_BASE oubliée
Le `.env` seul ne suffit pas si `docker-compose.yml` n'a pas `env_file: .env`
**ou** `LLM_API_BASE=${LLM_API_BASE}` dans la section `environment:`.

### Docker manquant dans le conteneur
Ne pas installer `docker.io` via apt dans le Dockerfile (trop long, ~30s+).
Monter le binaire depuis le host avec `- /usr/bin/docker:/usr/bin/docker`.

### Modèle Workers AI inexistant
Vérifier le nom exact du modèle avant de lancer Strix. Les modèles Cloudflare
suivent le format `@cf/vendor/name`. Un modèle qui n'existe pas donne une
erreur 404 silencieuse.

### Premier run long
- Téléchargement sandbox : 11 GB
- Génératio des certs CA Caido : 5–15s
- Pull de l'image Python de base : ~150 MB

Ne pas interpréter un délai de 2-3 minutes comme un échec.

## Voir aussi

- `references/strix-cloudflare-setup.md` — Détails session Cloudflare + Strix
- `strix-pentesting` skill (bundled) — workflow de scan Strix (prérequis obsolètes)
- https://usestrix-strix.mintlify.app/ — Documentation Strix officielle
- https://developers.cloudflare.com/workers-ai/ — Documentation Workers AI

## Déclencheurs

- L'utilisateur fournit des credentials pour un provider LLM non standard (Cloudflare, Azure)
- L'utilisateur demande de configurer Strix avec un LLM custom
- Erreur « Tool server failed to start », « Caido not ready », ou « Connection timeout »
  au premier lancement du sandbox
- Fichiers de scan inaccessibles (root-owned) après un run Docker

## Le pattern LiteLLM

Ces outils utilisent un ensemble commun de variables d'environnement :

| Variable | Rôle | Exemple Cloudflare |
|---|---|---|
| `STRIX_LLM` | Provider + nom du modèle | `openai/@cf/meta/llama-4-scout-17b-16e-instruct` |
| `LLM_API_KEY` | Token d'authentification | `cfut_xxxxxxxxx` |
| `LLM_API_BASE` | URL de base du provider | `https://api.cloudflare.com/client/v4/accounts/{ID}/ai/v1/` |
| `STRIX_IMAGE` | Image Docker du sandbox | `strix-sandbox-fixed` (ou tag officiel) |
| `STRIX_AGENT_TIMEOUT` | Timeout global du scan (evite cleanup premature) | `600` (secondes) |
| `STRIX_SANDBOX_CONNECT_TIMEOUT` | Timeout connexion Caido | `60` |
| `STRIX_SANDBOX_EXECUTION_TIMEOUT` | Timeout execution outils sandbox | `300` |

Le format est toujours `openai/<model-name>` car le provider est compatible
OpenAI, même si le modèle a un nom exotique (ex: `@cf/...`).

### Cloudflare Workers AI

**Endpoint** : `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/`

Workers AI expose une API OpenAI-compatible. Le modèle est passé **avec son namespace complet** :

```bash

# Modèle recommandé : Llama 4 Scout (256K contexte, supporte function calling)

# ⚠ ATTENTION : peut renvoyer delta: true (bool) en streaming → crash SDK

# Voir section « Streaming SSE : delta booléen » plus bas
STRIX_LLM=openai/@cf/meta/llama-4-scout-17b-16e-instruct

# Alternative : Llama 3.3 70B FP8 — 24K tokens, supporte function calling

# MAIS nécessite un patch du handler de streaming (voir référence)
STRIX_LLM=openai/@cf/meta/llama-3.3-70b-instruct-fp8-fast

# Alternative : @cf/moonshotai/kimi-k2.6 — modèle de raisonnement

# ✅ 7/7 checks Strix passés en mode quick (2026-07-09)

# ⚠ Modèle de raisonnement : met sa réponse dans reasoning_content,

#   laisse content vide (comportement DeepSeek-R1). Strix gère ce cas.

# Testé via chat completions endpoint, pas de bugs de streaming constatés.
STRIX_LLM=openai/@cf/moonshotai/kimi-k2.6
```

Vérifier la disponibilité d'un modèle :

```bash

# Lister tous les modèles disponibles
curl -s -H "Authorization: Bearer $LLM_API_KEY" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/models/search" \
  | jq '.result | .[].name' | grep -i deepseek

# Tester le function calling (indispensable pour Strix)
curl -s -X POST "$LLM_API_BASE/chat/completions" \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MODEL_ID","messages":[{"role":"user","content":"Call ping tool"}],
       "tools":[{"type":"function","function":{"name":"ping",
         "parameters":{"type":"object","properties":{"msg":{"type":"string"}},
         "required":["msg"]}}}],"max_tokens":200}' \
  | jq '.choices[0].message | {content, tool_calls, finish_reason}'

# Si tool_calls est vide et finish_reason=stop → modèle ne supporte pas le function calling
```

## Docker-in-Docker pour Strix

Strix a besoin de créer des conteneurs sandbox (Caido + outils). Configuration
`docker-compose.yml` :

```yaml
services:
  strix:
    build: .
    image: strix-local
    container_name: strix
    network_mode: "host"
    user: "${UID:-1000}:${GID:-1000}"
    group_add:
      - "${DOCKER_GID:-999}"          # decouvrir: getent group docker | cut -d: -f3
    env_file:
      - .env
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - STRIX_LLM=${STRIX_LLM:-openai/@cf/moonshotai/kimi-k2.6}
      - LLM_API_BASE=${LLM_API_BASE:-https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/}
      - STRIX_REASONING_EFFORT=${STRIX_REASONING_EFFORT:-medium}
      - STRIX_IMAGE=${STRIX_IMAGE:-strix-sandbox-fixed}
      - STRIX_SANDBOX_CONNECT_TIMEOUT=${STRIX_SANDBOX_CONNECT_TIMEOUT:-60}
      - STRIX_SANDBOX_EXECUTION_TIMEOUT=${STRIX_SANDBOX_EXECUTION_TIMEOUT:-300}
      - STRIX_AGENT_TIMEOUT=${STRIX_AGENT_TIMEOUT:-600}
      - HOME=/workspace/strix_runs     # repertoire d'etat writable par uid non-root
    volumes:
      - ./workspace:/workspace
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
    working_dir: /workspace
```

L'image sandbox (`ghcr.io/usestrix/strix-sandbox:1.0.0`) pèse ~11 GB et
est téléchargée automatiquement au premier lancement. Compter 5–15 min selon
le débit.

### Conteneur Strix tournant en root : fichiers illisibles

**Symptome :** Les fichiers generes dans `workspace/strix_runs/<run_id>/` appartiennent a
`root:root` et sont illisibles par l'utilisateur hote. `cat` echoue avec `Permission denied` :

```bash
cat workspace/strix_runs/mwana-itech-pages-dev_29cb/run.json

# Permission denied
```

**Cause :** Par defaut, les processus dans le conteneur tournent sous `uid=0` (root). Les
fichiers crees via le volume monte `./workspace:/workspace` heritent de cet UID.

**Solutions :**

1. **Immediate (fichiers existants)** : Changer le proprietaire recursivement :
   ```bash
   sudo chown -R $USER:$USER workspace/
   ```

2. **Durable (prochains scans)** : Ajouter `user:` dans docker-compose.yml pour que le
   conteneur tourne avec l'UID/GID de l'utilisateur hote :
   ```yaml
   services:
     strix:
       user: "${UID:-1000}:${GID:-1000}"
   ```

   Les variables `$UID` et `$GID` sont resolues par le shell avant `docker compose`,
   donc la valeur sur l'hote est transmise au conteneur. Valeurs par defaut 1000:1000.

   **Verification :**
   ```bash
   cd /home/gibson/strix && docker compose run --rm --entrypoint id strix
   # → uid=1000 gid=1000 groups=1000  (OK : pas root)
   ```

   #### Acces socket Docker : `group_add` pour le GID du groupe docker

   **Symptome :** Le conteneur tourne en uid non-root mais echoue avec
   `Permission denied` sur `/var/run/docker.sock`.

   **Cause :** Le socket appartient au groupe `docker` sur l'hote (GID variable,
   souvent 999, 126, ou 998). Le conteneur uid=1000 n'est pas dans ce groupe.

   **Solution :** Ajouter `group_add` dans docker-compose.yml en decouvrant le GID
   hote :

   ```bash
   DOCKER_GID=$(getent group docker | cut -d: -f3)
   echo "DOCKER_GID=$DOCKER_GID" >> .env
   ```

   Puis dans docker-compose.yml :
   ```yaml
   services:
     strix:
       user: "${UID:-1000}:${GID:-1000}"
       group_add:
         - "${DOCKER_GID:-999}"
   ```

   **Note :** Le `group_add` est un tableau YAML — chaque element doit etre un
   nombre ou une variable resolue en nombre. La variable `${DOCKER_GID:-999}` donne
   la valeur de l'env DOCKER_GID ou 999 par defaut.

   #### HOME non defini : etat Strix non writable

   **Symptome :** Strix cree son etat dans `/` (ecriture impossible pour uid non-root)
   ou dans un chemin par defaut sans droit d'ecriture.

   **Solution :** Definir `HOME` pointant vers un dossier writable dans le volume
   monte :

   ```yaml
   services:
     strix:
       environment:
         - HOME=/workspace/strix_runs
   ```

   Le dossier `/workspace/strix_runs/` est cree automatiquement par Strix au premier
   scan si writable.

   #### `working_dir` double-nesting des sorties

   **Symptome :** Les resultats de scan apparaissent dans
   `workspace/strix_runs/strix_runs/<run_id>/`.

   **Cause :** Quand `WORKDIR` dans le Dockerfile ET `working_dir` dans
   docker-compose.yml pointent tous deux vers `/workspace/strix_runs`, Strix
   concatene `strix_runs/` depuis ce chemin → double-nesting.

   **Solution :** Separer Dockerfile `WORKDIR` (sous-dossier interne) de
   `working_dir` compose (parent) :

   ```dockerfile
   # Dockerfile
   WORKDIR /workspace/strix_runs
   ```

   ```yaml
   # docker-compose.yml
   services:
     strix:
       working_dir: /workspace
   ```

   Ainsi `./strix_runs/` depuis `/workspace` donne `/workspace/strix_runs/`.

### Function calling non supporté
Strix utilise l'OpenAI Agents SDK qui exige que le modèle réponde avec des
`tool_calls`. Un modèle qui ne supporte pas le function calling produit une
boucle infinie : l'agent retourne du texte → le SDK force une continuation →
l'agent retourne encore du texte → timeout après 50+ itérations.

**Modèles CF confirmés avec function calling :** `@cf/meta/llama-4-scout-17b-16e-instruct`
(⚠ delta booléen en streaming — voir section dédiée),
`@cf/meta/llama-3.3-70b-instruct-fp8-fast` (✅ OK après patch du handler `tool_calls`
— voir section dédiée)
**Modèles CF sans function calling :** `@cf/meta/llama-3.1-70b-instruct` (deprecated)

Tester avant de lancer (voir section Cloudflare Workers AI ci-dessus).

### Réseau Docker : sandbox inaccessible
Quand Strix tourne **dans un conteneur Docker** (docker compose run) et que le
sandbox Caido est créé via le SDK Docker Python, les deux conteneurs sont sur
des réseaux différents. `resolve_exposed_port()` retourne `127.0.0.1:XXXXX`,
mais depuis l'intérieur du conteneur Strix, `127.0.0.1` est le conteneur
lui-même, pas l'hôte. → **InstanceNotReadyError**

**Solution :** `network_mode: "host"` dans le docker-compose.yml du service
Strix. Le conteneur partage la pile réseau de l'hôte, donc le port mappé du
sandbox est joignable.

### Modèle de raisonnement : `content` vide, réponse dans `reasoning_content`

**Constaté sur :** `@cf/moonshotai/kimi-k2.6` (2026-07-09). Comportement partagé par
DeepSeek-R1 et autres reasoning models.

Certains modèles Cloudflare Workers AI (typiquement les modèles de **raisonnement**)
mettent leur réponse finale dans `reasoning_content` et laissent `choices[0].message.content`
vide (`""`). Un client qui ne lit que `content` ne voit rien.

**Tester :**
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions" \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/moonshotai/kimi-k2.6","messages":[{"role":"user","content":"Say hello"}],"max_tokens":50,"stream":false}' \
  | jq '.choices[0].message | {content, reasoning_content}'
```

**Impact sur Strix :** ✅ Aucun. Strix a traité 7/7 checks avec `kimi-k2.6` malgré
le `content` vide. Le SDK ou le handler Strix lit probablement aussi `reasoning_content`
en fallback.

**Bon à savoir :** Le modèle ne souffre pas des bugs de streaming (delta booléen,
ReadError timeout, tool_calls sans id/type) constatés sur Llama 4 Scout et
Llama 3.3. C'est une alternative stable si la fenêtre de contexte suffit pour
la cible.

### Fenêtre de contexte trop petite

Le modèle `@cf/meta/llama-3.3-70b-instruct-fp8-fast` n'a que **24K tokens**
de contexte. Les scans Strix génèrent facilement 30K+ tokens de messages
système + historique. Résultat : erreur 413 "exceeded model context window"
ou erreur 400 "context_length_exceeded".

**Solution :** Utiliser `llama-4-scout` (256K) pour les scans complets, mais
attention : ce modèle a un bug de delta booléen en streaming (voir ci-dessous).

### Streaming SSE : delta booléen (bug Llama 4 Scout)

**Nouveau (2026-07-08) :** Le modèle `@cf/meta/llama-4-scout-17b-16e-instruct`
peut renvoyer `delta: true` (booléen) au lieu de `delta: "texte"` sur l'API
chat completions streamée. Le SDK OpenAI Agents attend un `str` via
`ResponseTextDeltaEvent` :

```
pydantic.ValidationError: 1 validation error for ResponseTextDeltaEvent
delta
  Input should be a valid string [type=string_type, input_value=True, input_type=bool]
```

**Constaté sur :** Workers AI, streaming SSE, charges >100K tokens.

**Impact :** Toute session streamée avec ce modèle a un risque de crash
non-déterministe. Les runs non-streaming (si accessibles) ne déclenchent pas ce bug.

**Solution de contournement la plus fiable :** Utiliser
`@cf/meta/llama-3.3-70b-instruct-fp8-fast` + patcher le handler de streaming
pour les `tool_calls` (voir référence `references/strix-stream-bugs.md`).

### ReadError (timeout streaming ~165K tokens)

**Nouveau :** Pendant le streaming SSE, si le modèle génère un très long flux
(>165K tokens sans terminaison), la connexion HTTP SSE peut expirer côté
client :

```
ReadError: [Errno 104] Connection reset by peer
```

**Cause :** Le SDK utilise une `conn_timeout` unique (paramètre HTTPX) qui
couvre à la fois la connexion initiale et l'écoute du stream.

**Solution de contournement :** Éviter les modèles 256K pour les scans longues
pages. `llama-3.3-70b-fp8-fast` (24K tokens) termine avant le timeout.

### `tool_calls` sans `id`/`type` (stream CF + Llama 3.3)

**Nouveau :** Quand `@cf/meta/llama-3.3-70b-instruct-fp8-fast` répond avec
des `tool_calls`, les chunks SSE de Workers AI peuvent omettre `id` et `type`
dans le delta. Le SDK crée un `FunctionCall` avec `name=None` / `arguments=None` :

```
pydantic.ValidationError
FunctionCall.name
  Input should be a valid string [type=string_type, input_value=None, input_type=None]
```

**Solution (patch du handler SDK) :** Dans le fichier
`site-packages/strix/llm/clients/chatcmpl_stream_handler.py` (ou équivalent
LiteLLM), vers la ligne ~491-495, remplacer l'initialisation de `tool_calls`
par :

```python
tool_calls=[DeltaToolCall(index=0, id="call_0", type="function",
                      function=FunctionCall(name="", arguments=""))]
```

Ceci force des valeurs vides plutôt que `None`, ce que pydantic accepte.
Les chunks suivants remplissent `name` et `arguments` normalement.

**Important :** À refaire après chaque `pip install` / upgrade de Strix.

### Doublon de variable d'env dans docker-compose.yml

Quand on patche manuellement la section `environment:` du docker-compose.yml via
`patch` (Hermes), la correspondance partielle peut laisser une ligne dupliquee :

```yaml
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_API_KEY=${LLM_API_KEY}   # ← doublon apres patch
```

**Verification :** Compter les occurrences apres chaque patch :
```bash
grep -c 'LLM_API_KEY=' docker-compose.yml  # doit retourner 1
```

**Tous les doublons :** Docker Compose prend la **derniere** occurrence d'une
variable dupliquee — pas d'erreur fatale, mais confusion garantie au prochain
editeur humain. Toujours verifier l'absence de doublon dans la section `environment:`.

### `env_file` et `environment:` en conflit

Si `.env` definit une variable ET que la section `environment:` du docker-compose.yml
la surcharge, `environment:` gagne. Ne pas dupliquer par erreur — si `.env` est
fiable, laisser `environment:` vierge pour les variables sensibles et ne garder
que les derivees (celles avec `:-`).

### Premier run long
- Téléchargement sandbox : 11 GB
- Génération des certs CA Caido : 5–15s
- Pull de l'image Python de base : ~150 MB

Ne pas interpréter un délai de 2-3 minutes comme un échec.

## Verifier que Strix est operationnel

Strix est un outil CLI — il n'a **pas de conteneur persistant**. Le docker-compose.yml
utilise `command: ["--help"]` (affiche l'aide et sort). Un `docker ps` vide pour
"strix" est **normal**. L'utilisateur parlant de « strix en marche » refere a
l'environnement pret a lancer des scans, pas a un service qui tourne.

### Procedure de verification

```bash

# 1. L'image existe-t-elle ?
docker images | grep strix

# 2. Le binaire se lance-t-il ?
docker run --rm strix-local --version   # → "strix X.Y.Z"

# 3. Y a-t-il des traces de scans (passes ou en cours) ?
ls workspace/strix_runs/

# 4. Lire les logs du scan le plus recent
head -10 workspace/strix_runs/<run_id>/strix.log
```

### Signes de bon fonctionnement

| Signe | Interpretation |
|---|---|
| `--version` renvoie un numero | Image construite |
| Logs montrent `Starting turn 1, 2, 3...` | Agent dialogue avec le LLM |
| `function_call` dans les logs | Function calling OK |
| `run.json` non vide | Scan termine avec resultats |

### Signes de panne

| Symptome | Cause probable |
|---|---|
| `--version` echoue | Image jamais construite (`docker build`) |
| `--version` affiche la version puis **hang** | LLM API blow up : `--version` lance une connexion LLM une fois le binaire charge ; si LLM_API_KEY invalide ou endpoint HS, le process reste bloque jusqu'au timeout |
| `Retrying failed streamed model request` en boucle | LLM/provider HS (quota, endpoint, modele) |
| `InstanceNotReadyError` | Sandbox HS (certificat Caido, timeout, Docker-in-Docker) |
| `workspace/strix_runs/` vide | Jamais lance de scan |

## Execution de scan et gestion des interruptions

### Scan interrompu : sandbox nettoie en cours de route

**Symptome :** Le scan tourne normalement (14+ turns), tout appel a `exec_command`
renvoie une erreur 404 :

```
docker.errors.APIError: 404 Client Error for docker://...: No such container
```

**Cause :** Le conteneur sandbox (Caido + outils) a ete netoye par Docker alors que
l'agent Strix est encore en train d'executer des outils. Scenarios :
- Le timeout execution de 300s est atteint avant la fin du scan
- Le `docker compose run` timeout (parametre par defaut) expire et Strix
  nettoie le sandbox pendant que l'agent tourne encore
- Plusieurs scans paralleles entrent en conflit sur la creation/destruction
  de conteneurs

**Diagnostic :** Dans le fichier `run.json`, le statut est `"interrupted"` au
lieu de `"completed"`. Les taches restent en `"pending"` dans `todos.json`.
Seule la phase de reconnaissance initiale a ete commencee.

**Chronologie reelle (scan mwana-itech-pages-dev_b1b0, 2026-07-09) :**
```
11:02:13 - Sandbox cree (conteneur 1d8a706189f6)
11:06:41 - session_manager nettoie le sandbox  <- cleanup precoce
11:06:45 - Agent tente exec_command -> 404 "No such container"
```

**Cause racine :** Le timeout du processus parent (`docker compose run` ou
`docker run` sans --timeout suffisant). Le processus parent expire, ce qui
provoque le nettoyage du conteneur sandbox. Les appels asynchrones de l'agent
LLM tombent ensuite sur un conteneur detruit.

**Mitigations :**
1. Augmenter le timeout de `docker compose run` avec `--timeout 600`
2. Augmenter `STRIX_SANDBOX_EXECUTION_TIMEOUT` a 600s dans `.env`
3. Diviser le scan en plusieurs cibles plus petites avec `--scan-mode quick`
4. Utiliser un modele avec grand contexte (256K) pour eviter les boucles
   de raisonnement qui consomment du temps
5. Lancer le scan avec `--max-turns X` reduit pour limiter la duree
   et passer avant le timeout du processus parent
6. Verifier qu'aucun `timeout` shell n'entoure la commande de scan

### Erreur Caido `list_requests` : Invalid HTTPQL query

**Symptome :** Au turn ~10 du scan, l'outil `list_requests` echoue :

```
ERROR strix.tools.proxy.tools: list_requests failed
... Invalid HTTPQL query
```

**Cause :** L'API Caido a evolue et rejette certaines requetes HTTPQL generees
par le SDK Strix. Se produit generalement apres que le navigateur/httpx a
explore le site et que l'agent tente de lister les requetes intercapees.

**Impact :** L'agent ne peut plus consulter le trafic HTTP intercape par Caido,
ce qui bloque l'analyse fine des requetes/reponses. Les outils httpx/katana/nuclei
continuent de fonctionner.

**Contournement :** Aucun patch connu pour Strix. Si `list_requests` echoue :
1. Relancer le scan — l'erreur est non-deterministe
2. Analyser directement les resultats de httpx/katana dans le sandbox
3. Utiliser l'analyse de secours manuelle (voir `references/strix-scan-fallbacks.md`)

### Scan interrompu : analyse de secours manuelle

Quand Strix est interrompu avant la fin (sandbox expire, timeout, Caido defaillant)
ou que le scan est bloque sur une erreur, produire un rapport utile en analysant
la cible directement depuis le terminal :

```bash

# En-tetes HTTP de securite
curl -sI https://cible.com

# Contenu de la page pour empreinte numerique
curl -s https://cible.com | head -100

# Technologies web (framework, CMS, CDN)
curl -s https://cible.com | grep -iE 'wp-content|react|angular|vue|next|astro|gatsby'
```

Combiner avec `web_extract()` (Hermes) pour le contenu parse et l'analyse
fine des en-tetes.

**Structure du rapport de diagnostic (francais) :**

| Section | Contenu |
|---|---|
| 1. Technologies | Hebergement, WAF, CDN, framework, email API, hebergeur |
| 2. En-tetes securite | HSTS, CSP, X-Frame-Options, X-Content-Type, Permissions-Policy |
| 3. Surface d'attaque | Points d'entree, formulaires, endpoints API, exposes (email/tel) |
| 4. Recommandations | Classees par priorite (Haute/Moyenne/Faible) |
| 5. Cause racine echec Strix | Pourquoi le scan n'a pas abouti |

## Voir aussi

- `references/strix-cloudflare-setup.md` — Notes session 1-2 (certificats EC, reseau Docker, fonction calling)
- `references/strix-stream-bugs.md` — Bugs streaming SSE Cloudflare + patches SDK (delta boole, ReadError timeout, tool_calls sans id/type)
- `references/strix-verification.md` — Verification operationnelle detaillee
- `references/strix-scan-fallbacks.md` — Analyse de secours manuelle quand le scan Strix est interrompu
- `strix-pentesting` skill (bundled) — workflow de scan Strix (prerequis obsoletes)
- `references/bash-arithmetic-exit-code.md` — Piege bash `((PASS++))` exit 1 quand PASS=0
- https://usestrix-strix.mintlify.app/ — Documentation Strix officielle
- https://developers.cloudflare.com/workers-ai/ — Documentation Workers AI
