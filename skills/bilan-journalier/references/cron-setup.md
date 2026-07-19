# Daily Bilan — Cron Setup Reference

Created: 2026-06-30
Delivered: Telegram chat_id=6336259792 (@Gibson2528)
Schedule: 0 19 * * * (19:00 Gabon time, UTC+1)

## Script

`~/.hermes/scripts/daily-bilan.sh`

```bash
#!/bin/bash
BILAN_DIR="$HOME/.hermes/daily-bilan"
DATE=$(date +%Y-%m-%d)
FILE="$BILAN_DIR/$DATE.md"

if [ -f "$FILE" ]; then
  echo "📋 *Bilan Journalier — $DATE*"
  echo ""
  cat "$FILE"
else
  echo "📋 *Bilan Journalier — $DATE*"
  echo "Aucune activité enregistrée aujourd'hui."
fi
```

## Cron job config

```
name: Bilan journalier
schedule: 0 19 * * *
script: daily-bilan.sh
no_agent: true
deliver: telegram:6336259792
```

## Modifier

```bash
# Voir les jobs
cronjob action=list

# Modifier la livraison (ex: vers un autre chat)
cronjob action=update job_id=<id> deliver='telegram:AUTRE_CHAT_ID'

# Désactiver temporairement
cronjob action=pause job_id=<id>
```
