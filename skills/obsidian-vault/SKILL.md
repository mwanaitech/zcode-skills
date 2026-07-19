---
name: obsidian-vault
description: Search, create, and manage notes in the Obsidian vault with wikilinks and index notes. Use when user wants to find, create, or organize notes in Obsidian.
version: 1.0.0
author: mattpocock
license: MIT
platforms:
- linux
- macos
- windows
source: https://github.com/mattpocock/skills/tree/main/skills/personal/obsidian-vault
metadata:
  hermes:
    icon: lucide:notebook-pen
    tags:
    - Obsidian
    - Notes
    - Wikilinks
---

# Obsidian Vault

## Opening the Obsidian app

**Pitfall:** The agent cannot open graphical Electron applications (Obsidian has no headless mode). Running `obsidian --vault=...` in a headless/terminal-only environment will fail silently or crash.

**Instead, give the user the exact command to run on their own desktop:**

```bash
obsidian --vault=/absolute/path/to/VaultName
```

Or tell them to launch Obsidian manually and use **"Open folder as vault"** → select the vault directory.

If the user asks "ouvre obsidian" or similar, provide the command; do not attempt to execute it yourself.

## Vault creation (when none exists)

If the user asks to create or set up an Obsidian vault, or no vault exists at the expected path:

1. **Pick/create a vault directory** — any absolute path the user prefers. Common choices: `~/Obsidian`, `~/Documents/Obsidian Vault`, or a project-specific path.
2. **Create the `.obsidian/` config folder** inside the vault root. This is what makes it a "real" vault recognized by the Obsidian app. At minimum:
   - `mkdir -p <vault>/.obsidian`
   - Optionally write `app.json`, `appearance.json`, or `core-plugins-migration.json` for preset preferences.
3. **Create the folder structure** the user needs (e.g., `00_Inbox/`, `01_Profil/`, `02_Projets/`, `03_Archives/`).
4. **Create an index/root note** (e.g., `Index.md`) that links to major sections via `[[wikilinks]]`.
5. **Tell the user how to open it** — see "Opening the Obsidian app" above.

## Vault location

`/mnt/d/Obsidian Vault/AI Research/` (example; varies per user)

Mostly flat at root level.

## Naming conventions

- **Index notes**: aggregate related topics (e.g., `Ralph Wiggum Index.md`, `Skills Index.md`, `RAG Index.md`)
- **Title case** for all note names
- No folders for organization - use links and index notes instead

## Linking

- Use Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`
- Notes link to dependencies/related notes at the bottom
- Index notes are just lists of `[[wikilinks]]`

## Workflows

### Search for notes

```bash
# Search by filename
find "/mnt/d/Obsidian Vault/AI Research/" -name "*.md" | grep -i "keyword"

# Search by content
grep -rl "keyword" "/mnt/d/Obsidian Vault/AI Research/" --include="*.md"
```

Or use Grep/Glob tools directly on the vault path.

### Create a new note

1. Use **Title Case** for filename
2. Write content as a unit of learning (per vault rules)
3. Add `[[wikilinks]]` to related notes at the bottom
4. If part of a numbered sequence, use the hierarchical numbering scheme

### Find related notes

Search for `[[Note Title]]` across the vault to find backlinks:

```bash
grep -rl "\\[\\[Note Title\\]\\]" "/mnt/d/Obsidian Vault/AI Research/"
```

### Find index notes

```bash
find "/mnt/d/Obsidian Vault/AI Research/" -name "*Index*"
```

## References

See `references/` directory for session-specific knowledge banks:
- `references/mwana-itech-ecosystem.md` — Business context, pricing, infrastructure, and client conventions for Mwana-Itech (Gabon digital services company).
