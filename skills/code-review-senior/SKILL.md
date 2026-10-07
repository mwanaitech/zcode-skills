---
title: Code Review Senior
name: code-review-senior
description: 'Workflow complet de code review en 6 étapes — de l''analyse de PR à la génération de rapport structuré, en passant par la revue qualité, les spécifications, l''audit sécurité et le Clean Code.'
version: 1.0.0
source: skillhub
author: custom
tags:
  - code-review
  - pr-review
  - clean-code
  - security-audit
  - quality
  - static-analysis
metadata:
  hermes:
    triggers:
      - code review
      - review code
      - pr review
      - pull request
      - revue de code
      - reviewer le code
      - qualité du code
      - code quality
      - audit code
      - security audit
      - static analysis
      - bug detection
      - code verification
      - vérification code
      - pre-commit review
      - github pr
      - git diff review
      - code diff
      - code smell
      - code standard
      - static scan
      - dépendances vulnérables
      - sécurité code
      - injection xss sql
      - code review rapport
      - rapport de revue
      - code-review
      - review technique
      - peer review
      - code inspection
    tags:
      - code-review
      - pr-review
      - quality-gate
      - security
      - static-analysis
      - verification
      - review
---

# Code Review — Senior Development Engineer

## Quand utiliser ce skill

Active ce workflow quand l'utilisateur demande :
- « review ce code / cette PR »
- « vérifie la qualité de ce code »
- « fais un audit de sécurité »
- « vérifie les normes de codage »
- « génère un rapport de code review »
- « vérifie les principes Clean Code / KISS / DRY / YAGNI »
- toute tâche impliquant une revue de code structurée

## Dépendances (skills SkillHub installés)

Ce skill orchestre les skills suivants si présents :
- `pr-reviewer` — analyse de PR GitHub (diff, lint, risque)
- `critical-code-reviewer` — revue qualité stricte, bugs, sécurité, perf
- `project-code-standard` — vérification des normes de codage et auto-fix
- `security-auditor` — audit sécurité (credentials, CVE, OWASP)
- `clean-code-review` — validation principes KISS/DRY/YAGNI/SOLID
- `code-review-assistant` — générateur de rapport de review structuré en chinois

## Workflow complet en 6 étapes

### Étape 1 : Analyse PR et Diff (couche d'accès)

**Objectif :** Récupérer le diff GitHub, analyser la portée des changements.

Actions :
1. Récupérer le diff de la PR : `gh pr view <num> --json body,additions,deletions,files,commits`
2. Obtenir le diff complet : `gh pr diff <num>`
3. Analyser la portée : fichiers modifiés, ajouts/suppressions, impact
4. Lint statique initial sur les fichiers modifiés
5. Marquer les **nouveaux extraits** vs modifiés vs supprimés
6. Évaluer le **niveau de risque** du changement

Livrables :
- Analyse du diff (fichiers, lignes, type de changements)
- Résultats préliminaires du lint
- Évaluation du niveau de risque

### Étape 2 : Revue qualité stricte (couche analytique)

**Objectif :** Revue contradictoire, sans tolérance pour la médiocrité.

Actions :
1. Détecter les **bugs potentiels** et erreurs logiques
2. Identifier les **failles de sécurité** (injection, XSS, fuite d'informations)
3. Analyser les **goulots d'étranglement de performance**
4. Vérifier les **conditions aux limites** (edge cases)
5. Détecter les **fuites de ressources** (mémoire, fichiers, connexions)
6. Valider la **gestion d'erreurs** et la **type safety**
7. Couvrir Python, JavaScript/TypeScript, SQL, Go, frontend

Livrables :
- Liste des bugs et problèmes qualité (avec sévérité)
- Vulnérabilités de sécurité identifiées
- Problèmes de performance et ressources

### Étape 3 : Vérification des spécifications de code (couche analytique)

**Objectif :** Valider la conformité aux normes de codage du projet/équipe.

Actions :
1. Vérifier les **conventions de nommage** (snake_case, camelCase, PascalCase)
2. Valider les **styles d'indentation** et formatage
3. Contrôler l'**ordre des imports**
4. Vérifier la **taille des fonctions** et la complexité
5. **Correction automatique** des problèmes de formatage
6. Générer un rapport de conformité

Livrables :
- Résultats d'inspection des spécifications
- Corrections automatiques appliquées
- Rapport de conformité

### Étape 4 : Audit de sécurité (couche analytique)

**Objectif :** Scanner les vulnérabilités et configurations sensibles.

Actions :
1. Scanner les **credentials exposés** (clés API, tokens, mots de passe)
2. Détecter les **vulnérabilités CVE** dans les dépendances
3. Vérifier les **configurations sensibles** (CORS, CSP, en-têtes)
4. Auditer la **logique d'authentification et d'autorisation**
5. Vérifier la **validation des entrées** et l'assainissement
6. Évaluer l'**implémentation cryptographique**
7. Évaluer les niveaux de risque (critique, élevé, moyen, bas)

Livrables :
- Rapport d'audit de sécurité complet
- Vulnérabilités détectées et correctifs proposés
- Évaluation des risques par niveau

### Étape 5 : Validation Clean Code (couche analytique)

**Objectif :** Évaluer la conception selon les principes KISS/DRY/YAGNI.

Actions :
1. **KISS** — le code est-il simple et direct ?
2. **DRY** — y a-t-il de la duplication évitable ?
3. **YAGNI** — y a-t-il du code superflu/over-engineering ?
4. Identifier les **anti-patterns** :
   - God Object / God Class
   - Long Method / Long Parameter List
   - Feature Envy
   - Switch Statements / Shotgun Surgery
5. Vérifier la **responsabilité unique** des fonctions/classes
6. Évaluer la **lisibilité** et la **maintenabilité**
7. Recommander des refactorings ciblés

Livrables :
- Évaluation Clean Code (KISS/DRY/YAGNI)
- Anti-patterns détectés avec localisation
- Recommandations de refactoring

### Étape 6 : Génération du rapport structuré en chinois (couche de sortie)

**Objectif :** Produire un rapport de review complet et professionnel.

Actions :
1. Consolider les résultats des 5 étapes précédentes
2. Générer un **rapport structuré en chinois** couvrant :
   - Bug et défauts (par sévérité : critique / sévère / avertissement / suggestion)
   - Failles de sécurité
   - Problèmes de performance
   - Lisibilité et maintenabilité
   - Meilleures pratiques
   - Type safety et gestion d'erreurs
   - Couverture de test
3. Organiser par sévérité décroissante
4. Fournir des recommandations concrètes pour chaque problème

Livrables :
- Rapport d'examen de code complet (chinois)
- Rapport d'audit de sécurité
- Rapport de conformité des spécifications
- Liste de suggestions de refactoring

## Exportation finale

Consolider les résultats en un dossier complet d'examen du code :

1. **Rapport d'examen de code** — liste des problèmes et recommandations par sévérité
2. **Rapport d'audit de sécurité** — résultats de scan et évaluation des risques
3. **Rapport de conformité** — inspection des spécifications et correctifs appliqués
4. **Liste de suggestions de refactoring** — optimisations Clean Code

## Règles d'or

1. **Jamais de complaisance** — la review doit être rigoureuse, pas polie
2. **Chaque problème a une sévérité** — critique / sévère / avertissement / suggestion
3. **Toujours proposer une correction** — pas juste signaler le problème
4. **PR review ≠ code review** — le workflow s'adapte (PR diff ou code existant)
5. **Context-aware** — comprendre le métier avant de juger le code
6. **Rapport en chinois structuré** — livrable clé pour l'équipe

## Exemple d'invocation

```
L'utilisateur : "review la PR #42 sur mon repo"

→ Charger code-review-senior
→ Étape 1 : analyser le diff via pr-reviewer
→ ... workflow complet jusqu'à Étape 6 : rapport final
```
