---
title: API Documentation Senior
name: api-documentation-senior
description: 'Workflow complet de documentation d''API en 6 étapes — de la conception REST/GraphQL à la spécification OpenAPI 3.0 et au guide SDK, en passant par la génération automatique, le débogage, la rédaction et les tests.'
version: 1.0.0
source: skillhub
author: custom
tags:
  - api
  - openapi
  - rest
  - graphql
  - documentation
  - sdk
  - swagger
metadata:
  hermes:
    triggers:
      - api documentation
      - documentation api
      - api doc
      - doc api
      - openapi
      - open api
      - swagger
      - spec api
      - api specification
      - spécification api
      - api design
      - conception api
      - rest api
      - api rest
      - graphql api
      - endpoint
      - endpoint api
      - route api
      - api endpoint
      - api route
      - sdk
      - api sdk
      - sdk guide
      - quickstart api
      - guide demarrage api
      - api reference
      - référence api
      - api manual
      - manuel api
      - curl command
      - commande curl
      - api test
      - api mock
      - mock api
      - api integration
      - api development
      - développement api
      - api builder
      - api generator
      - générateur api
      - api schema
      - schéma api
      - api model
      - model api
      - resource model
      - versioning api
      - api version
      - error handling api
      - api error
      - api authentication
      - auth api
      - bearer token
      - jwt api
      - oauth api
      - api-key
      - api key
      - web service
      - service web
      - backend api
      - interface api
      - api contract
      - contrat api
      - api testing
    tags:
      - api-documentation
      - openapi
      - swagger
      - rest
      - graphql
      - sdk
      - documentation
      - api-design
---

# API Documentation — Senior Development Engineer

## Quand utiliser ce skill

Active ce workflow quand l'utilisateur demande :
- « concevoir / documenter une API »
- « générer une spec OpenAPI / Swagger »
- « écrire une doc d'interface REST / GraphQL »
- « créer un guide SDK / quickstart »
- « tester des endpoints API »
- « générer des commandes curl / mock data »
- toute tâche impliquant API design, documentation, ou spécification

## Dépendances (skills SkillHub installés)

Ce skill orchestre les skills suivants si présents :
- `ah-api-designer` — conception API REST/GraphQL, modélisation ressources, OpenAPI draft
- `sovereign-api-docs-generator` — génération auto de docs depuis le code (REST/GraphQL/WebSocket)
- `api-dev` — développement, test curl, intégration, mock, validation OpenAPI
- `api-doc-writer` — rédaction documentation API structurée (descriptions, auth, quickstart)
- `qa-api-tester` — construction requêtes, génération curl, données mock, validation
- `afrexai-api-docs` — génération OpenAPI 3.0, docs markdown, SDK quickstart multilingue

## Workflow complet en 6 étapes

### Étape 1 : Conception de la spécification API (couche d'accès)

**Objectif :** Définir l'architecture globale de l'API — REST ou GraphQL.

Actions :
1. Concevoir l'architecture globale (RESTful ou GraphQL)
2. Définir le **modèle de ressources** et les règles de nommage des endpoints
3. Établir la **stratégie de versioning** (URL path / Header / Query param)
4. Concevoir le **mode de pagination** (offset / cursor / keyset)
5. Normaliser le **format de gestion des erreurs** (code erreur, structure message)
6. Rédiger un **brouillon de spécification OpenAPI**

Livrables :
- Document de conception d'API (ressources, endpoints, versions)
- Brouillon de spécification OpenAPI
- Règles de nommage et conventions

### Étape 2 : Génération automatique de docs depuis le code (couche analytique)

**Objectif :** Scanner le code existant pour extraire et documenter les API.

Actions :
1. Scanner le projet pour **identifier automatiquement les endpoints**
2. Extraire : routes, paramètres, corps de requête, structure de réponse
3. Supporter **REST, GraphQL, WebSocket**
4. Générer une documentation complète avec **exemples et schémas de données**
5. Aligner avec les spécifications de conception de l'étape 1

Livrables :
- Documentation de référence générée automatiquement
- Schémas de données et exemples

### Étape 3 : Développement et validation de débogage (couche analytique)

**Objectif :** Vérifier que l'implémentation est conforme aux spécifications.

Actions :
1. Configurer les endpoints et vérifier la conformité aux specs
2. Tester chaque endpoint avec des **commandes curl**
3. Écrire des **tests d'intégration** pour valider le comportement
4. Générer les specs OpenAPI et **vérifier la cohérence**
5. Simuler des **réponses API mock** pour le développement frontend

Livrables :
- Résultats des tests d'interface
- Rapport de vérification de cohérence
- Données mock pour le frontend

### Étape 4 : Rédaction de la documentation API (couche de sortie)

**Objectif :** Produire une documentation d'interface API claire et complète.

Actions :
1. Rédiger la **section descriptive** de chaque endpoint
2. Documenter les spécifications : méthode, chemin, paramètres
3. Rédiger les **notes d'authentification** (OAuth, JWT, API Key)
4. Écrire le **guide de démarrage rapide** et les chapitres d'introduction
5. Ajouter des **exemples requête/réponse** et **codes d'erreur**

Livrables :
- Documentation d'interface API structurée
- Guide de démarrage rapide
- Description des mécanismes d'authentification

### Étape 5 : Construction de requêtes et tests de simulation (couche de sortie)

**Objectif :** Générer des commandes exécutables et des données mock.

Actions :
1. Construire les **requêtes API** et générer les **commandes curl**
2. Générer des **données de mock** pour le développement frontend
3. Fournir les instructions de vérification (statut HTTP, en-têtes)
4. Vérifier que les exemples de requêtes dans la doc sont exécutables

Livrables :
- Commandes curl exécutables pour chaque endpoint
- Données mock prêtes à l'emploi
- Instructions de vérification

### Étape 6 : Spécifications OpenAPI 3.0 et guide SDK (couche de sortie)

**Objectif :** Produire les livrables finaux standardisés.

Actions :
1. Générer le fichier de **spécification OpenAPI 3.0** complet (YAML + JSON)
2. Produire un **document de référence API** en Markdown
3. Générer un **guide de démarrage rapide SDK** avec échantillons de code multilingue
4. Compiler la **liste complète des codes d'erreur** et le processus d'authentification

Livrables :
- Fichier OpenAPI 3.0 (YAML/JSON) — importable dans Swagger UI
- Document de référence API (Markdown)
- Guide SDK multilingue (Python, JS, Go, Java, curl)

## Exportation finale

Consolider les résultats en un package complet de documentation API :

1. **Spécifications de conception d'API** — modèle ressource, versioning, erreurs
2. **Fichier OpenAPI 3.0** — YAML/JSON, compatible Swagger UI / Redoc
3. **Document de référence API** — description complète des endpoints
4. **Guide de démarrage rapide SDK** — exemples multilingues + auth
5. **Jeu de commandes curl** — test exécutable par endpoint

## Règles d'or

1. **API-first** — concevoir la spec avant d'écrire le code
2. **OpenAPI 3.0** est le format standard de livraison
3. **Toujours inclure des exemples** — requête ET réponse
4. **Documenter les erreurs** — chaque code d'erreur doit avoir un sens et une solution
5. **Versioning explicite** — ne jamais casser les clients existants
6. **SDK multilingue** — au moins curl + Python + JS

## Exemple d'invocation

```
L'utilisateur : "génère la doc API pour mon projet FastAPI dans /opt/data/mon-api/"

→ Charger api-documentation-senior
→ Étape 1 : conception API (ah-api-designer)
→ Étape 2 : scan du code (sovereign-api-docs-generator)
→ ... workflow complet jusqu'à Étape 6 : OpenAPI 3.0 + SDK
```
