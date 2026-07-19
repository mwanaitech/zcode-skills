---
name: agent-fleet-deployment
title: Agent Fleet Deployment
description: 'Deploy domain-specific agent teams from SkillHub into Hermes multi-agent architecture. Covers: resolving skillspackage URLs, batch-installing skills, creating profiles, symlinking, adding trigger frontmatter, registering with Kanban, updating daily bilan, consolidating memory.'
tags:
  - hermes
  - multi-agent
  - skillhub
  - kanban
  - profiles
  - deployment
  - onboarding
---

# Agent Fleet Deployment

## When to use

Load this skill when the user asks to **install a team/domain** of skills from SkillHub — any request naming a group like "équipe Marketing", "E-commerce team", "Finance squad", or providing one or more `skillhub.cn/skillspackage/...` URLs.

## Workflow

### Phase 1: Resolve skillspackage URLs

Skillspackage URLs (`skillhub.cn/skillspackage/...`) are **collections**, not individual installable slugs. The website is JavaScript-rendered, so scraping is unreliable. Instead:

```bash
# Search for individual skills by domain keywords
skillhub search "marketing" 2>&1
skillhub search "social media" 2>&1
skillhub search "pricing" 2>&1
# etc. — iterate over the domain's sub-topics
```

Collect the exact slugs from search results. Installable slugs match `^[a-z0-9][a-z0-9._-]*[a-z0-9]$`.

### Phase 2: Batch install skills

Install each skill individually — avoid `for ... &` in loops (triggers background-detection guard).

```bash
# Safe pattern per skill (install one at a time)
skillhub install "slug-name" --dir ~/.hermes/skills/ 2>&1 | tail -1
```

**Pitfall**: The `&` backgrounding operator in a shell `for` loop triggers the foreground guard. Either:
- Run one `skillhub install` per `terminal()` call, OR
- Use `background=true` with `wait` if you must batch

### Phase 3: Create dedicated agent profile

```bash
hermes profile create domain-name \
  --clone \
  --description "Short description of the domain" 2>&1
```

**Naming convention**: Use hyphens, lowercase, domain-focused. Examples: `marketing-manager`, `ecommerce-manager`, `finance-manager`.

### Phase 4: Symlink skills into profile

```bash
for s in skill-a skill-b skill-c; do
  ln -s ~/.hermes/skills/$s ~/.hermes/profiles/profile-name/skills/$s 2>/dev/null
done
```

This keeps one source copy of each skill (in `~/.hermes/skills/`) and references from profiles. Skills stay in sync across all profiles.

### Phase 5: Add trigger frontmatter (for auto-loading)

Open each key skill's `SKILL.md` and add `metadata.hermes.triggers`. This enables the dispatcher to auto-load the skill when the user mentions a related keyword.

**Template** (insert after the `description:` line):

```yaml
tags:
  - domain-tag-1
  - domain-tag-2

metadata:
  hermes:
    triggers:
      - keyword-fr-1
      - keyword-en-1
      - keyword-fr-2
```

**Critical pitfall — frontmatter corruption**: Some hub-installed skills have a single-line `metadata:` field (JSON format like `metadata: {"clawdbot": {...}}`). When you add `tags:` and a structured `metadata.hermes.triggers` after a single-line YAML frontmatter, the old `---` line and the new `---` line stack, producing a double separator that breaks YAML parsing.

**Detection**: Read the file after patching:
```bash
read_file ~/.hermes/skills/skill-name/SKILL.md | head -40
```
If you see two `---` lines right before `# Skill Name`, the frontmatter is corrupted.

**Fix**: Use `write_file` to rewrite the entire file cleanly (not `patch` — the corruption is structural):
```bash
write_file path=~/.hermes/skills/skill-name/SKILL.md content="---
name: ...
description: ...
tags: ...
metadata:
  hermes:
    triggers: [...]
---

# Original body content (starting from # Skill Name)
...
```
Be careful to preserve the original body content below the frontmatter.

### Phase 6: Update daily bilan

Add a section under `## Travail effectué` documenting:
- Skills installed (grouped by sub-domain)
- Profile created
- Total skill count
- Any issues encountered

Use `patch` (preferred) or `write_file` for the bilan. Prefer `read_file` first (full file, not paginated) to avoid offset-based `patch` failures.

### Phase 7: Consolidate memory

If memory is near the 2,200-char limit, use a batch `operations` array to remove stale entries and add the updated one:

```json
{
  "operations": [
    {"action": "remove", "old_text": "stale substring to match"},
    {"action": "add", "content": "new concise entry"}
  ]
}
```

### Phase 8: Verify with Kanban

```bash
hermes kanban assignees 2>&1
```

The new profile should appear in the list. If missing, the profile wasn't registered — check the profile directory exists under `~/.hermes/profiles/`.

## Quick-reference checklist

| Step | Command |
|------|---------|
| Search skills | `skillhub search "<domain>" 2>&1` |
| Install skill | `skillhub install <slug> --dir ~/.hermes/skills/ 2>&1` |
| Create profile | `hermes profile create <name> --clone --description "..."` |
| Symlink skills | `ln -s ~/.hermes/skills/<s> ~/.hermes/profiles/<p>/skills/<s>` |
| Add triggers | `patch` or `write_file` on `SKILL.md` |
| Handle corruption | `write_file` to rewrite entire file |
| Update bilan | `patch` on `~/.hermes/daily-bilan/YYYY-MM-DD.md` |
| Consolidate memory | `memory` with `operations` array |
| Verify | `hermes kanban assignees` |

## Pitfalls

| Problem | Solution |
|---------|----------|
| `skillhub search` returns nothing or 1 line | Broaden the query — use general domain terms, not skillspackage slugs |
| `skillhub install <slug>` exits 124 (timeout) | Retry individually with a longer `timeout=120` |
| Shell `&` in `for` loop triggers background guard | Install one skill per `terminal()` call, or use `background=true` |
| Double `---` in frontmatter after patching | Use `write_file` to rewrite the whole file cleanly |
| Memory at 2,200/2,200 chars when adding | Use `operations` array to remove stale entries and add in one call |
| `patch` fails with "Found 2 matches" | Accented chars differ from the stored file. Use `read_file` first to get exact bytes, or use `replace_all=true` if safe |
| Profile not showing in `kanban assignees` | Profile was created but Kanban didn't auto-register. Check `~/.hermes/profiles/<name>/` exists |
| `kanban decompose` fails with malformed JSON | The free model can't produce valid structured output. Fall back to manual sub-tasks with `--assignee` and `--parent` |

## See also

- `bilan-journalier` — daily activity log, updated after each deployment
- `hermes-agent` (bundled) — config.yaml, profile system, Kanban commands
- `domain-skill-organization` (hub-installed) — alternative approach to domain skill ecosystems
- `hermes-mcp-configuration` — installing and configuring MCP servers (tools exposure, complementary to agent profiles)
