---
name: memory-capture
description: Obligation systematique de capturer les informations importantes en memoire persistante et/ou dans le vault Obsidian. Active a chaque session.
trigger: always-read
priority: 2
---

# Skill : Memory Capture — Sauvegarde Systematique

## Regles Immuables

1. **A chaque session**, si l'utilisateur partage des informations importantes (preferences, decisions, coordonnees, contraintes, decouvertes), les sauvegarder IMMEDIATEMENT.
2. **Ne pas attendre** d'y etre invite. Capturer proactivement.
3. **Target memory** : faits stables sur l'environnement, preferences, conventions.
4. **Target Obsidian** : decisions de projet, documentation, historique de travail.

## Quoi Capturer (Liste Non-Exhaustive)

- Preferences utilisateur (format, ton, style, langue)
- Coordonnees et contacts
- Contraintes techniques (API, quotas, limitations reseau)
- Decisions architecturales ou de design
- Credentials et configurations (sans secrets en clair)
- Workflow decouverts ou valides
- Erreurs recurrentes et leurs solutions
- Conventions de nommage ou de structure

## Comment Capturer

1. **Tool memory** pour les faits personnels et conventions.
   - Exemple : `memory(target='memory', action='add', content='User prefers concise responses without emojis')`
   - Exemple : `memory(target='user', action='add', content='AWS Bedrock quota resets at midnight UTC')`

## Acces au Vault Obsidian

Le vault est situe a : `/home/gibson/Obsidian/`

**Important** : L'acces ne se fait PAS via le MCP `mcp_filesystem` (aucun repertoire autorise). Utiliser les outils natifs Hermes :
- `terminal` pour lister/naviguer
- `read_file` pour lire
- `write_file` pour creer/modifier
- `search_files` pour rechercher

Structure du vault :
- `00_Inbox/` -> Notes brutes temporaires
- `01_Profil/` -> Informations personnelles et profil
- `02_Offres/` -> Opportunites, offres d'emploi
- `03_Projets/` -> Documentation de projets (Terre & Chaleur, Jarvis, etc.)
- `04_Regles/` -> Regles, conventions, skills documentes
- `99_Archives/` -> Archives
- `Attachments/` -> Fichiers joints

3. **Ne JAMAIS** capturer :
   - Des secrets (mots de passe, tokens, cles API) en clair
   - Des logs de session bruts
   - Des informations temporaires ou specifiques a une tache unique

## Verification Post-Capture

Apres chaque ajout :
- Confirmer ce qui a ete sauvegarde
- Indiquer l'emplacement (memoire ou fichier)
- S'assurer que l'information est reutilisable dans une future session

## Format de Note Obsidian Recommande

```markdown
---
date: YYYY-MM-DD
tags: [projet, decision, convention]
---

# Titre de la Note

## Contexte
[Resume de la situation]

## Decision / Information
[Detail precis]

## Raison / Source
[Pourquoi cette decision ?]

## Prochaines Etapes
[Actions a venir si applicable]
```

## Rappel Critique

> "Ce qui n'est pas ecrit est oublie. Ce qui est ecrit est reutilisable."
> 
> Capturer systematiquement = gagner du temps et de la frustration dans les sessions futures.