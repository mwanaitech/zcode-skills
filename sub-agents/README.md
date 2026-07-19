# Sous-Agents — Documentation Complète

Bienvenue dans la documentation des systèmes de sous-agents de votre environnement. Ce répertoire contient **426 fichiers** répartis sur **3 systèmes distincts**.

---

## Table des matières

1. [Hermes Agents](#1-hermes-agents)
2. [Agency-Agents](#2-agency-agents)
3. [Agent-Reach](#3-agent-reach)
4. [Résumé](#4-résumé)

---

## 1. Hermes Agents

| Détail | Valeur |
|--------|--------|
| **Emplacement** | `~/.hermes/agents/skills/` |
| **Nombre de fichiers** | 16 |
| **Architecture** | 3 couches (Strategist → Specialists → Workers) |

### Architecture

**Couche 1 — Strategist (Orchestrateur)**
Un agent coordinateur unique qui reçoit les requêtes et les décompose en sous-tâches attribuées aux spécialistes.

**Couche 2 — Specialists (14 agents)**
Chaque agent spécialiste possède un rôle et un domaine de compétence définis, par exemple :
- Débogage et résolution d'erreurs
- Analyse de code et revue
- Intégration et déploiement
- Recherche et veille technologique

**Couche 3 — Workers**
Les skills Hermes elles-mêmes, exécutées par les spécialistes.

### Documentation
Un document d'architecture détaillé de 67 Ko (1647 lignes) est disponible dans ce répertoire :
`hermes/hermes-subagents-architecture.md`

---

## 2. Agency-Agents

| Détail | Valeur |
|--------|--------|
| **Emplacement** | `~/.hermes/agents/` |
| **Nombre de fichiers** | 291 |
| **Domaines couverts** | 24+ |

### Domaines d'expertise

| Catégorie | Domaines |
|-----------|----------|
| 🎮 **Game Development** | Unity, Unreal Engine, Blender, Godot, Roblox Studio |
| 💻 **Engineering** | Code, architecture, DevOps, CI/CD |
| 📊 **Data & Science** | Data analysis, AI/ML, recherche, biostatistiques |
| 🔒 **Security** | Pentesting, red team, reverse engineering, forensic |
| 💼 **Business** | Finance, marketing, sales, project management, stratégie |
| 🎨 **Création** | Art, design, musique, spatial computing |
| 📍 **Spatial & GIS** | SIG, géomatique, BIM, drone |
| ⚖️ **Legal & Compliance** | Droit, conformité, audit |
| 🏥 **Health** | Médical, biostatistiques |
| 📚 **Education** | Pédagogie, formation |

### Documentation
- README bilingue (français/anglais) de 73 Ko
- CONTRIBUTING.md — guide de contribution
- SECURITY.md — politique de sécurité
- LICENSE MIT

---

## 3. Agent-Reach

| Détail | Valeur |
|--------|--------|
| **Emplacement** | `~/.zcode/skills/agent-reach/` |
| **Nombre de fichiers** | 119 |
| **Type** | Module CLI Python |

### Description
Agent-Reach est un framework de communication multi-agents qui permet aux agents de dialoguer entre eux via différents canaux (Slack, Discord, SMS, email, etc.). C'est un projet Python complet avec :

- Module principal : `agent_reach/`
- Backends de communication : `agent_reach/backends/`
- Intégrations : `agent_reach/integrations/`
- Utilitaires : `agent_reach/utils/`
- Scripts et guides
- Tests automatisés

### ⚠️ Problème connu — Symlink cassé
Le lien symbolique `/usr/local/bin/agent-reach` est cassé car le binaire cible n'existe pas. L'installation n'est pas terminée. Pour corriger :
```bash
pip install -e ~/.zcode/skills/agent-reach/
```
Ou, si le projet n'est pas empaqueté, créez un script d'entrée manuellement.

---

## 4. Résumé

| Système | Fichiers | Emplacement | Type |
|---------|----------|-------------|------|
| Hermes Agents | 16 | `~/.hermes/agents/skills/` | Architecture orchestrée |
| Agency-Agents | 291 | `~/.hermes/agents/` | Agents spécialisés par domaine |
| Agent-Reach | 119 | `~/.zcode/skills/agent-reach/` | Framework de communication CLI |
| **Total** | **426** | — | 3 systèmes complémentaires |

---

*Documentation générée le 19 juillet 2026*
