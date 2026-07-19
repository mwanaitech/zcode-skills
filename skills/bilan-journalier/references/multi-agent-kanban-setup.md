# Multi-Agent Kanban — Architecture & Setup

## Architecture finale (13 agents)

```
default (orchestrateur — toi, gateway running)
 ├── code-reviewer         ← audit sécurité, PR, qualité
 ├── refactorer            ← DDD, dette technique, clean code
 ├── api-designer          ← conception API, doc OpenAPI, tests
 ├── devops-engineer       ← Tencent Cloud infra (Lighthouse, COS, DNS, CDN)
 ├── image-processor       ← GraphicsMagick (ls-gm-img) : retouche, batch, conversion
 ├── ui-ux-designer        ← UI/UX, design system, brand, prototype (18 skills)
 ├── marketing-manager     ← social media, copywriting, concurrence, croissance, events (19 skills)
 ├── ecommerce-manager     ← promotion, copy produits, pricing, PPC, sélection (13 skills)
 ├── finance-manager       ← quant/backtesting, reports financiers, investment research, business analysis (17 skills)
 ├── education-manager     ← programmes formation, plans cours, quiz, évaluation (9 skills)
 ├── academic-manager      ← Gaokao, paper search, academic writing, statistiques (14 skills)
 └── legal-manager         ← litige, recherche juridique, contrats, compliance (10 skills)
```

Chaque profil spécialisé a ses propres skills symlinkés depuis les sources SkillHub installées à la racine `~/.hermes/skills/`. Kanban auto-enregistre tout nouveau profile comme assignee potentiel.

## Créer un profil spécialisé pour un nouveau domaine

```bash
hermes profile create <nom> \
  --clone \
  --description "Rôle : description des compétences pour le routage Kanban"
```

Le `--description` est important — il sert au Kanban decomposer.

## Installer des skills SkillHub + les intégrer dans un profil

### Cas 1 : skill individuelle (slug connu)

```bash
skillhub install <slug> --dir ~/.hermes/skills/
```

### Cas 2 : pack (skillspackage URL) — le slug direct est 404

Les URLs de type `https://skillhub.cn/skillspackage/<nom>` sont des collections, pas des skills individuelles. Le slug n'existe pas dans l'index SkillHub.

Procédure :
```bash
# 1. Chercher les skills individuelles par mot-clé
skillhub search "<mot-clé>" | grep "  [a-z]"

# 2. Installer chaque skill trouvée
skillhub install <slug1> --dir ~/.hermes/skills/
skillhub install <slug2> --dir ~/.hermes/skills/

# 3. Vérifier l'installation
ls ~/.hermes/skills/<slug>/SKILL.md
```

### Symlinker dans le profil cible

```bash
ln -s ~/.hermes/skills/<dossier> ~/.hermes/profiles/<profil>/skills/<dossier>
```

Vérifier :
```bash
ls ~/.hermes/profiles/<profil>/skills/<dossier>/SKILL.md
hermes kanban assignees  # doit montrer le nouveau profile
```

### Ajouter des triggers d'auto-chargement

Tout skill SkillHub installé manque de `metadata.hermes.triggers`. Les ajouter systématiquement dans le frontmatter du SKILL.md :

```yaml
tags:
  - domaine
  - sous-domaine

metadata:
  hermes:
    triggers:
      - mot clé fr
      - mot clé en
      - variantes
```

Règles :
- Toujours mettre FR et EN (l'utilisateur parle français, mais l'agent détecte aussi l'anglais)
- Minimum 15-30 triggers par skill pour une couverture correcte
- Inclure les termes techniques, le jargon du domaine, et les synonymes courants

## Kanban Dispatcher

```yaml
# ~/.hermes/config.yaml
kanban:
  dispatch_in_gateway: true
```

```bash
hermes kanban init              # créer le board (une fois)
hermes kanban list              # voir les tâches
hermes kanban assignees         # voir les profiles disponibles
```

### Créer une hiérarchie de tâches

```bash
# Tâche parent
hermes kanban create \
  --priority 5 \
  --goal "Projet X - Orchestration" \
  --body "Description globale"

# Sous-tâches routées aux spécialistes — TOUJOURS avec --parent
hermes kanban create \
  --assignee refactorer \
  --parent t_parent_id \
  --priority 4 \
  --skill code-refactoring-senior \
  --goal "Concevoir architecture DDD" \
  --body "Modules, bounded contexts, événements"

hermes kanban create \
  --assignee code-reviewer \
  --parent t_parent_id \
  --priority 3 \
  --skill code-review-senior \
  --goal "Auditer sécurité Stripe/JWT" \
  --body "Vérifier les flows paiement, tokens, OWASP top 10"

hermes kanban create \
  --assignee api-designer \
  --parent t_parent_id \
  --goal "Documenter API REST" \
  --body "Endpoints, schémas, OpenAPI 3.0"

hermes kanban create \
  --assignee devops-engineer \
  --parent t_parent_id \
  --goal "Déployer sur Tencent Cloud Lighthouse" \
  --body "Nginx, SSL, base de données, CI/CD"

hermes kanban create \
  --assignee image-processor \
  --parent t_parent_id \
  --skill ls-gm-img \
  --goal "Optimiser les images du site" \
  --body "WebP, redimensionnement, watermark"

hermes kanban create \
  --assignee ui-ux-designer \
  --parent t_parent_id \
  --skill ui-ux-pro-max \
  --goal "Design system + maquette" \
  --body "Tokens, composants, prototype"

hermes kanban create \
  --assignee marketing-manager \
  --parent t_parent_id \
  --skill marketing-mode \
  --goal "Campagne marketing produit" \
  --body "Social media, copy, analyse concurrence"
```

### Depuis Telegram

```
/kanban create --assignee refactorer --goal "..." --body "..."
/kanban tail t_xxxxx
/kanban list
```

## Pitfalls connus

| Problème | Cause | Solution |
|----------|-------|----------|
| `kanban decompose` retourne "malformed JSON" | Modèle auxiliaire trop faible (free) | Créer manuellement les sous-tâches avec `--assignee` + `--parent` |
| `hermes profile delete` bloque | Demande confirmation interactive | Utiliser `-y` : `hermes profile delete nom -y` |
| Profile générique toujours présent | Recréé par `hermes update skill sync` | Supprimer après installation : `hermes profile delete nom -y` |
| Skill non trouvé par l'agent | Pas de triggers dans le frontmatter | Ajouter `metadata.hermes.triggers` avec mots-clés FR/EN |
| SkillHub install 404 | Le slug est un package, pas une skill | Chercher les skills individuelles avec `skillhub search <mot-clé>` |
| `hermes config set` crée des doublons | Config parser buggé | Éditer `~/.hermes/config.yaml` directement |
| Symlink ne marche pas | Chemin relatif au lieu d'absolu | Utiliser `~/.hermes/skills/` ou le chemin absolu |
| Site SkillHub rendu en JS | Impossible d'extraire le contenu des packages | Utiliser `skillhub search` pour trouver les slugs individuels |
| MCP server `word_mcp_server` ne démarre pas | PATH manquant pour pipx installs | Utiliser le chemin absolu : `~/.local/bin/word_mcp_server` |
| Hyperbrowser MCP non connecté | API key absente du .env | Ajouter `HYPERBROWSER_API_KEY=hb_xxx` dans `~/.hermes/.env` |

## Vérification rapide

```bash
# Lister tous les profiles
hermes profile list

# Vérifier les skills d'un profil
ls ~/.hermes/profiles/<profil>/skills/<dossier>/SKILL.md

# Voir l'état du board
hermes kanban list

# Voir les assignees disponibles
hermes kanban assignees

# Voir les MCP servers actifs
hermes mcp list
```
