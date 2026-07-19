# 🧠 ZCode Skills — Collection Complète

> **Snapshot complet de tous les skills ZCode** — sauvegarde, référence et exploration.

Ce dépôt contient l'intégralité des skills disponibles dans l'écosystème ZCode, utilisés pour assister des agents IA dans des tâches variées : cybersécurité, développement, design, finance, marketing, éducation et bien plus.

---

## 📦 Structure du dépôt

```
zcode-skills/
├── skills/                         # 1 696 skills ZCode (écosystème principal)
│   ├── performing-*/               # 172 skills — tests d'intrusion, audits...
│   ├── implementing-*/             # 168 skills — implémentation de sécurité...
│   ├── detecting-*/                #  96 skills — détection de menaces...
│   ├── analyzing-*/                #  76 skills — analyse forensic/malware...
│   ├── hunting-*/                  #  37 skills — threat hunting...
│   ├── building-*/                 #  36 skills — construction d'infrastructure...
│   ├── exploiting-*/               #  34 skills — exploitation de vulnérabilités...
│   ├── testing-*/                  #  24 skills — tests de sécurité applicative...
│   ├── google-*/                   #  21 skills — GKE, Google Cloud, Workspace...
│   ├── conducting-*/               #  21 skills — conduite d'engagements red team...
│   ├── configuring-*/              #  18 skills — configuration d'outils de sécurité...
│   ├── agent-*/                    #  18 skills — agents, orchestration, plateforme...
│   ├── gke-*/                      #  17 skills — Google Kubernetes Engine...
│   ├── securing-*/                 #  13 skills — sécurisation d'infrastructures...
│   ├── auditing-*/                 #  12 skills — audit de configurations...
│   ├── deploying-*/                #  11 skills — déploiement de solutions...
│   └── ... (250+ catégories uniques)
│
└── agent-skills/                   # 21 skills (environnement agent dédié)
    ├── agent-reach/
    ├── agents-sdk/
    ├── cloudflare/
    ├── cloudflare-email-service/
    ├── cloudflare-one/
    ├── cloudflare-one-migrations/
    ├── durable-objects/
    ├── gitnexus-cli/
    ├── gitnexus-debugging/
    ├── gitnexus-exploring/
    ├── gitnexus-guide/
    ├── gitnexus-impact-analysis/
    ├── gitnexus-pdg-query/
    ├── gitnexus-pr-review/
    ├── gitnexus-refactoring/
    ├── gitnexus-taint-analysis/
    ├── sandbox-sdk/
    ├── turnstile-spin/
    ├── web-perf/
    ├── workers-best-practices/
    └── wrangler/
```

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
| 20 | `ai-*` / `data-*` | 8+8 | AI/ML & Data |

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
- **Dernière mise à jour** : 19 juillet 2026 — 1 717 skills (1696 + 21)

---

## 📜 Licence

Collection privée — Usage interne. Chaque skill peut avoir ses propres conditions d'utilisation.

---

## 🇬🇧 English Summary

This repository is a complete backup and reference snapshot of all ZCode skills. It contains **1,717 skills** organized across two directories:
- **`skills/`** — 1,696 skills from the main ZCode ecosystem
- **`agent-skills/`** — 21 skills from the dedicated agent environment

Skills are grouped by functional prefixes (e.g., `performing-*`, `implementing-*`, `detecting-*`) and cover domains including cybersecurity, cloud/DevOps, AI/ML, development, design, finance, marketing, legal/compliance, education, and geo-spatial.

To use a skill: `/skill-name` with a ZCode-compatible agent.

*Repository: `https://github.com/mwanaitech/zcode-skills` (private)*

---

*Généré automatiquement — Snapshot de l'écosystème ZCode*
