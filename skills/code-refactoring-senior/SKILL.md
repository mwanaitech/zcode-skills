---
title: Code Refactoring Senior
name: code-refactoring-senior
description: 'Workflow complet de refactoring en 6 étapes — de l''analyse structurelle DDD à la simplification de code, en passant par la dette technique, SOLID, les patterns de refactoring et l''architecture modulaire.'
version: 1.0.0
source: skillhub
author: custom
tags:
  - refactoring
  - clean-code
  - solid
  - architecture
  - ddd
  - technical-debt
  - code-quality
metadata:
  hermes:
    triggers:
      - refactor
      - refactoring
      - restructurer
      - restructuration
      - dette technique
      - technical debt
      - code legacy
      - legacy code
      - moderniser code
      - améliorer code
      - improve code
      - clean code
      - code propre
      - solid principles
      - principes solid
      - architecture logicielle
      - software architecture
      - ddd
      - domain driven design
      - god class
      - god object
      - longue méthode
      - long method
      - code dupliqué
      - duplicated code
      - couplage
      - coupling
      - cohesion
      - design patterns
      - pattern refactoring
      - extract method
      - extract class
      - strangler fig
      - simplifier code
      - simplify code
      - code smell
      - antipattern
      - code complexity
      - complexité cyclomatique
      - code migration
      - migration technique
    tags:
      - refactoring
      - clean-code
      - solid
      - architecture
      - ddd
      - technical-debt
      - code-quality
      - modernization
      - restructuration
---

# Code Refactoring — Senior Development Engineer

## Quand utiliser ce skill

Active ce workflow quand l'utilisateur demande :
- « refactorer ce code »
- « améliorer la structure / qualité du code »
- « réduire la dette technique »
- « appliquer SOLID / Clean Code sur ce projet »
- « moderniser / nettoyer cette base de code »
- « analyse de code et suggestions d'amélioration »
- toute tâche impliquant refactoring, restructuration, ou amélioration de code existant

## Dépendances (skills SkillHub installés)

Ce skill orchestre les skills suivants si présents :
- `refactoring` — workflow de refactoring profond
- `refactoring-specialist` — spécialiste transformation de code
- `code-refactoring` — patterns et techniques de refactoring
- `agent-git-oracle` — analyse dette technique et antipatterns
- `clean-code-review` — review SOLID / Clean Code

## Workflow complet en 6 étapes

### Étape 1 : Analyse structurelle du code (couche d'accès)

**Objectif :** Cartographier la structure actuelle — responsabilités, domaines, couplage, complexité.

Actions :
1. Lister tous les fichiers du projet cible : `search_files(pattern='**/*.py')` (adapter l'extension)
2. Analyser chaque fichier : taille, nombre de classes, fonctions, lignes
3. Identifier les responsabilités de chaque classe/module
4. Utiliser le **Domain-Driven Design (DDD)** pour délimiter les bounded contexts et aggregate roots
5. Analyser la complexité cyclomatique et cognitive des fonctions critiques
6. Tracer un diagramme de dépendances entre modules (repérer le couplage fort)
7. Détecter les duplications de code et fragments logiques similaires

Livrables :
- Rapport d'analyse structurelle (fichiers, classes, fonctions, responsabilités)
- Carte de chaleur de complexité (fonctions les plus complexes)
- Diagramme de dépendances (modules fortement couplés)
- Zones de duplication identifiées

### Étape 2 : Détection de dette technique et antipatterns architecturaux (couche d'accès)

**Objectif :** Identifier les zones à risque à partir de l'historique Git et de l'analyse statique.

Actions :
1. Analyser l'historique Git : `git log --oneline --since="6 months"`
2. Identifier les **hot files** (fichiers les plus modifiés)
3. Croiser : haute fréquence de changement + haute complexité = dette technique
4. Détecter les **antipatterns architecturaux** :
   - Dépendances cycliques entre modules
   - God Class / God Object (classes trop grosses)
   - Couplage excessif
   - God Function (fonctions monolithiques)
5. Évaluer le **degré de corruption** de chaque module
6. Prioriser les modules à refactorer (risque + impact)

Livrables :
- Rapport de dette technique (hot files / complexe / risqué)
- Carte des antipatterns architecturaux
- Priorités de refactoring (par ordre de risque)

### Étape 3 : Revue SOLID / Clean Code (couche analytique)

**Objectif :** Auditer le code contre les principes SOLID et Clean Code, grain fin.

Actions :
1. **S** — Single Responsibility : chaque classe/fonction a une seule raison de changer ?
2. **O** — Open/Closed : les modules sont ouverts à l'extension, fermés à la modification ?
3. **L** — Liskov Substitution : les sous-types sont substituables à leurs types de base ?
4. **I** — Interface Segregation : les interfaces sont spécifiques, pas générales ?
5. **D** — Dependency Inversion : les modules haut-niveau ne dépendent pas des modules bas-niveau ?
6. **Clean Code** review :
   - Naming : noms de variables, fonctions, classes clairs et intentionnels
   - Taille des fonctions : < 20 lignes si possible
   - Commentaires : utiles ou redondants ?
   - Structure : Clean Architecture layers respectées ?
7. Marquer chaque violation avec l'emplacement exact (fichier:ligne)

Livrables :
- Rapport de conformité SOLID (par principe, par fichier)
- Liste des violations Clean Code avec localisation
- Recommandations de refactoring par principe

### Étape 4 : Patterns de refactoring et sélection technique (couche analytique)

**Objectif :** Pour chaque problème identifié aux étapes 2-3, choisir le pattern de refactoring adapté.

Actions :
1. Mapper chaque problème à un pattern classique :
   - Fonction trop longue → **Extract Method** / **Extract Function**
   - Classe trop grosse → **Extract Class** / **Extract Module**
   - Paramètre qui dépasse → **Introduce Parameter Object**
   - Conditionnel complexe → **Replace Conditional with Polymorphism**
   - Données dispersées → **Move Field** / **Move Method**
   - Code mort → **Remove Dead Code**
   - Switch/if chaîné → **Replace Type Code with Strategy/State**
2. Pour les refactorings à grande échelle :
   - **Strangler Fig Pattern** — remplacer progressivement un module
   - **Branch by Abstraction** — introduire une abstraction avant de changer l'implémentation
3. Concevoir un **chemin progressif** : chaque étape doit être vérifiable indépendamment
4. Évaluer le risque et les besoins en **tests de caractérisation** (Characterization Tests)
5. Générer une **checklist d'opérations** avec priorité

Livrables :
- Table de correspondance problème → pattern de refactoring
- Plan d'opérations étape par étape (priorisé)
- Stratégie de tests de régression

### Étape 5 : Architecture système et conception modulaire (couche de sortie)

**Objectif :** Concevoir l'architecture cible — modules, interfaces, dépendances.

Actions :
1. Définir les **nouveaux modules** basés sur les bounded contexts DDD
2. Spécifier les **contrats d'interface** entre modules (ports)
3. Définir la **direction des dépendances** (dependency rule : les dépendances pointent vers l'intérieur)
4. Concevoir une **architecture orientée extension** :
   - Plugin pattern
   - Strategy / Decorator pour les variations
   - Event-driven pour le découplage
5. Planifier la **stratégie de déploiement** (big bang vs incrémental)

Livrables :
- Diagramme d'architecture cible (relation modules, hiérarchie)
- Spécification des interfaces et contrats
- Stratégie de migration (Strangler Fig / Branch by Abstraction)

### Étape 6 : Simplification et exécution du refactoring (couche de sortie)

**Objectif :** Exécuter le refactoring sans changer le comportement externe.

Actions :
1. Simplifier le code sans changer le comportement :
   - Éliminer la logique redondante
   - Fusionner le code dupliqué (DRY)
   - Simplifier les expressions conditionnelles complexes
   - Supprimer le code mort / commentaires obsolètes
2. Optimiser les signatures de fonctions et passages de paramètres
3. Renommer pour plus de clarté (noms intentionnels)
4. Réorganiser les fichiers au besoin
5. **Vérification d'équivalence fonctionnelle** :
   - `git diff` pour voir les changements
   - Lancer les tests existants
   - Vérifier que le comportement est identique (pas de nouvelle feature)
6. Valider avec l'utilisateur avant de finaliser

Livrables :
- Code refactoré (patchs / fichiers modifiés)
- Rapport des modifications (quoi, pourquoi)
- Vérification que tous les tests passent

## Règles d'or

1. **Ne jamais casser le comportement** — le refactoring améliore la structure, pas les fonctionnalités
2. **Un pas à la fois** — chaque commit/étape doit laisser le code en état fonctionnel
3. **Tester avant, tester après** — toujours avoir des tests de caractérisation avant de toucher au code
4. **Si ça fait mal, faites-le plus souvent** — le refactoring régulier évite l'accumulation de dette
5. **Implication du domaine** — comprendre le métier avant de restructurer
6. **Documenter les décisions** — pourquoi tel pattern, pourquoi tel découpage

## Exemple d'invocation

```
L'utilisateur : "refactore le module /opt/data/mwanaitech-invoices/"

→ Charger code-refactoring-senior
→ Démarrer Étape 1 : analyse structurelle
→ ... workflow complet jusqu'à Étape 6
```
