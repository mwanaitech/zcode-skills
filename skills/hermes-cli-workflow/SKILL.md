---
name: hermes-cli-workflow
description: "Multi-session and multi-platform Hermes CLI workflow patterns: linking CLI with Telegram, profile-based skill loading, wrapper scripts, and common flags for power users."
version: 1.0.0
author: Agent
tags: [hermes, cli, workflow, telegram, sessions, skills, shortcuts]
---

# Hermes CLI Workflow

Hermes CLI power-user patterns for session continuity, multi-platform linking, and efficient skill loading.

## Session Continuity Between CLI and Telegram

The Hermes SQLite session store (`~/.hermes/state.db`) tracks all sessions with `source` (cli/tui/telegram), `session_key`, and `chat_id`. This makes cross-platform session handoff possible.

### Link CLI to a Telegram Session

```
# Reprendre une session Telegram specifique dans le CLI
hermes --resume <SESSION_ID>

# Reprendre la DENIERE session (quel que soit la source)
hermes --continue

# Transférer la session CLI vers Telegram (en session)
/handoff telegram

# Marquer Telegram comme chat "home"
# Dans Telegram: /sethome
```

### Session Key Pattern

Telegram sessions use the key format: `agent:main:telegram:dm:<CHAT_ID>`
Example: `agent:main:telegram:dm:6336259792`

### Slash Commands Cross-Platform

| Command | Effet | Plateforme |
|---------|-------|------------|
| `/handoff <platform>` | Transfère la session active | CLI / Gateway |
| `/sethome` | Définit le chat courant comme home | Gateway (Telegram/Discord/etc.) |
| `--resume <id>` | Reprend une session spécifique | CLI |
| `--continue` | Reprend la dernière session | CLI |

## Profile-Based Skill Loading

Les profils Hermes (dans `~/.hermes/profiles/<name>/`) ont des configs de skills différentes. En CLI, précharger manuellement :

```bash
# Charger un profil complet
hermes -p <profile_name>

# Exemples
hermes -p architect
hermes -p backend-engineer
hermes -p marketing-manager
hermes -p trading
```

### Différence Bureau vs CLI

| | Bureau | CLI |
|---|---|---|
| Skills | Chargés automatiquement selon le profil | Préchargés avec `-s` ou `-p` |
| Sessions | Sélectionnables via UI | `--resume`, `--continue` |
| Gateway | Géré par l'app | `hermes gateway run` |

Tous les skills sont physiquement dans `~/.hermes/skills/` (partagés). Les profils filtrent seulement l'activation.

## Wrapper Scripts

Créer des scripts wrapper dans `~/.hermes/scripts/` avec alias shell pour les patterns fréquents.

### Pattern: Lancer Hermes avec skills par domaine

```bash
#!/bin/bash
# ~/.hermes/scripts/hermes-skill
hermes -s "$1" "${@:2}"
```

### Pattern: Reprendre automatiquement la dernière session Telegram

```bash
#!/bin/bash
# ~/.hermes/scripts/hermes-tg
SESSION=$(sqlite3 ~/.hermes/state.db \
  "SELECT id FROM sessions WHERE source = 'telegram' ...")
[ -n "$SESSION" ] && hermes --resume "$SESSION" || hermes
```

### Alias Bash/Zsh

```bash
# ~/.bashrc ou ~/.zshrc
alias hermes-tg="/home/gibson/.hermes/scripts/hermes-tg"
alias hermes-skill="/home/gibson/.hermes/scripts/hermes-skill"
```

## Common CLI Flags Quick Reference

| Flag | Usage |
|------|-------|
| `-s` / `--skills` | Précharger des skills : `hermes -s trading,finance` |
| `-p` / `--profile` | Utiliser un profil : `hermes -p architect` |
| `--resume ID` | Reprendre une session |
| `--continue` | Reprendre la dernière session |
| `-w` / `--worktree` | Mode worktree isolé (git) |
| `--yolo` | Skip les confirmations |
| `-q` / `--query` | Mode one-shot : `hermes -q "question"` |

## Directory Access and Troubleshooting

### Handling Missing Directories

When a directory referenced in a task (e.g., `/opt/data/mwanaitech-invoices/`) does not exist, follow this workflow:

1. **Verify the path exists**
   ```bash
   ls -la /path/to/directory
   ```
   - If the command returns `No such file or directory`, the path does not exist.

2. **Search for the directory**
   Use `find` to locate the directory if you're unsure of its exact path:
   ```bash
   sudo find / -type d -name "*mwanaitech-invoices*" 2>/dev/null
   ```

3. **Recreate the directory** (if needed)
   ```bash
   sudo mkdir -p /opt/data/mwanaitech-invoices/
   sudo chown gibson:gibson /opt/data/mwanaitech-invoices/
   ```

4. **Use alternative paths**
   If the project is stored elsewhere (e.g., `/home/gibson/projects/mwanaitech/`), update the tools to point to the correct path.

### User Preference: Proactive Automation

The user prefers **direct execution of commands** when troubleshooting or configuring systems. When possible:
- **Execute commands on their behalf** (with permission) rather than providing instructions.
- **Automate repetitive tasks** (e.g., directory creation, file permissions) to save time.

### MCP Filesystem Workaround

If the MCP `filesystem` server is unavailable or misconfigured, use the **terminal** for file operations:
```bash
# List files
ls -la /path/to/directory

# Read files
cat /path/to/file

# Create directories
mkdir -p /path/to/new/directory
```

## Troubleshooting

### WARP + AWS 408 Request Timeout

**Symptôme** : `aws service-quotas` ou `aws bedrock invoke-model` échoue avec 408.
**Cause** : WARP tunnelise le trafic AWS, ajoutant de la latence.
**Fix** : Exclure `*.amazonaws.com` du split-tunnel WARP :

```bash
# Dans WARP GUI ou via gcloud
echo "*.amazonaws.com" >> ~/.warp/split-tunnel/exclude.txt
```

### AWS Service Quotas Limitations

`aws service-quotas list-service-quotas --service-code bedrock` ne retourne que les quotas "configurables". Le quota "Tokens per day" pour Anthropic Claude sur Bedrock **n'apparaît pas** dans l'API CLI — il faut passer par la console web. Le reset se fait à minuit UTC.

### Gateway 8642 vs Serve 9119

| Port | Service | Usage |
|------|---------|-------|
| 8642 | API server local | Conversation gateway, broker CLI/Telegram |
| 9119 | `hermes serve` | Backend headless (desktop app) |
| 9120/9121 | Autres instances Hermes | Peut y avoir plusieurs processus |

## References

- `references/cli-flags.md` — Table complète des flags CLI
- `references/session-schema.md` — Schéma SQLite sessions/messages
