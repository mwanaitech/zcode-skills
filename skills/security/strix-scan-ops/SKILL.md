---
name: strix-scan-ops
description: Operational knowledge for running Strix penetration testing scans via Docker Compose. Covers CLI syntax, Docker TTY handling, timeout tuning, model configuration, and troubleshooting common failures. Use when the user references Strix scans, penetration tests, security audits via Strix agent, or asks to run/fix/debug a Strix scan.
version: 1.0.0
author: gibson
platforms:
- linux
triggers:
- strix
- strix scan
- strix agent
- penetration test
- security scan strix
- scan my site
---

# Strix Scan Operations

Workflow and operational notes for running Strix penetration-testing scans via Docker Compose against user-owned targets.

## Syntax correcte

Strix NE prend PAS `scan --url` comme arguments. L'interface correcte est :

```bash
# Quick scan (headless, non-interactive)
cd /home/gibson/strix && docker compose run -T --rm strix -n --target https://example.com --scan-mode quick

# Standard scan
cd /home/gibson/strix && docker compose run -T --rm strix -n --target https://example.com --scan-mode standard

# Deep scan
cd /home/gibson/strix && docker compose run -T --rm strix -n --target https://example.com --scan-mode deep
```

**Parametres :**
- `-n` : mode non-interactif (headless)
- `--target <url>` : cible du scan (pas `--url`, pas `scan --url`)
- `--scan-mode {quick,standard,deep}` : profondeur du scan
- `-v` : version

## Docker-in-Docker : working_dir et HOME

**CRITIQUE** — Eviter le double-nesting des repertoires de resultats.

Quand `docker compose run` est lance depuis `/home/gibson/strix`, Strix cree les resultats dans `$STRIX_RUNS_DIR` (default: `$CWD/strix_runs/`). Si `working_dir: /workspace/strix_runs` est defini, les logs finissent dans `/workspace/strix_runs/strix_runs/<run-name>/` (double-nesting).

**Configuration correcte :**
```yaml
# docker-compose.yml — service strix
working_dir: /workspace
environment:
  HOME: /workspace/strix_runs   # pour que Strix puisse ecrire ~/.strix
group_add:
  - "126"                        # GID du groupe docker sur l'hote
volumes:
  - /var/run/docker.sock:/var/run/docker.sock  # socket Docker
  - ./workspace:/workspace                      # bind mount resultats
```

**Verification de la configuration courante :**
```bash
docker compose run --rm strix sh -c 'echo "HOME=$HOME" && echo "PWD=$PWD" && ls -la /workspace/strix_runs/ | head -5 && ls -la /var/run/docker.sock'
```

## GID Docker hote

Le GID du groupe `docker` sur l'hote varie (typiquement 993, 126, etc.). Verifier avec :
```bash
getent group docker | cut -d: -f3
```
Si le conteneur n'a pas le bon GID dans `group_add`, l'erreur est :
```
PermissionError: [Errno 13] Permission non accordee: /var/run/docker.sock
```

## Flags TTY obligatoire pour headless

**CRITIQUE** : `docker compose run` alloue un pseudo-TTY par defaut. En mode headless, le bash interne essaye `setpgid()` qui echoue avec :
```
bash: impossible de regler le groupe de processus du terminal (-1): Ioctl() inapproprie pour un peripherique
```

**Correctif** : TOUJOURS ajouter `-T` a `docker compose run` :
```bash
docker compose run -T --rm strix -n --target <url> --scan-mode quick
```

## Configuration Docker Compose

Fichier : `/home/gibson/strix/docker-compose.yml`

Variables d'environnement essentielles :
- `STRIX_LLM=openai/@cf/moonshotai/kimi-k2.6` — modele via Cloudflare Workers AI
- `LLM_API_KEY=<cle>` — cle API Cloudflare
- `LLM_API_BASE=https://api.cloudflare.com/client/v4/accounts/<account-id>/ai/v1/` — URL directe Cloudflare
- `STRIX_REASONING_EFFORT=medium` — medium ou high
- `STRIX_IMAGE=strix-sandbox-fixed` — image sandbox custom (11GB)
- `STRIX_SANDBOX_CONNECT_TIMEOUT=60`
- `STRIX_SANDBOX_EXECUTION_TIMEOUT=300`
- `STRIX_AGENT_TIMEOUT=600` — timeout global agent (souvent insuffisant)
- `network_mode: host` — requis pour acceder a la sandbox

## Timeouts et duree

- **`--help` bloque** : Strix fait un appel API LLM meme pour `--help`. Attendre 15-20s au moins.
- **Timeout 600s** est insuffisant pour un scan quick avec Cloudflare Workers AI (~7-15s/llm call). Un scan quick dure ~15-30 minutes.
- **Workaround** : lancer en arriere-plan avec `notify_on_complete=true` :
  ```bash
  docker compose run -T --rm strix -n --target <url> --scan-mode quick
  ```
  (en background terminal, avec un timeout eleve comme 3600)

## Timeout LLM streaming (httpx.ReadTimeout)

**Symptome :** le scan echoue avec `httpx.ReadTimeout` ou `httpcore.ReadTimeout` apres ~10 minutes d'attente. La stacktrace remonte via :
- `openai/_streaming.py` → `httpx/_transports/default.py` → `httpcore/_async/http11.py`

**Cause :** le fournisseur LLM (kimi-k2.6 via CF Workers AI) a interrompu sa reponse en cours de streaming. Les appels precedents peuvent avoir fonctionne normalement (~5-25s chacun).

**Que faire :**
1. **Retenter le scan** — le timeout est souvent transitoire. Si 7/8 appels LLM ont reussi, relancer suffit generalement.
2. **Definir un timeout plus court** — Strix n'expose pas de flag `--timeout`. Passer `OPENAI_TIMEOUT=120` ou `STRIX_AGENT_TIMEOUT=120` dans `.env` peut forcer un abandon plus rapide au lieu d'attendre ~10 minutes.
3. **Changer de modele** — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` ou `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` peuvent etre plus stables.
4. **Ne pas considerer les resultats comme definitifs** — le scan echoue avec `status: failed` et 0 vulnerabilites. Les tours accomplis avant le timeout sont perdus.

**Token caching :** Strix reutilise massivement le cache (ex: 199K/210K tokens cached). C'est normal mais peut masquer des changements de comportement du modele apres un flush de cache.

## Verification ad-hoc des configurations (avant/pendant un scan)

Quand on modifie les fichiers Docker/configuration de Strix, utiliser un script shell autonome qui rapporte chaque test explicitement :

```bash
#!/bin/bash
# Script de verification — ne PAS utiliser set -e
# Utiliser P=$((P+1)) et F=$((F+1)) pour les compteurs
total=0; pass=0; fail=0

check() {
    total=$((total+1))
    desc="$1"
    if eval "$2"; then
        pass=$((pass+1)); echo "PASS  $desc"
    else
        fail=$((fail+1)); echo "FAIL  $desc"
    fi
}

check "description" "command_to_test"
check "autre test" "test -f /path/to/file"
# ...

echo "---"
echo "Total: $total | PASS: $pass | FAIL: $fail"
exit $((fail > 0))
```

**Pieges evites :**
- `set -e` ferait sortir des le premier FAIL sans rapport complet
- `((PASS++))` retourne exit 1 quand PASS=0 (arithmetic expansion bash)
- Toujours utiliser `P=$((P+1))` — plus robuste

## Fichiers de resultats

- Output dir : `/home/gibson/strix/workspace/strix_runs/<run-name>/`
- `strix.log` — log complet du scan
- `run.json` — resultats du scan (proprietaire root, illisible sans sudo)
- `.state/agents.db` — base de donnees des agents
- `.state/notes.json` / `.state/todos.json` — notes et taches du scan

Les fichiers sont racine root `-` restent illisibles par gibson sans sudo (mot de passe requis). Voir `notes.json` pour le resume du scan si accessible.

## Resume de scan (reprise)

Pour reprendre un scan existant :
```bash
docker compose run -T --rm strix --resume <run-name>
```

## Pitfalls

- **`--help` ne donne pas la syntaxe** : il declenche un appel LLM et ne renvoie pas l'aide locale. Consulter ce skill ou le code source.
- **Scan `--url` invalide** : l'utilisateur a tente `strix scan --url <url>` — la bonne syntaxe est `-n --target <url>`.
- **Recuperation des resultats** : les fichiers root-owner ne sont pas accessibles. Demander a l'utilisateur de les rendre lisibles avec `sudo chown -R gibson:gibson workspace/strix_runs/<run-name>/` si besoin.
- **Double `LLM_API_KEY`** : verifier que docker-compose.yml n'a pas de lignes dupliquees apres `env_file: .env`.
- **Sandbox cleanup race** : le session_manager nettoie la sandbox avant la fin du raisonnement LLM — `STRIX_AGENT_TIMEOUT` plus eleve peut aider.
- **Caido HTTPQL query error** : erreur non-fatale de l'API GraphQL Caido (`Invalid HTTPQL query`). Le scan continue.
- **Workdir root-owned** : le dossier `workspace/` est cree par le conteneur root. Les scans ulterieurs creent de nouveaux sous-dossiers root-owner. Aucun impact sur le fonctionnement.
- **Double-nesting strix_runs/** : si `working_dir: /workspace/strix_runs`, les logs finissent dans `/workspace/strix_runs/strix_runs/<run-name>/`. Utiliser `working_dir: /workspace`.
- **Docker socket permission denied** : le conteneur doit avoir `group_add: ["<GID>"]` avec le GID du groupe `docker` de l'hote (verifier avec `getent group docker | cut -d: -f3`).
- **HOME pointe vers un sous-dossier inaccessible** : Strix ecrit `~/.strix` dans `$HOME`. Si `$HOME` est un sous-dossier de `/workspace`, il doit exister. Definir `HOME=/workspace/strix_runs`.
- **httpx.ReadTimeout sur kimi-k2.6** : timeout transitoire du fournisseur LLM en cours de streaming. Relancer le scan ou changer de modele. Voir section "Timeout LLM streaming".
- **Aucune vulnerabilite apres echec** : un scan qui echoue sur timeout LLM rapporte 0 vuln mais n'a pas termine son analyse. Ne pas considerer le resultat comme definitif.
- **Verification script avec `set -e`** : un script de verification qui utilise `set -e` s'arrete au premier FAIL sans rapport complet. Toujours utiliser le pattern `P=$((P+1))` / `F=$((F+1))` avec retour explicite.

## Fichiers de reference

- `references/strix-llm-provider-setup.md` — configuration du provider Cloudflare Workers AI pour Strix
- `references/strix-sandbox-build.md` — build de strix-sandbox-fixed