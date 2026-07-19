# Frontmatter Recovery Reference

## Detecting corruption

After patching a `SKILL.md` to add `metadata.hermes.triggers`, a common corruption is a **double `---` separator**:

```
---
name: finance
tags: ...
metadata:
  hermes:
    triggers: [...]
---
---
# Skill body
```

The second `---` (from the original frontmatter) didn't get merged — it stacked. Read the first 40 lines after every frontmatter patch:

```bash
read_file ~/.hermes/skills/<name>/SKILL.md | head -40
```

If you see `---\n---` consecutively, the frontmatter is broken.

## Root cause

Some hub-installed skills have their old metadata as a **single-line JSON** field:

```yaml
---
name: finance
description: ...
metadata: {"clawdbot": {"config": ...}}
---
```

When you replace the frontmatter via `patch`, the new `---` closing delimiter stacks with the original old one, producing `---\n---` and YAML parser failures.

## Recovery procedure

1. **Check the extent** — read lines 35-42 to find the double separator
2. **Count original frontmatter lines** — the old `---` closing line is somewhere mid-file
3. **Write the whole file cleanly**:

```bash
# Read the complete file first
read_file ~/.hermes/skills/<name>/SKILL.md

# Rewrite with clean frontmatter + preserved body
write_file path=~/.hermes/skills/<name>/SKILL.md content="---
name: <name>
description: <original description>
tags:
  - tag1
metadata:
  hermes:
    triggers:
      - kw1
      - kw2
---

<original body content starting from # Skill Name>
"
```

**Do NOT use sed/awk** — they don't understand YAML frontmatter boundaries and will make it worse.

## Prevention

When the original file uses `metadata: {"key": "value"}` (JSON-on-one-line format), **always use `write_file` to rewrite the whole frontmatter**, not `patch`. The JSON format is incompatible with YAML multi-line expansion and trying to merge them produces the double-`---` corruption.
