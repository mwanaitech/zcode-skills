---
name: auto-skill-router
description: >
  Router automatique d'intentions Hermes. Charge le bon skill sans intervention manuelle.
  Zero script externe, zero question utilisateur. Classification 100% LLM.
version: 1.0.0
author: Mwana-Itech — Hans Axel Mbina Mabicka
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [router, auto-agent, skill-dispatch, zero-intervention, orchestration]
    related_skills: [oh-my-hermes, multi-agent-skill-sync, hermes-skill-factory]
---

# Auto Skill Router

> **Principe absolu** : ZERO intervention humaine. ZERO question. ZERO script externe.
> Le LLM classe l'intention et dispatche le skill en un seul tour.

## Usage

```
/router Ma demande complexe ici
```

Exemples :
- `/router Créer un logo professionnel pour ma startup`
- `/router Auditer ma config Kubernetes`
- `/router Rédiger un email de prospection B2B`

## Mécanisme interne

### Étape unique : Classification LLM

Quand `/router` est appelé, le LLM exécute ce raisonnement interne (non visible par l'utilisateur) :

```
1. Analyser le prompt utilisateur
2. Identifier : verbe principal + domaine + objectif
3. Comparer avec la SKILL_REGISTRY ci-dessous
4. Choisir le skill le plus pertinent
5. SI aucun skill clair → fallback sur "general"
6. Dispatcher : /skill <nom_skill_choisi>
7. Transmettre le prompt original au skill chargé
```

### Règles de dispatch

- **JAMAIS poser de question** à l'utilisateur sous aucun prétexte.
- **JAMAIS demander de confirmation** avant de charger un skill.
- En cas d'ambiguïté, le LLM **choisit le skill le plus probable** et l'utilise.
- Si le skill choisi n'existe pas, fallback à `general` immédiatement.

---

## SKILL_REGISTRY — Référentiel des skills disponibles

### Comment trouver un skill

**Méthode dynamique (recommandée)** :
1. Exécuter `skills_list(category="<domaine>")` pour obtenir les skills de la catégorie pertinente
2. Charger le meilleur candidat avec `skill_view(name="<skill>")`
3. Dispatcher la demande au skill chargé

### Par catégorie (mots-clés de référence)

**CRÉATIF / DESIGN** — mots-clés : logo, identité visuelle, palette, bannière, maquette, UI, UX, interface, infographie, comic, poster, motion, 3D, animation
**DÉVELOPPEMENT / CODE** — mots-clés : code, application, site web, API, frontend, backend, mobile, smart contract, Godot, Unity, firmware, IoT
**SÉCURITÉ** — mots-clés : sécurité, pentest, audit, intrusion, menace, forensics, malware, vulnérabilité, SIEM, SOC
**DEVOPS / CLOUD / INFRA** — mots-clés : CI/CD, Docker, Kubernetes, cloud, serveur, base de données, infrastructure, SRE, fiabilité
**ANALYSE / DONNÉES** — mots-clés : données, analyse, dashboard, BI, finance, concurrentiel, marché, recherche, investissement
**RÉDACTION / ÉCRITURE** — mots-clés : rédiger, écrire, copywriting, documentation, PRD, article, essai, blog, contenu, lettre
**MARKETING / CROISSANCE** — mots-clés : marketing, SEO, réseaux sociaux, publicité, acquisition, croissance, campagne, stratégie
**GESTION / MANAGEMENT** — mots-clés : produit, projet, roadmap, gestion, opérations, coordination, processus
**JURIDIQUE / COMPLIANCE** — mots-clés : juridique, contrat, litige, conformité, SOC2, ISO27001, RGPD, légal
**FINANCE / TRADING** — mots-clés : finance, actions, bourse, portefeuille, valorisation, quant, backtest, trading
**ÉDUCATION** — mots-clés : cours, cours particuliers, pédagogie, essai, académique, recherche scientifique
**TEST / QA** — mots-clés : test, QA, benchmark, performance, assurance qualité, validation

### Skills noyau système (toujours disponibles)

Ces skills sont garantis présents sur tout système Hermes standard :

- `hermes-agent` — Configuration, usage et dépannage de Hermes lui-même
- `multi-agent-skill-sync` — Synchronisation de skills entre agents
- `autonomous-ai-agents` — Organisation des skills d'agents autonomes
- `oh-my-hermes` — Orchestration multi-agents (deep-research, ralplan, ralph, triage, autopilot)

---

## Logique de routing (pour le LLM)

### Instructions de classification

Quand tu reçois un prompt via `/router`, exécute ce raisonnement :

```
1. EXTRAIRE : Verbe principal + objet + domaine
2. MATCHER : Trouver la catégorie la plus proche dans SKILL_REGISTRY
3. CHOISIR : Sélectionner le skill spécifique le plus adapté
4. DISPATCH : Exécuter /skill <nom> puis transmettre le prompt
```

### Règles absolues

- **JAMAIS demander à l'utilisateur de choisir** entre plusieurs skills.
- **JAMAIS demander de reformuler** la demande.
- **JAMAIS afficher le raisonnement interne** à l'utilisateur.
- **TOUJOURS choisir un skill**, même avec faible confiance.
- **TOUJOURS transmettre le prompt original** au skill choisi pour exécution.

### Exemples de routing en production

| Prompt utilisateur | Skill choisi | Justification (interne) |
|---|---|---|
| « Crée un logo » | `brand-visual-creation` | Verbe=créer + objet=logo → catégorie creative |
| « Audite ma config AWS » | `devops-automator` ou `security-auditor` | Verbe=auditer + domaine=cloud → devops+security. Choisir devops-automator (plus généraliste cloud). |
| « Rédige mon PRD » | `prd-writer` | Exact match PRD → skill spécialisé |
| « Help pour mon devoir » | `general` | Ambigu, pas de domaine clair → fallback |
| « Analyse ce malware » | `security-architect` | Domaine=security + objet=malware |
| « Build a landing page » | `frontend-developer` | Verbe=build + objet=landing page → dev web |
| « Conseil pour un contrat » | `legal-advisor` | Domaine=juridique + objet=contrat |

---

## Intégration système

### Commande « /router »

S'exécute comme une commande Hermes inline. Syntaxe :

```
/router <prompt>
```

### Comportement attendu

1. L'utilisateur tape : `/router Créer une app mobile`
2. Le LLM (avec ce skill chargé) analyse le prompt
3. Le LLM choisit : `mobile-app-builder`
4. Le LLM exécute : `/skill mobile-app-builder`
5. Le LLM transmet : « Créer une app mobile » au skill nouvellement chargé
6. Le skill `mobile-app-builder` prend le relai et répond

### Fallback automatique

Si le skill choisi n'existe pas dans `~/.hermes/skills/` :

```
→ Charger `general` par défaut
→ Logger l'erreur
→ Exécuter la demande avec le comportement de base
→ Ne pas notifier l'utilisateur de l'erreur (transparent)
```

---

## Maintenance et évolution

### Extension du registre

Pour ajouter un nouveau skill au router :

1. L'installer dans `~/.hermes/skills/`
2. Ajouter son entrée dans la section SKILL_REGISTRY ci-dessus
3. Spécifier : nom, description courte, catégorie

Aucun script, aucune recompilation, aucun redémarrage nécessaire.

### Apprentissage implicite

Les sessions utilisateur servent d'apprentissage :
- Si l'utilisateur corrige explicitement (`Non, charge plutôt X`), le LLM mémorise
- La prochaine fois qu'un prompt similaire arrive, le skill correct est choisi
- Stockage dans la mémoire Hermes (`memory` tool) pour persistance inter-session

---

## Pitfalls

- **NE JAMAIS exposer le raisonnement interne** à l'utilisateur final.
- **NE JAMAIS charger plus d'un skill à la fois** sans instruction explicite de l'utilisateur.
- **NE JAMAIS oublier de transmettre le prompt original** au skill cible.
- **NE JAMAIS bloquer sur une question** — en cas de doute, choisir et avancer.
- **LES MOTS FRANÇAIS** doivent être correctement accentués dans toute réponse : compétences, expérience, équipe, développé, sécurité, téléphone, réseau, procédures, matériel, logiciel, utilisateur.
