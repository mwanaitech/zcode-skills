---
title: Bilan Journalier
name: bilan-journalier
description: 'Système de bilan journalier : journal des activités Hermes, livré automatiquement sur Telegram à 19h. Utiliser après chaque session de travail ou tâche complexe pour consigner le travail effectué.'
tags:
  - logging
  - daily-report
  - bilan
  - productivity
  - cron
  - reporting
---

# Bilan Journalier — Workflow

## Quand écrire

Après chaque session (ou tâche complexe de 5+ tool calls), créer ou mettre à jour le fichier du jour.

## Structure du log journalier

Le fichier `~/.hermes/daily-bilan/YYYY-MM-DD.md` suit ce format :

```markdown
# Bilan Journalier — JJ Mois AAAA

## Résumé
Une phrase décrivant l'essentiel de la session.

## Travail effectué
- Section par domaine avec sous-points numérotés
- Inclure : skills installés/supprimés, profiles créés/supprimés, config modifiée, décisions d'architecture
- Formulation concise, bullet points

## Problèmes rencontrés
- Erreurs, timeouts, slugs 404, etc.
- Solution ou contournement trouvé

## Notes
- Décisions durables, conventions retenues
- Liens vers les skills ou fichiers pertinents
```

## Cron : livraison automatique à 19h

```bash
# Script de livraison : ~/.hermes/scripts/daily-bilan.sh
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

```bash
# Création du cron (no_agent = script livré tel quel)
cronjob action=create \
  name='Bilan journalier' \
  schedule='0 19 * * *' \
  script='daily-bilan.sh' \
  no_agent=true \
  deliver='telegram:CHAT_ID'
```

## Consulter un bilan

- Manuel : `read_file ~/.hermes/daily-bilan/YYYY-MM-DD.md`
- Automatique : cron livre à 19h sur Telegram
- Recherche : `session_search(query="bilan journalier YYYY-MM-DD")`

## Appliquer les mises à jour du bilan

```bash
# Lire le fichier existant d'abord
read_file ~/.hermes/daily-bilan/YYYY-MM-DD.md

# Utiliser patch (préféré) pour ajouter une section
patch path=~/.hermes/daily-bilan/YYYY-MM-DD.md \
  old_string="<section existante>" \
  new_string="<section existante>\\n\\n### Nouvelle section\\n- point 1\\n- point 2"

# Ou write_file pour remplacer entièrement
write_file path=~/.hermes/daily-bilan/YYYY-MM-DD.md content="..."
```

## Pitfalls

| Problème | Solution |
|----------|----------|
| `patch` échoue car le fichier a été lu partiellement | Relire le fichier entier avant de patcher (`read_file` sans `offset`) |
| `patch` trouve "2 matches" à cause des accents | Lire le fichier avec `read_file` pour avoir les bytes exacts, ou utiliser `replace_all=true` si sûr |
| Frontmatter YAML corrompu après patch (double `---`) | Une ligne `---` de l'ancien frontmatter a survécu. Réécrire tout le fichier avec `write_file` |
| Le cron ne livre pas sur Telegram | Vérifier que `deliver` pointe vers le bon chat_id et que le gateway tourne |
| Oubli de mettre à jour le bilan après une session | Consigner systématiquement après chaque tâche complexe |
| Le script cron utilise le home directory de l'agent | S'assurer que le script est dans `~/.hermes/scripts/` (relatif) et pas un chemin absolu |
| Mémoire pleine (2,200/2,200) quand on ajoute une entrée | Utiliser `operations` array pour supprimer les entrées obsolètes et ajouter en un seul appel |

## Voir aussi

- `references/cron-setup.md` — configuration cron, chat ID, modification
- `domain-skill-organization` → `references/installed-packs.md` — inventory des skills installés et profiles
- `agent-fleet-deployment` → workflow complet de création d'équipe domaine depuis SkillHub
