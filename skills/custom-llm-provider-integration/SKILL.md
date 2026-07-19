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
