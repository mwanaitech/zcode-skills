---
name: cli-skill-sync
description: "Synchronize skills between CLI AI agents (Hermes, OpenCode, Codex, etc.)."
version: 1.0.0
author: Hans Axel Mbina Mabicka
license: MIT
category: devops
metadata:
  hermes:
    tags: [skills, synchronization, hermes, opencode, codex, cli-agents]
---

# CLI Skill Synchronization

When a user has multiple CLI AI agents installed (Hermes, OpenCode CLI, Codex CLI, Claude Code, etc.) and wants them to share the same skill library, use this pattern.

## Common Skill Directories

| Agent | Skills directory |
|-------|------------------|
| Hermes (default) | `~/.hermes/skills/` |
| Hermes (profile) | `~/.hermes/profiles/<name>/skills/` |
| OpenCode CLI | `~/.config/opencode/skills/` |
| Codex CLI | `~/.config/codex/skills/` (if exists) |
| Claude Code | `~/.claude/skills/` (if exists) |

## One-Way Sync Pattern (Source → Target)

### 1. Verify both sides
```bash
ls ~/.hermes/skills/ | head -5
ls ~/.config/opencode/skills/ | head -5
```
Each skill is one flat directory containing at minimum `SKILL.md`, optionally `references/`, `scripts/`, `templates/`, `assets/`.

### 2. Compute delta (source-only items)
```bash
comm -23 <(ls ~/.hermes/skills/ | sort) <(ls ~/.config/opencode/skills/ | sort) > /tmp/skills-to-sync.txt
```

This produces names present in source but MISSING in target. Use `comm -13` for target-only, `comm -12` for intersection.

### 3. Bulk copy
```bash
cat /tmp/skills-to-sync.txt | while read skill; do
  if [ -d "$HOME/.hermes/skills/$skill" ]; then
    cp -r "$HOME/.hermes/skills/$skill" "$HOME/.config/opencode/skills/"
  fi
done 2>&1 | tee /tmp/skill-sync.log
```

### 4. Verify
```bash
ls ~/.config/opencode/skills/ | wc -l
comm -23 <(ls ~/.hermes/skills/ | sort) <(ls ~/.config/opencode/skills/ | sort) | wc -l
# => 0 means perfect sync
```

## Bidirectional Sync (Merge)

If both sides have unique skills and the user wants a merged union:
```bash
# Hermes-only -> OpenCode
comm -23 <(ls ~/.hermes/skills/ | sort) <(ls ~/.config/opencode/skills/ | sort) | while read s; do cp -r "$HOME/.hermes/skills/$s" "$HOME/.config/opencode/skills/"; done

# OpenCode-only -> Hermes
comm -13 <(ls ~/.hermes/skills/ | sort) <(ls ~/.config/opencode/skills/ | sort) | while read s; do cp -r "$HOME/.config/opencode/skills/$s" "$HOME/.hermes/skills/"; done
```

## Pitfalls

- **Never delete target-only skills** unless the user explicitly asks. Agents may ship native skills that don't exist in the source.
- **Pre-filter with `comm`** rather than blind `cp -r` to avoid overwriting target-native skills.
- **No index file to update**: Hermes and OpenCode scan their skills directories lazily at startup; there is no JSON registry to patch.
- **Hub-installed skills**: if the source contains skills installed via `hermes skills install`, those are bundled and won't be individually present as directories. Only directory-based local skills can be synced this way.
- **Size**: copying 800+ skills (~50MB) takes several minutes and generates a lot of I/O. Run in background if possible.

## Multi-Profile Sync (Hermes)

To propagate skills across all Hermes profiles (default + user profiles):
```bash
for profile_dir in "$HOME/.hermes/profiles/"*/skills/; do
  comm -23 <(ls ~/.hermes/skills/ | sort) <(ls "$profile_dir" | sort) | while read s; do
    if [ -d "$HOME/.hermes/skills/$s" ]; then
      cp -r "$HOME/.hermes/skills/$s" "$profile_dir"
    fi
  done
done
```
