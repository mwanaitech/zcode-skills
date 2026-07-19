---
name: knowledge-offloading
title: Knowledge Offloading — gbrain
description: Offload task-specific context, user preferences, and durable knowledge from the session context window (MEMORY/USER.md) into gbrain, a persistent PGLite knowledge base accessible via MCP. Reclaims context budget, reduces token cost, and preserves cross-session knowledge without cluttering the system prompt.
---

# Knowledge Offloading (gbrain)

When the user asks you to "store knowledge", "free up memory", "save for later", or when your MEMORY/USER.md budget is tight (~80%+), offload detailed entries to gbrain and keep only a compact index pointer in the system prompt.

## Architecture

- **Storage**: gbrain (MCP-integrated, PGLite DB at `~/.gbrain/brain.pglite`)
- **Access via terminal**: `gbrain put <slug>`, `gbrain get <slug>`, `gbrain search <query>`, `gbrain list`
- **Access via MCP JSON-RPC** (gbrain serve): `get_page`, `put_page`, `list_pages`, `search` — same semantics as CLI
- **Version**: v0.42.59.0, installed via bun, 102 MCP tools in Hermes

## When to offload

1. **MEMORY > 80% full** — consolidate into gbrain pages, replace with index pointer
2. **USER PROFILE > 60% full** — same treatment
3. **After a complex task** (5+ tool calls) — save decisions, findings, and learned context
4. **User says "sauvegarde", "range", "stocke", "souviens-toi de ça"** — immediate offload
5. **New stable fact about environment, user preference, or workflow** — belongs in gbrain, not memory

## Workflow

### Create / update a page

```
cat << 'EOF' | gbrain put <slug>
---
title: Human-readable title
date: 2026-07-16
tags: tag1, tag2, tag3
links:
  - other-slug
  - another-slug
---

# Title (markdown body)

Content here...
EOF
```

- **slug**: use lowercase with hyphens (e.g. `environnement-systeme`, `preferences-hans-axel`)
- **frontmatter**: title, date, tags, links (optional)
- **body**: plain markdown. **IMPORTANT**: gbrain `search` only indexes the **body text** (`compiled_truth`), NOT tags or frontmatter. Put searchable keywords in the body.
- **tags**: for human reference only when reading via `get` — invisible to `search`

### Read a page

```
gbrain get <slug>       # returns JSON with full content
```

### Search

```
gbrain search <mot-cle>
```

Returns a scored list. Scores < 0.2 are low relevance. Only body text is indexed — if search finds nothing, try synonyms or words that appear in the body paragraphs.

### List all pages

```
gbrain list
```

### Consolidate memory into index

After offloading, replace detailed memory entries with a compact pointer:

```
INDEX GBRAIN: <N> pages — <slug1>, <slug2>, <slug3>...
Avant reponse: gbrain search <mot> → get <slug>
```

## Pitfalls

- **`gbrain search` ignores tags/frontmatter** — only searches body paragraphs. If search returns nothing, the keyword isn't in the body text. Use `get <slug>` directly when you know the slug, or add the keyword to the body.
- **`gbrain query` (hybrid) returns `[]`** without embeddings configured. For vector search, set `OPENAI_API_KEY` or configure Ollama. The default mode is conservative (no embedding key).
- **Put overwrites** — `gbrain put <slug>` replaces the entire page. To append, get the current content, merge, and put back.
- **No full-text search in frontmatter** — dates, tags, titles in YAML frontmatter are NOT indexed for search. Include key info in the body.
- **Chunking is automatic** — pages larger than ~4KB may split into multiple chunks; `search` still works across chunks.
- **Auto-links** are created based on body references; unresolved links produce errors in the response JSON but don't break the page.

## Example: Memory condensation

Before (93% — 2046 chars):
```
Skill de reference mwana-itech-profil: ...
Zero tolerence accents FR...
Skill multi-agent-skill-sync...
...
```

After (9% — 214 chars):
```
INDEX GBRAIN: 6 pages — environnement-systeme, preferences-hans-axel,
procedures-outils, profil-mwana-itech, commandes-utiles-gbrain,
demo-gbrain-hermes. Avant reponse: gbrain search <mot> → get <slug>.
```

## Recommended gbrain page structure

| Page slug | Content |
|-----------|---------|
| `environnement-systeme` | OS version, package manager quirks (PEP 668), Node.js, network constraints, locale, PDF generation |
| `preferences-<user>` | User's websites, preferred workflow, tools, constraints, no-destructive-ops rule |
| `procedures-outils` | Recurring tool setup (Strix, skills sync, CV generation, cron), command references |
| `profil-<user>` | Full CV, rates, clients, project rules — one-stop profile |
| `commandes-utiles-<outil>` | Cheat-sheet for a tool's CLI or MCP commands |
