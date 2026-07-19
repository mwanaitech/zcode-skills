# Telegram-to-CLI Session Mapping

## Session Key Format

Telegram sessions in `~/.hermes/state.db` use the session key:

```
agent:main:telegram:dm:<CHAT_ID>
```

Example: `agent:main:telegram:dm:6336259792`

## Query Last Telegram Session

```sql
SELECT id, source, chat_id, title, datetime(started_at,'unixepoch')
FROM sessions
WHERE source = 'telegram' AND chat_id = '6336259792'
ORDER BY started_at DESC
LIMIT 1;
```

## Cross-Platform Commands

| Goal | Command |
|------|---------|
| Resume Telegram in CLI | `hermes --resume <SESSION_ID>` |
| Resume last session (any source) | `hermes --continue` |
| Handoff CLI to Telegram | `/handoff telegram` (in session) |
| Set Telegram as home chat | `/sethome` (in Telegram) |

## Wrapper Script: hermes-tg

```bash
#!/bin/bash
# ~/.hermes/scripts/hermes-tg
SESSION=$(sqlite3 ~/.hermes/state.db \\
  "SELECT id FROM sessions \\
   WHERE source = 'telegram' AND chat_id = '6336259792' \\
   ORDER BY started_at DESC LIMIT 1")
[ -n "$SESSION" ] && hermes --resume "$SESSION" || hermes
```

## Session Sources in DB

```sql
SELECT DISTINCT source FROM sessions;
-- Returns: telegram, tui, cli, discord, slack, etc.
```
