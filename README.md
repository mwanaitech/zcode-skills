# 🧠 ZCode Skills — Collection Complète

> **Snapshot complet de tous les skills ZCode** — sauvegarde, référence et exploration.

Ce dépôt contient l'intégralité des skills disponibles dans l'écosystème ZCode, utilisés pour assister des agents IA dans des tâches variées : cybersécurité, développement, design, finance, marketing, éducation et bien plus.

---

## 📦 Structure du dépôt

```
zcode-skills/
├── skills/                         # 2 540 skills ZCode (écosystème principal)
│   ├── performing-*/               # 172 skills — tests d'intrusion, audits...
│   ├── implementing-*/             # 168 skills — implémentation de contrôles de sécurité...
│   ├── detecting-*/                #  96 skills — détection de menaces et techniques...
│   ├── analyzing-*/                #  76 skills — analyse forensic, malware, logs...
│   ├── hunting-*/                  #  37 skills — threat hunting actif...
│   ├── building-*/                 #  36 skills — construction d'infrastructures...
│   ├── exploiting-*/                #  34 skills — exploitation de vulnérabilités...
│   ├── testing-*/                  #  24 skills — tests de sécurité applicative...
│   ├── google-*/                   #  21 skills — GKE, Google Cloud, Workspace...
│   ├── conducting-*/               #  21 skills — conduite d'engagements...
│   ├── configuring-*/             #  18 skills — configuration d'outils...
│   ├── agent-*/                    #  18 skills — agents, orchestration...
│   ├── gke-*/                      #  17 skills — Google Kubernetes Engine...
│   ├── securing-*/                 #  13 skills — sécurisation d'infrastructures...
│   ├── auditing-*/                 #  12 skills — audit de configurations...
│   ├── deploying-*/                #  11 skills — déploiement de solutions...
│   └── ... (plus de 250 catégories uniques)
│
└── sub-agents/                     # Systèmes d'agents spécialisés
    ├── hermes/                     # Architecture 3 couches (Stratège + Spécialistes → Travailleurs)
    ├── agency-agents/               # Agents spécialisés par domaine (24+ domaines)
    └── agent-reach/                # Module Python avec CLI
```

---

## 🤖 Sous-Agents — Systèmes d'Expertise

Le dépôt inclut trois architectures de sous-agents distinctes pour étendre les capacités des agents ZCode :

| Système | Fichiers | Description |
|---------|----------|-------------|
| **Hermes** | ~16 | Architecture orchestrée : un `strategist-agent` coordonne jusqu'à 14 agents spécialistes qui déploient des travailleurs autonomes. |
| **Agency-Agents** | 291 | Une vaste bibliothèque d'agents spécialisés couvrant plus de 24 domaines (DevOps, Sécurité, Data, Business, etc.). |
| **Agent-Reach** | 119 | Un module Python robuste offrant une interface de ligne de commande (CLI) pour l'interaction avec l'écosystème. |

---

## 🗂️ Catégories principales

| # | Catégorie | Nb skills | Domaine |
|---|-----------|----------|---------|
| 1 | `performing-*` | 172 | Pentesting, audits, assessments |
| 2 | `implementing-*` | 168 | Implémentation de contrôles de sécurité |
| 3 | `detecting-*` | 96 | Détection de menaces et techniques |
| 4 | `analyzing-*` | 76 | Analyse forensic, malware, logs |
| 5 | `hunting-*` | 37 | Threat hunting actif |
| 6 | `building-*` | 36 | Construction d'infrastructures |
| 7 | `exploiting-*` | 34 | Exploitation de vulnérabilités |
| 8 | `testing-*` | 24 | Tests de sécurité applicative |
| 9 | `google-*` | 21 | GKE, Google Cloud, Workspace |
| 10 | `conducting-*` | 21 | Conduite d'engagements |
| 11 | `configuring-*` | 18 | Configuration d'outils |
| 12 | `agent-*` | 18 | Agents, orchestration |
| 13 | `gke-*` | 17 | Google Kubernetes Engine |
| 14 | `securing-*` | 13 | Sécurisation d'infra |
| 15 | `auditing-*` | 12 | Audit de configurations |
| 16 | `deploying-*` | 11 | Déploiement de solutions |
| 17 | `gitnexus-*` | 9 | GitNexus tools |
| 18 | `hermes-*` | 8 | Hermes agent platform |
| 19 | `figma-*` | 8 | Design & Figma |
| 20 | `ai-*` / `data-*` | 16 | AI/ML & Data |

### 🌐 Domaines couverts

- **🔒 Cybersécurité** — Pentest, SOC, forensics, threat hunting, reverse engineering, malware analysis, red team, blue team, purple team, GRC, IAM, zero trust, OT/ICS, cloud security, API security, appsec
- **☁️ Cloud & DevOps** — GKE, Cloudflare, AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Terraform, GitHub Actions
- **🤖 AI/ML** — LLM, agents, RAG, prompt engineering, guardrails, model deployment
- **💻 Développement** — Frontend, backend, mobile, API, architecture, code review, refactoring
- **🎨 Design** — UI/UX, Figma, design systems, prototypes, brand design
- **📊 Finance & Trading** — Analyse technique, screening, options, trading strategies
- **📈 Marketing & Growth** — SEO, SEA, social media, content strategy, email marketing
- **⚖️ Legal & Compliance** — ISO 27001, PCI DSS, SOC 2, GDPR, HIPAA, NIST
- **🎓 Éducation** — Academic writing, research, lesson plans
- **🌍 Géo-spatial** — GIS, BIM, drone mapping, cartography

---

## 📄 Format d'un skill

Chaque skill est un sous-dossier avec un fichier `SKILL.md` contenant les instructions et la définition du skill :

```
skill-name/
├── SKILL.md        # ✅ Instructions et définition du skill (obligatoire)
└── ...             # Fichiers annexes optionnels
```

---

## 🚀 Utilisation

Ces skills sont conçus pour être utilisés avec l'agent ZCode (`/zcode`) en invoquant leur nom via la commande `/` :

```
/skill-name    # Invoque un skill depuis n'importe où
```

Ou directement depuis un agent compatible via l'outil `Skill` :

```json
{
  "skill": "skill-name",
  "args": "votre requête"
}
```

---

## 🔗 Liens

- **Dépôt GitHub** : `https://github.com/mwanaitech/zcode-skills` (privé)
- **Plateforme ZCode** : [zcode.ai](https://zcode.ai)
- **Créé le** : 19 juillet 2026
- **Dernière mise à jour** : 19 juillet 2026 — 2 540 skills

---

*Généré automatiquement — Snapshot de l'écosystème ZCode*
