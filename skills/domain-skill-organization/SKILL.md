---
title: Domain Skill Organization
name: domain-skill-organization
description: 'Set up domain-specific skill ecosystems in Hermes: install SkillHub expert packs, add auto-loading triggers, and map to dedicated profiles for isolated agent instances.'
version: 1.0.0
author: custom
license: MIT
tags:
  - skills
  - skillhub
  - expert-pack
  - triggers
  - profiles
  - domain
  - workflow
metadata:
  hermes:
    tags: [skills, skillhub, expert-pack, triggers, profiles, domain-workflow, auto-loading]
    triggers:
      - install skill pack
      - expert pack
      - skillhub expert
      - domaine compétences
      - domain skills
      - organiser skills
      - skill workflow
      - skill organisation
      - charger automatiquement skills
      - auto load skill
      - skill triggers
      - profile skill
      - agent spécialisé
      - specialized agent
      - dedicated agent
      - skill ecosystem
      - pack de compétences
      - groupe skills
      - skill bundle
      - multi-skill
      - orchestration skill
      - skill supervisor
      - skill manager
      - competence domaine
      - equipe marketing
      - marketing team
      - equipe ecommerce
      - ecommerce team
      - equipe finance
      - finance team
      - equipe education
      - education team
      - creer profil agent
      - create agent profile
      - nouvel agent
      - new agent
      - skillhub search
      - package mapping
      - skillspackage
      - pack de competences
      - team skill
      - agent specialise
      - specialised agent
---

# Domain Skill Organization

## Overview

Hermes skills can be organized into **domain-specific ecosystems** — groups of related skills that together handle a class of work (code review, refactoring, API documentation, cloud operations). This skill documents how to:

1. Install SkillHub expert packs (groups of skills) into Hermes
2. Create custom orchestration skills that coordinate the group
3. Add auto-loading triggers to skill frontmatter
4. Map domain ecosystems to dedicated Hermes profiles for isolated work

The goal is a setup where the agent auto-loads the right skills based on what the user asks, without explicit `/skill` commands.

## When to Use

- User asks to install a SkillHub expert pack (tech-code-review, tech-api-documentation, etc.)
- User wants skills to load automatically based on task context
- User asks about dedicated agents or profiles per domain
- User wants to organize skills for a specific work domain
- Creating a new orchestration skill that coordinates multiple sub-skills
- Integrating a Hermes-curated skill into a dedicated profile with trigger auto-loading

## Workflow: Installing a SkillHub Expert Pack

### Step 1 — Identify the SkillHub slugs

Search for each skill in the expert pack:

```bash
skillhub search <slug-candidate> --search-limit 5
```

Map the Expert Pack's skill slugs to actual SkillHub slugs by searching each one. Watch for French/English translation differences (e.g. `souverain-api-docs-générateur` → `api-documentation-generator`, `sécurité-audit` → `security-auditor`).

### Step 1b — Fallback: package slug fails (404)

When the user provides a `skillspackage` URL (e.g. `https://skillhub.cn/skillspackage/marketing-...`), direct `skillhub install <packagename>` will fail with HTTP 404 because packages are collections, not individual skills.

**Workflow for package URLs:**

1. Search for the package name on SkillHub:
   ```bash
   skillhub search <packagename>
   ```
   This reveals individual skill slugs contained in the package.

2. Install each skill individually:
   ```bash
   skillhub install <individual-slug-1> --dir ~/.hermes/skills/
   skillhub install <individual-slug-2> --dir ~/.hermes/skills/
   ```

3. Add trigger keywords to each skill's frontmatter (see Step 5)

4. Create or update the target profile with symlinks

**Known package → skill mappings:**

| Package Slug | Individual Slugs Found |
|-------------|----------------------|
| `marketing-social-media-operation` | social-media-marketing, social-media-scheduler, social-media-optimizer, social-media-management |
| `marketing-ad-copywriting` | copywriting, abm-copywriting, copywriting-pro |
| `marketing-competitor-analysis` | competitor-analysis, competitor-watch, competitor-analyst |
| `marketing-user-growth` | growth, growth-hacker, growth-marketer |
| `marketing-official-document-writing` | official-document-template, business-writing |
| `marketing-event-planning` | afrexai-event-planning |
| `ecommerce-promotion-planning` | promotion-planning, ecommerce |
| `ecommerce-product-copywriting` | ecommerce-copywriter, ad-copy-writer (plus copywriting, abm-copywriting) |
| `ecommerce-pricing-analysis` | afrexai-pricing-strategy, pricing-strategy, ecommerce-price-watcher |
| `ecommerce-bidding-strategy` | amazon-ppc-campaign, ecommerce-ppc-strategy-planner, ad-campaign-optimizer, pilot-ad-campaign-manager-setup |
| `finance-quant-backtesting` | quant, quantitative-research, backtesting, backtesting-frameworks |
| `finance-financial-report-analysis` | financial-report-automator, financial-report-tracker, financial-report-interpreter, finance-report-analyzer |
| `finance-investment-research` | investment-research, investment-researcher-digital-employee, valuation, valuation-analysis |
| `finance-business-analysis` | ba-workbench, business-new, finance, financial-literacy, finance-radar |
| `education-training-program` | education, training-course-designer, training-delivery-manager, education-program, education-project-suite |
| `education-student-assessment` | education, education-search, hsk-learning |
| `education-quiz-generation` | education, lesson-plan-architect, teacher-lesson-plans |
| `education-lesson-planning` | lesson-plan-architect, teacher-lesson-plans, education, training-course-designer |
| `academic-gaokao-expert` | gaokao, gaokao-essay, gaokao-volunteer-advisor-new |
| `academic-paper-search` | paper-searcher, searchapi-scholar-search, academic-research-hub |
| `academic-academic-writing` | academic-writing, academic-writing-refiner, academic-paper-assistant, academic-pre-review-committee |
| `academic-statistical-analysis` | statistical-analysis-advisor, biostatistics, data-analysis, ai-data-analysis |
| `legal-litigation-strategy` | legal, litigation-response, litigation-jurisdiction, litigation-hold-notice-drafter |
| `legal-legal-research` | legal-advisor, legal-hybrid-skill, legaldoc-ai, law, lawclaw, koompi-legal |

**Tips for finding skill slugs:**
- Search by domain keywords: `skillhub search "social media"`, `skillhub search pricing`, etc.
- Chinese skills often have descriptive slugs based on their feature names
- Some skills exist in remote registry only (not in the local index) — `skillhub install` still works, it just downloads directly

### Step 2 — Install each skill

```bash
skillhub install <slug> --dir ~/.hermes/skills/
```

Install all skills in parallel when they're independent. If a download times out, try alternatives or download directly via CDN.

**Common pitfalls:**
- `security-audit` may timeout → use `security-auditor` instead
- `clean-code-review` may already be installed → skillhub reports conflict, skip it
- Skills go to `~/.hermes/skills/` (the active profile's skills dir)

### Step 3 — Verify installation

```bash
ls ~/.hermes/skills/<slug>/SKILL.md
```

Every skill must have a SKILL.md file.

### Step 4 — Create the orchestration skill

Create a custom skill that orchestrates the expert pack's workflow. Follow the `hermes-agent-skill-authoring` conventions:

- `name` at class level (e.g. `code-review-senior`, not `code-review-2024-06-30`)
- `category: software-development`
- Frontmatter with `tags`, `metadata.hermes`
- Body with:
  - **## Quand utiliser ce skill** — trigger phrases (French + English)
  - **## Dépendances** — list of sub-skills with descriptions
  - **## Workflow** — numbered steps matching the expert pack's stages
  - **## Règles d'or** — invariants
  - **## Exportation finale** — deliverables

### Step 5 — Add auto-loading triggers

Patch the orchestration skill's frontmatter with `metadata.hermes.triggers` — an exhaustive list of French and English phrases that should trigger auto-loading:

```yaml
metadata:
  hermes:
    triggers:
      - trigger phrase one
      - trigger phrase two
      - translation française
    tags:
      - related
      - descriptive
      - tags
```

Include:
- Domain keywords (e.g. "code review", "revue de code")
- Tool/product names (e.g. "OpenAPI", "Swagger", "Tencent Cloud")
- Action phrases (e.g. "refactorer ce code", "documenter cette API")
- Concepts (e.g. "dette technique", "Clean Code", "SOLID")
- Chinese keywords if applicable (e.g. "小程序", "云函数")

## Profile Specialization Pattern

Each domain ecosystem can be assigned to a dedicated Hermes profile for isolated work:

| Profile | Skills | Use Case |
|---------|--------|----------|
| `code-reviewer` | pr-reviewer, critical-code-reviewer, project-code-standard, security-auditor, clean-code-review, cody + code-review-senior | PR and code quality review |
| `refactorer` | refactoring, ah-refactoring-specialist, code-refactoring, agent-git-oracle, clean-code-review + code-refactoring-senior | Code restructuring |
| `api-designer` | ah-api-designer, sovereign-api-docs-generator, api-dev, api-doc-writer, qa-api-tester, afrexai-api-docs + api-documentation-senior | API design + documentation |
| `devops-engineer` | tencentcloud-infra, tencentcloud-lighthouse-skill, tencentcloud-dnspod-skill, cloudbase, web-development, miniprogram-development, tencent-cos-skill, tencent-agent-storage, tencentcloud-ocr, tencentcloud-asr + tencent-cloud-expert | Tencent Cloud operations |
| `image-processor` | ls-gm-img | Image processing (GraphicsMagick) |
| `ui-ux-designer` | ui-ux-pro-max, superdesign(frontend-design), requirements-analysis, PRD-Writer, prd, prd-writer-pro, prd-to-design-doc, prd-reviewer, brand-cog, visual, logo-creator, poster, svg-draw, theme-factory, design-ui-prototype-expert-pack, prototype, prototype-design, ui-prototype-generator | UI/UX design, PRD writing, brand visual, prototyping |
| `marketing-manager` | social-media-marketing, social-media-scheduler, social-media-optimizer, social-media-management, copywriting, abm-copywriting, copywriting-pro, competitor-analysis, competitor-watch, competitor-analyst, growth, growth-hacker, growth-marketer, official-document-template, business-writing, afrexai-event-planning, marketing-mode, marketing-strategy-domain, content-strategy | Social media, copywriting, competitor analysis, user growth, events, content strategy |
| `ecommerce-manager` | promotion-planning, ecommerce, ecommerce-copywriter, ad-copy-writer, afrexai-pricing-strategy, pricing-strategy, ecommerce-price-watcher, amazon-ppc-campaign, ecommerce-ppc-strategy-planner, ad-campaign-optimizer, pilot-ad-campaign-manager-setup, ecommerce-product-selector, retail-knowledge | Promotion planning, product copywriting, pricing analysis, PPC/bidding strategy |
| `finance-manager` | quant, quantitative-research, backtesting, backtesting-frameworks, financial-report-automator, financial-report-tracker, financial-report-interpreter, finance-report-analyzer, investment-research, investment-researcher-digital-employee, valuation, valuation-analysis, ba-workbench, business-new, finance, financial-literacy, finance-radar | Quant backtesting, financial report analysis, investment research, business analysis, stock tracking |
| `education-manager` | Education (4 sous-packs) | 9 skills |
| `academic-manager` | Academic (4 sous-packs: Gaokao, Paper Search, Academic Writing, Statistical Analysis) | 14 skills |
| `legal-manager` | Legal (2 sous-packs: Litigation Strategy, Legal Research) | 10 skills |

To create a profile equipped with domain skills:

```bash
# Create profile (clone from default to get base skills)
hermes profile create <name> --clone default

# Install domain skills into the profile
skillhub install <slug> --dir ~/.hermes/profiles/<name>/skills/

# Switch to it
hermes --profile <name>
```

### Copy-Once Pattern (Symlinks)

The fastest way to equip existing profiles without re-downloading every skill:

```bash
# Symlink a SkillHub skill from default profile into a specialized profile
ln -sfn ~/.hermes/skills/<slug> ~/.hermes/profiles/<profile>/skills/<slug>

# For skills in subdirectories (e.g. software-development/)
mkdir -p ~/.hermes/profiles/<profile>/skills/<subdir>
ln -sfn ~/.hermes/skills/<subdir>/<slug> ~/.hermes/profiles/<profile>/skills/<subdir>/<slug>
```

**Advantages over re-installing:**
- No re-download (instant, no network)
- No disk duplication (single copy on disk)
- Updates to the skill in the default profile propagate automatically

**Disadvantages:**
- If the default profile's skill is deleted/moved, all symlinks break
- skillhub metadata doesn't track the symlinked copies (manage via manual inventory)

To symlink a full domain ecosystem into existing profiles in batch, use the `templates/batch-symlink-profiles.sh` script:

```bash
bash templates/batch-symlink-profiles.sh image-processor ls-gm-img
bash templates/batch-symlink-profiles.sh code-reviewer \
  --subdir software-development code-review-senior
```

See `references/installed-packs.md` for a complete inventory of which profiles have which skills symlinked.

**Note:** Profiles have fully isolated skills directories. Skills installed to the default profile are NOT visible from other profiles. Installing or symlinking into each profile is required.

## MCP Server Configuration

In addition to skills, Hermes supports MCP (Model Context Protocol) servers for extending capabilities. One common pattern is installing Python MCP servers from PyPI.

### Workflow: Install a Python MCP Server

```bash
# 1. Install via pipx (avoids PEP 668 system-package conflicts)
pipx install <pypi-package>

# 2. Add to Hermes config
hermes config set mcp_servers.<name>.command <binary>
hermes config set mcp_servers.<name>.enabled true

# 3. Verify
hermes mcp list
```

### Example: Office Word MCP Server

```bash
# Pure Python .docx manipulation (no MS Office, LibreOffice, or OnlyOffice needed)
pipx install office-word-mcp-server
hermes config set mcp_servers.office-word.command word_mcp_server
hermes config set mcp_servers.office-word.enabled true
hermes mcp list
```

The server uses `python-docx` to create, read, and manipulate .docx files entirely through Python — no GUI office suite required. Works on any platform including Linux Mint.

### Pitfalls

| Problem | Solution |
|---------|----------|
| `pip install` blocked by PEP 668 | Use `pipx install <pkg>` or `uv tool install <pkg>` |
| `hermes config set` creates duplicate keys | Edit `~/.hermes/config.yaml` directly with `write_file` or patch |
| Server shows in list but tools unavailable | Reload session or restart gateway |
| server fails to start | Check `word_mcp_server --help` for dependencies |

## Multi-Agent Collaboration via Kanban

Once profiles are set up with their domain skills, they can work together automatically via **Hermes Kanban** — a durable SQLite task board that dispatches work to the right profile.

### Architecture

```
Orchestrator (you)
       │
       ▼
  Kanban Board (SQLite) ← dispatcher ticks every 60s
    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼
  code-  refac- api-  devops- image-
 viewer turer  des.  engineer processor
```

The user (orchestrator) creates tasks tagged with the target profile. The dispatcher, running inside the gateway, picks up ready tasks and spawns the assigned profile's worker in an isolated session.

### Initial Setup

```bash
# 1. Enable the in-gateway dispatcher
hermes config set kanban.dispatch_in_gateway true

# 2. Initialize the kanban database (idempotent)
hermes kanban init

# 3. (Optional) Start the daemon for background dispatching
hermes kanban daemon --interval 30 --verbose
```

### Creating Tasks

```bash
hermes kanban create \
  --assignee code-reviewer \
  --priority 3 \
  --skill code-review-senior \
  --goal \
  --max-runtime 30m \
  "Auditer la sécurité du module auth" \
  --body "Vérifier OWASP Top 10, CSRF, XSS"

# --assignee <profile>    : which profile handles this task
# --skill <slug>          : skill to force-load into worker session
# --goal                  : runs a judge loop until task complete
# --max-runtime 30m       : kill worker after 30 min
# --priority 1-5          : numeric priority
# --body "..."            : detailed task description
```

### Task Lifecycle

1. **Created** → `ready`, assigned to profile
2. **Dispatched** → dispatcher spawns the profile worker in isolated session
3. **Running** → worker processes the task with its domain skills
4. **Completed** → result stored on board
5. **Failed** → retry (default 2) → blocks on Nth failure

### Dependency Chains (Sub-tasks)

Use `--parent` to decompose a project into parallel workstreams:

```bash
# Parent task
hermes kanban create --priority 5 --goal \
  "Plateforme e-commerce" \
  --body "Superviser création complète"

# Parallel subtasks for different profiles
hermes kanban create --assignee refactorer --parent t_<parent> \
  --skill code-refactoring-senior "Concevoir architecture DDD"

hermes kanban create --assignee code-reviewer --parent t_<parent> \
  --skill code-review-senior "Auditer sécurité API Stripe"

hermes kanban create --assignee api-designer --parent t_<parent> \
  --skill api-documentation-senior "Documenter endpoints REST"

hermes kanban create --assignee devops-engineer --parent t_<parent> \
  hermes kanban create --assignee devops-engineer --parent t_<parent> \
    --skill tencent-cloud-expert "Déployer sur Tencent Cloud"

  hermes kanban create --assignee image-processor --parent t_<parent> \
    --skill ls-gm-img "Optimiser les images du catalogue"

  hermes kanban create --assignee ui-ux-designer --parent t_<parent> \
    --skill ui-ux-pro-max "Design system + maquettes UI"

  All subtasks run in parallel. Each worker gets its task + parent goal context.

  ### Watching Progress

```bash
hermes kanban list                   # all tasks
hermes kanban tail t_<id>            # follow event stream
hermes kanban show t_<id>            # full details + comments
hermes kanban log t_<id>             # worker output log
```

## Profile Cleanup & Merging

When multiple profiles with identical skill sets exist, merge or delete the redundant ones.

### Merge Pattern

Use when one profile is a subset of another (e.g. `doc-writer` is a subset of `api-designer`):

```bash
# Verify the subset has no unique skills first
diff <(ls ~/.hermes/profiles/primary/skills/software-development/) \
     <(ls ~/.hermes/profiles/subset/skills/software-development/)

# If identical subset, delete the redundant profile
hermes profile delete redundant-profile -y
```

### Cleanup Rules

- **Merge subsumed** profiles into the more complete one (doc-writer → api-designer, security-auditor → code-reviewer, architect → refactorer)
- **Delete empty shells** — profiles with only default Hermes-curated skills and no specialization add no value
- **Keep default** as the orchestrator profile (runs the gateway, creates tasks)
- **Keep specialized** profiles as workers (code-reviewer, refactorer, api-designer, devops-engineer, image-processor)
- **Never delete profiles with custom data** (check sessions, memories, cron jobs first)

## Auto-Loading Mechanism

The Hermes system prompt instructs the agent:

> "Before replying, scan the skills below. If a skill matches or is even partially relevant to your task, you MUST load it with skill_view(name) and follow its instructions."

This means auto-loading happens at two levels:

1. **System-driven** — the `<available_skills>` block lists all installed skills with descriptions; the agent scans them each turn
2. **Trigger-driven** — skills with `metadata.hermes.triggers` in their frontmatter get matched against user queries. The triggers list is the primary signal the agent uses to decide relevance.

For best results, keep trigger lists exhaustive (10-60 entries, French + English + Chinese as appropriate) and update them when new domain concepts emerge.

## Common Pitfalls

1. **Profile isolation surprises** — skills installed to `~/.hermes/skills/` are NOT visible from other profiles. Each profile needs its own copy or a symlink.
2. **Trigger lists too narrow** — if the trigger list only has English terms and the user speaks French, auto-loading fails silently. Include all user languages.
3. **Orchestration skill name too specific** — name must be at class level. `fix-mwanaitech-invoice-skill` is wrong; `code-review-senior` is right.
4. **Security audit skill unavailable** — `security-audit` frequently times out from SkillHub CDN. Use `security-auditor` as drop-in replacement.
5. **Forgetting to update triggers after expansion** — when you add new sub-skills to a domain, update the orchestration skill's triggers and dependencies section.
6. **Overlapping orchestration skills** — two orchestration skills covering the same domain cause confusion. Prefer extending one over creating a sibling.
7. **Chinese keywords in frontmatter** — some Chinese chars may cause YAML parsing issues. Test after adding.
8. **Kanban dispatcher not running** — tasks stay `ready` forever if the gateway isn't running or `kanban.dispatch_in_gateway` is false. Always check `hermes gateway status`.
9. **Symlink breakage** — if the source skill in the default profile is deleted or moved, all profile symlinks break silently. Document your symlink inventory.
10. **Hermes-curated skills lack triggers** — curated Hermes skills (like `ls-gm-img`) come without `metadata.hermes.triggers`. They need manual patching to enable auto-loading. Check every curated skill's frontmatter after integrating it into a profile.
11. **New Hub skill needs trigger patch + symlink + profile update** — each new installation follows a repeatable pattern: `skillhub install <slug>` -> read SKILL.md -> add `metadata.hermes.triggers` -> symlink into target profile -> update `references/installed-packs.md` inventory. This prevents orphaned skills invisible to auto-loading or Kanban dispatch.
12. **Kanban task without `--skill` may fail** — workers started by the dispatcher don't load skills by default. Always pass `--skill <orchestration-slug>` so the worker has the right context.
13. **Shell `&` backgrounding caught by foreground guard** — using `&` in a foreground terminal call triggers "Foreground command uses '&' backgrounding." Use `background=true` or sequential commands instead of `for s in ...; do ... & done`.
14. **Frontmatter double `---` after patch** — some skills have non-standard frontmatter (extra fields like `author`, `homepage`, `source` after the closing `---`). Patching can duplicate the `---` separator. Read the full file before patching, and rewrite the entire frontmatter block if the original format is unusual.
15. **Hermes profile auto-registers in Kanban** — after `hermes profile create <name> --clone`, the new profile appears in `hermes kanban assignees` without explicit registration. No additional config needed.
16. **Free LLM models break `kanban decompose`** — `hermes kanban decompose` requires `auxiliary.kanban_decomposer` with a model capable of valid JSON output. DeepSeek V4 Flash Free produces malformed JSON. Workaround: manually create sub-tasks with `--parent`.
17. **Package slug installs fail (404)** — `skillhub install <package-slug>` fails when the slug is a skillspackage URL (a collection). Search for individual skills with `skillhub search <keyword>` and install each separately.

## Verification Checklist

- [ ] All SkillHub skills installed and SKILL.md present
- [ ] Orchestration skill has `metadata.hermes.triggers` with exhaustive multi-language entries
- [ ] Orchestration skill has `metadata.hermes.tags`
- [ ] SkillHub slug mapping is documented (for re-installation)
- [ ] Profile (if created) has skills installed or symlinked in its own skills/ directory
- [ ] `skill_view(name='<orchestration-skill>')` loads without errors
- [ ] Kanban board initialized (`hermes kanban init`)
- [ ] `kanban.dispatch_in_gateway` enabled in config
- [ ] If symlinks used: documented inventory so breakage can be diagnosed
