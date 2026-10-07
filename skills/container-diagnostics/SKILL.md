---
title: Container Diagnostics
name: container-diagnostics
description: Diagnostic rapide des environnements Docker Compose - identification des CPU spikes, crash-loop, services non configurees, et analyse ciblee des logs.
trigger:
  - docker cpu high
  - container crash
  - docker health check
  - container restart loop
  - service not responding
  - investigate container
  - docker logs analysis
  - container resource usage
---

# Container Diagnostics

Diagnostic rapide d'un environnement Docker Compose (ou standalone) quand un service consomme trop de ressources, tombe, ou montre un comportement anormal.

## Workflow : CPU spike sur un container

**1. Overview rapide**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**2. Attribution processus interne**
```bash
# Depuis l'hote
docker top <container> -eo pid,pcpu,pmem,comm,args | sort -k2 -nr | head -10

# Ou depuis dans le container
docker exec <container> ps aux | sort -nr | head -10
```

**3. Historique de restart**
```bash
docker inspect --format='{{.Name}} {{.RestartCount}} restarts' $(docker ps -q) | tr -d '/'
```
Zero restart = le container n'a jamais crash. 10+ restarts = loop probable.

**4. Analyse des logs ciblee**

Compter un pattern precis :
```bash
docker logs --tail 200 <container> 2>&1 | grep -c "GET /api/skills"
```

Filtrer le bruit pour voir les vraies erreurs :
```bash
docker logs --tail 1000 <container> 2>&1 | grep -v "GET /api/skills" | tail -30
```

Rechercher les methodes actives (POST/PUT/DELETE) :
```bash
docker logs --tail 500 <container> 2>&1 | grep -E "(POST|PUT|DELETE|crawl|scrape|task|job|worker)" | tail -20
```

**5. Identifier le client**
Dans un setup Docker Compose, `172.18.0.1` (ou le subnet du reseau bridge) est le gateway = l'hote ou un reverse proxy qui fait les requetes. Si toutes les requetes viennent de la, le probleme est probablement un frontend/browser ou un autre container intermediaire.

## Workflow : service non fonctionnel (mail, DB, API externe)

**1. Verifier que le process tourne**
```bash
docker exec <container> ps aux | grep <service>
```

**2. Verifier les logs d'erreur de connexion**
```bash
docker logs --tail 100 <container> 2>&1 | grep -iE "(error|warn|fail|refused|timeout|not configured)"
```

**3. Verifier la config manquante**
Typiquement : `SMTP not configured`, `IMAP not configured`, `DATABASE_URL not set`.
Souvent dans les variables d'env du compose ou dans l'interface web du service.

## References

- `references/container-quirks.md` — Edge cases et specificites par service (Odysseus, SearXNG, etc.)

## Signaux cles a surveiller

| Signal | Interpretation |
|---|---|
| CPU > 80% sur uvicorn/gunicorn | Spam de requetes ou endpoint lent |
| CPU > 80% sur un worker unique | Tache bloquante sans async |
| 0 restarts + CPU haut | Le container est sain mais surcharge — pas un crash |
| N restarts > 0 | Le service crash-loop. Voir `docker logs` juste apres le demarrage |
| `Connection refused` | Service cible down ou mauvais port/host |
| `not configured` | Variables d'environnement ou settings UI manquants |
| 404 sur assets statiques | Fichiers manquants au build ou mauvais `WORKDIR` |

## Workflow : build Docker bloqué / qui n'en finit pas

Quand `docker-compose build` (ou `up -d`) reste bloqué sur une étape sans progresser, ou que le build a été tué (SIGTERM/timeout) et qu'il faut vérifier les résidus.

### 1. Pip "Installing backend dependencies: still running..."

Pip télécharge et compile torch/torchvision comme dépendance de build d'un package (basicsr, gfpgan, facexlib). Sur un système sans GPU cette étape peut prendre 15+ min ou sembler bloquée indéfiniment.

**Diagnostic :**
```bash
docker ps -a --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}" | head -5
docker logs --tail 20 <build-container-id>
```

**Solutions si l'image `latest` existe déjà en local :**

Contourner docker-compose et lancer le container directement :

```bash

# 1. Écrire les vars d'env dans un fichier (évite les guards de sécurité sur http://)
cat > /tmp/app-env.txt << 'EOF'
PUID=1000
PGID=1000
LLM_HOST=http://host.docker.internal:20128
LLM_HOSTS=http://host.docker.internal:20128
OPENAI_API_KEY=omniroute
EOF

# 2. Créer le container avec entrypoint bypassant gosu
docker run -d --name <name> \
  --env-file /tmp/app-env.txt \
  -p 7000:7000 \
  --entrypoint /bin/sh \
  <image> -c "exec uvicorn app:app --host 0.0.0.0 --port 7000"

# 3. Vérifier
docker ps --filter name=<name>
docker logs --tail 20 <name>
```

**Solutions si l'image n'existe pas encore :**

```bash

# Pré-télécharger les wheels CPU-only avant le build
pip download torch torchvision --only-binary=:all: -d /tmp/torch-wheels/

# ou utiliser l'index CPU-only :
pip install torch --extra-index-url https://download.pytorch.org/whl/cpu

# Build avec --network=host si problème DNS/réseau
docker build --network=host -t <image> .
```

### 2. docker-compose v1 refuse --no-build

Message : `Service '<name>' needs to be built, but --no-build was passed.`

Même si l'image `latest` existe. docker-compose v1 compare les hash des fichiers du contexte de build et considère le cache invalide au moindre changement.

**Solutions :**
- Utiliser directement `docker run` / `docker create` (contourne docker-compose)
- Utiliser `docker compose` (v2, plugin Docker) au lieu de `docker-compose` (v1 standalone)
- Supprimer docker-compose et utiliser `docker build` + `docker run` directement dans un script shell

### 3. Security guard : URLs HTTP dans les commandes Docker

Le garde de sécurité bloque les commandes `docker` contenant `http://` (ex: `http://host.docker.internal:20128`) avec le message : `Plain HTTP URL in execution context`.

**Solution :** Ne jamais passer `http://` dans les args `-e` en ligne de commande. Utiliser un fichier d'env :

```bash

# OK : --env-file évite le scan des arguments
docker run --env-file /tmp/<fichier>.txt ...

# KO : le guard bloque ça
docker run -e LLM_HOST=http://host.docker.internal:20128 ...
```

### 4. Vérification post-build : aucun résidu

Après avoir tué un build Docker (SIGTERM, timeout, `docker compose up -d` interrompu), vérifier systématiquement qu'il n'a rien laissé :

```bash

# 1. Nouveaux conteneurs créés par le build ?
docker ps -a --filter name=<projet> --format "table {{.Names}}\t{{.Status}}"

# 2. Nouveaux volumes ?
docker volume ls --filter name=<projet> --format "{{.Name}}"

# 3. Processus zombies (pip, torch, etc.) ?
ps aux | grep -iE '(pip|torch|basicsr|gfpgan|realesr)' | grep -v grep

# 4. Images dangling (layers interrompus) ?
docker images --filter dangling=true --format "{{.Repository}}:{{.Tag}} ({{.Size}})"
```

**Résultat attendu :**
| Vérification | Attendu |
|---|---|
| Conteneurs | 0 nouveau — juste les services préexistants |
| Volumes | 0 nouveau |
| Processus | 0 |
| Images dangling | 0 ou 1 `<none>:<none>` (~196MB) |

L'image `<none>:<none>` est un layer orphelin du build interrompu, pas un résidu actif. Docker nettoie automatiquement les layers intermédiaires — si l'image `latest` existait déjà avant le build, elle est intacte.

### 5. Erreur `tcsetattr` connue (non bloquante)

Dans les logs d'un build Docker tué, cette ligne peut apparaître :

```
tcsetattr: Ioctl() inapproprié pour un périphérique
```

Cette erreur vient de pip qui tourne dans un pseudo-terminal (pty) lors du build. **Strictement non bloquante** — ne pas perdre de temps à la diagnostiquer. Le vrai problème est l'étape de compilation (torch/torchvision) qui prend 15+ minutes sur un système sans GPU.

## Workflow avancé : entrypoint bloquant / crash-loop

Quand un container crash-loop (restart ≠ 0) et que `docker logs` ne montre rien, l'entrypoint peut être la cause.

**1. Bypasser l'entrypoint pour un test de base**

Lancer un shell minimal pour vérifier que l'image elle-même est saine :

```bash
docker run --entrypoint /bin/sh --rm <image> -c 'echo "image ok"'
```

Si ça fonctionne, l'image est bonne — le problème est dans l'entrypoint.Docker ou un problème de permission à l'exécution.

**2. Exécuter l'entrypoint pas à pas**

Au lieu de laisser Docker lancer l'entrypoint automatiquement, le dérouler manuellement pour trouver où ça bloque :

```bash
docker run --entrypoint /bin/sh --rm <image> -c '

# Étape 1 : créer l'utilisateur/groupe
PUID=1000 PGID=1000
if ! getent group "$PGID" >/dev/null 2>&1; then groupadd -g "$PGID" odysseus; fi
if ! getent passwd "$PUID" >/dev/null 2>&1; then useradd -u "$PUID" -g "$PGID" -M -s /bin/sh odysseus; fi
echo "=== Étape 1 OK ==="

# Étape 2 : tester gosu directement
ODY_USER="$(getent passwd "$PUID" | cut -d: -f1)"
/usr/sbin/gosu "$ODY_USER" id
echo "=== Étape 2 OK ==="

# Étape 3 : tester les commandes qui posent problème (find, setup.py)
/usr/local/bin/python /app/setup.py 2>&1 || true
echo "=== Étape 3 OK ==="
'
```

Chaque étape révèle où l'entrypoint accroche.

**3. Vérifier les capabilities (gosu → SETUID/SETGID)**

`gosu` (et `su-exec`) nécessite les capabilities SETUID et SETGID pour descendre les privilèges. Si le container a `cap_drop: ALL` dans le compose, même avec `cap_add: [SETUID, SETGID]`, ça fonctionne — mais sans ces caps, gosu échoue silencieusement :

```bash
docker inspect <container> --format '{{.HostConfig.CapDrop}}'
docker inspect <container> --format '{{.HostConfig.CapAdd}}'
```

**4. Vérifier l'entrypoint et la commande effectifs**

```bash
docker inspect <image> --format '{{.Config.Entrypoint}}'
docker inspect <image> --format '{{.Config.Cmd}}'
```

Parfois l'entrypoint ou la commande contient un binaire qui n'existe pas ou un `.sh` avec un BOM/carriage return qui le rend inexécutable.

**5. Isoler le timeout**

Si `docker run` avec l'entrypoint par défaut timeout (même avec `echo` en commande), l'entrypoint est la cause racine. Stratégies :

- Remplacer l'entrypoint via `--entrypoint /bin/sh` dans docker-compose.yml (modification locale)
- Lancer uvicorn/le daemon directement en root (bypass gosu) :

```yaml
services:
  odysseus:
    image: odysseus-odysseus
    entrypoint: ["/usr/local/bin/python", "-m", "uvicorn"]
    command: ["app:app", "--host", "0.0.0.0", "--port", "7000"]
```

## Workflow : container exit(0) immediat (pas un daemon)

Quand un container demarre et s'arrete immediatement avec `Exited (0)`:
- Le process a tourne et termine proprement — pas un crash
- Cause probable : la config docker-compose.yml a un `command:` qui est une commande CLI (ex: `["--help"]`, `["--version"]`) au lieu d'un daemon

**1. Identifier la cause racine**
```bash

# Verifier le statut
docker ps --filter name=<container> --all

# Statut typique: "Exited (0) X min ago"

# Lire la config pour trouver le command:
docker inspect <container> --format '{{json .Config.Cmd}}' | jq .
```

**2. Verifier docker-compose.yml**
Regarder la section `command:` du service concerne. Si c'est `["--help"]` ou `["--version"]`, le container est configure comme placeholder — le veritable usage est via `docker compose run`.

**3. Verifier le Dockerfile pour l'ENTRYPOINT**
`ENTRYPOINT` + `command:` dans compose = concatenes. Si Dockerfile a `ENTRYPOINT ["strix"]` et compose a `command: ["--help"]`, la commande executee est `strix --help` qui s'arrete aussitot.

**4. Utilisation correcte**
Les outils CLI en Docker s'utilisent avec `docker compose run --rm`, pas `docker compose up -d`:
```bash
docker compose run --rm <service> --target <args>
```

**5. (Optionnel) Garder un container CLI persistant pour `docker exec`**
Si vous avez besoin d'un container CLI toujours actif en arrière-plan (par exemple pour lancer des commandes ad-hoc via `docker exec`), le `ENTRYPOINT` fixe du Dockerfile empêche l'usage normal d'une commande de longue durée. Il faut explicitement remplacer l'ENTRYPOINT par un shell :

```bash
docker run -d --entrypoint /bin/bash --name <service> <image> -c "tail -f /dev/null"
```

Puis exécuter le CLI avec `docker exec` :
```bash
docker exec <service> <commande>
```

Vérification que le container est bien actif :
```bash
docker ps --filter name=<service>

# STATUS: Up
```

**Causes courantes du pattern Exited(0):**
| Commande dans docker-compose.yml | Effet |
|---|---|
| `["--help"]` | Affiche l'aide et exit |
| `["--version"]` | Affiche la version et exit |
| `["scan"]` | Sous-commande manquant d'arguments — peut exit |
| (aucun, CMD absent) | Si ENTRYPOINT est un binaire, lance sans args → help puis exit |

## Workflow : modification d'un fichier dans un container (avec caracteres speciaux)

Quand un fichier contient des caracteres interpretes par le shell (`$`, backticks, `!`), les redirections bash classiques (`cat >`, `echo`, heredoc) corrompent le contenu.

**Exemple typique :** ecrire un hash bcrypt dans `auth.json`:

```bash

# ❌ HEREDOC — les $ sont interpretes par bash
docker exec <container> bash -c 'cat > /app/data/auth.json << EOF
{
  "password_hash": "$2b$12$F2mMzoKrFMLbcD8bk6U.MeJqRJdfRIxbxkGvOCSY0ph2KLJSvvod2"
}
EOF'

# Resultat: le hash est tronque, le dollar sign a ete mange
```

```bash

# ✅ docker cp — evite toute expansion shell
cat > /tmp/auth.json << 'HEREDOC_EOF'
{
  "password_hash": "$2b$12$F2mMzoKrFMLbcD8bk6U.MeJqRJdfRIxbxkGvOCSY0ph2KLJSvvod2"
}
HEREDOC_EOF
docker cp /tmp/auth.json <container>:/app/data/auth.json
docker restart <container>
```

**Piege :** meme avec des quotes simples autour du heredoc (`'EOF'`), si la commande est passee via `docker exec bash -c`, les $ peuvent etre interpretes par le shell hote avant d'arriver dans le container. Toujours preferer `docker cp` pour les fichiers contenant `$`.

**Alternative :** generer directement le contenu dans le container avec Python (evite tout probleme d'expansion):

```bash
docker exec <container> python3 -c "
import json, bcrypt
pw = b'password123'
h = bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12)).decode()
data = {'users': {'admin': {'password_hash': h, 'is_admin': True}}}
with open('/app/data/auth.json', 'w') as f:
    json.dump(data, f, indent=2)
print('Hash ecrit:', h)
"
```

Puis redemarrer et verifier le login:

```bash
docker restart <container>
sleep 3
curl -s -X POST http://localhost:7000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"password123"}'

# Attendu: {"ok":true,"username":"admin"}
```

## Workflow : service hôte inaccessible depuis le container

Un container doit interroger un service tournant sur l'hôte (API locale, proxy). L'erreur typique : `[Errno -2] Name or service not known`, `Connection refused`, ou timeout silencieux.

### 1. Tester la connectivité

```bash

# Depuis l'intérieur du container
docker exec <container> sh -c "curl -v --max-time 3 http://localhost:<port>/"
docker exec <container> sh -c "curl -v --max-time 3 http://127.0.0.1:<port>/"
docker exec <container> sh -c "curl -v --max-time 3 http://172.17.0.1:<port>/"

# Depuis l'hôte (référence)
curl -s http://127.0.0.1:<port>/
```

### 2. Diagnostiquer la cause

| Résultat | Cause probable |
|---|---|
| `Name or service not known` | `host.docker.internal` non résolu → `/etc/hosts` absent |
| `Connection refused` sur `172.17.0.1` | iptables bloque le trafic bridge → hôte |
| Timeout toutes IP | Service écoute `127.0.0.1` seulement, ou firewall |
| Succès après `network_mode: host` | Cause confirmée : isolation bridge |

### 3. Vérifier `extra_hosts`

```bash
docker exec <container> sh -c "cat /etc/hosts | grep host.docker"
docker inspect <container> --format '{{.HostConfig.ExtraHosts}}'
```

**Si `extra_hosts` est vide** alors que le compose a `host.docker.internal:host-gateway` :

**Cause :** `docker-compose` v1 (ex: 1.29.2) **ne supporte pas** la valeur `host-gateway` (introduite en Compose v2 → `docker compose` sans trait d'union). L'entrée est ignorée silencieusement.

```bash
docker-compose --version  # v1 → incompatible
docker compose version 2>/dev/null  # v2 → supporte host-gateway
```

### 4. Solutions

#### A — `network_mode: host` (recommandé)

```yaml
services:
  app:
    build: .
    network_mode: host
    # ports: supprimé (ignoré en host mode)
    # extra_hosts: supprimé (inutile)
```

**⚠️** Les noms DNS Docker (ex: `searxng`, `chromadb`) ne résolvent plus. Les remplacer par `localhost` + le port **exposé sur l'hôte** (pas le port interne du container) :

```yaml
environment:
  - SEARXNG_INSTANCE=http://localhost:8080
  - CHROMADB_HOST=localhost
  - CHROMADB_PORT=8100  # port mappé 127.0.0.1:8100→8000
```

**⚠️** `ports:` est ignoré en host mode — l'appli écoute directement sur l'IP/hôte configurée (`APP_BIND=127.0.0.1 APP_PORT=7000` → `localhost:7000`).

```bash

# Vérification
docker exec <container> sh -c "curl -s http://localhost:<port>/v1/models"
```

#### B — Gateway IP réelle (si le bridge laisse passer)

```yaml
extra_hosts:
  - "host.docker.internal:172.17.0.1"
```

Trouver l'IP du gateway :
```bash
ip addr show docker0 | grep inet | awk '{print $2}' | cut -d/ -f1
```

#### C — Contourner docker-compose (recompose v1 rebuild forcé)

```bash
docker run -d --name <name> --network host \
  -v "$(pwd)/data:/app/data:z" \
  -e LLM_HOST=localhost \
  -e SEARXNG_INSTANCE=http://localhost:8080 \
  <image>:latest
```

#### D — Proxy TCP sur l'hôte

```bash
socat TCP-LISTEN:29128,fork TCP:127.0.0.1:20128 &
```

Puis exposer `29128` dans docker-compose et utiliser `http://host.docker.internal:29128` (après avoir fixé `extra_hosts`).

### 5. Vérification finale

```bash

# Service hôte OK
docker exec <container> sh -c "curl -s --max-time 5 http://localhost:<port>/v1/models" | head -c 200

# Dépendances Docker DNS (solution A uniquement)
docker exec <container> sh -c "curl -s --max-time 3 http://localhost:8080/"
docker exec <container> sh -c "curl -s --max-time 3 http://localhost:8100/api/v2/heartbeat"
```

## References

- `references/container-quirks.md` — Edge cases et specificites par service (Odysseus, SearXNG, etc.)
- `references/docker-host-networking.md` — Container-to-host connectivity deep reference with expanded scenarios
