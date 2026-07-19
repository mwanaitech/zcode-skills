---
name: multi-agent-skill-sync
description: Deploy and synchronize third-party skill packs across multiple AI agent environments (Hermes, OpenCode CLI, etc.).
category: autonomous-ai-agents
tags: [skills, sync, hermes, opencode, mcp, deployment]
---

# Multi-Agent Skill Synchronization

Deploy external skill repositories atomically across Hermes and OpenCode CLI environments while preserving config integrity.

## Trigger Conditions
- User asks to install/copy/sync skills from a GitHub repo into Hermes and/or OpenCode.
- User mentions "skill pack", "atomic skills", "clone skills", or names both tools together.
- User requests MCP server configuration in Hermes alongside OpenCode.

## Workflow

### 1. Clone & Inspect
```bash
git clone <repo-url> /tmp/<repo-name>
# Count atomic skills
ls /tmp/<repo-name>/skills/ | wc -l
```

### 2. Dual Deployment
Target paths:
- Hermes: `~/.hermes/skills/<repo-name>/`
- OpenCode: `~/.config/opencode/skills/<repo-name>/`

**Parallel clone approach** (preferred):
```bash
git clone <repo-url> ~/.hermes/skills/<repo-name> &
git clone <repo-url> ~/.config/opencode/skills/<repo-name> &
```

**Fallback if network fails** (one clone succeeds):
```bash
# If OpenCode clone times out:
rm -rf ~/.config/opencode/skills/<repo-name>
cp -r ~/.hermes/skills/<repo-name> ~/.config/opencode/skills/<repo-name>
```
Verify file counts match in both destinations.

### 3. Hermes Config Protection — CRITICAL PITFALL
`~/.hermes/config.yaml` is **security-protected** against automated edits.
- NEVER use `patch`, `write_file`, or direct append on `~/.hermes/config.yaml`.
- ALWAYS use `hermes config` CLI commands or instruct the user to edit manually.
- For MCP servers, generate the exact YAML block and ask user to paste it; do not attempt silent injection.

### 4. OpenCode JSONC Validation
OpenCode uses JSONC (JSON with comments). **Python `json` module fails** on BOM/control characters often present in these files.

**Use Node.js for validation:**
```bash
node -e "
const fs = require('fs');
let raw = fs.readFileSync('/home/gibson/.config/opencode/opencode.jsonc', 'utf8');
let cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '');
cleaned = cleaned.replace(/^[ \t]*\/\/.*$/gm, '');
const data = JSON.parse(cleaned);
console.log('MCP servers:', Object.keys(data.mcp || {}).join(', '));
"
```

## Handling Non-Native Skill Formats

Third-party agent repos often ship their own YAML frontmatter schema (e.g. `name`, `description`, `color`, `emoji`, `vibe`, `tools`) rather than the standard Hermes SKILL.md format. Do **not** copy these `.md` files verbatim — they will fail skill loading.

### Conversion Workflow

1. **Clone and inspect** the repo structure:
```bash
git clone <repo-url> /tmp/<repo-name>
find /tmp/<repo-name> -name "*.md" | head -20
```

2. **Identify the schema** by reading a sample file. Look for custom frontmatter fields like `color`, `emoji`, `vibe`, `tools`, `personality`.

3. **Run the conversion script** (`scripts/convert-agent-pack.py` — distributed with this skill):
```bash
python3 ~/.hermes/skills/autonomous-ai-agents/multi-agent-skill-sync/scripts/convert-agent-pack.py \
  --source /tmp/<repo-name> \
  --hermes-target ~/.hermes/skills \
  --opencode-target ~/.config/opencode/skills
```

The script:
- Extracts YAML frontmatter from each `.md` agent file
- Maps `name` → skill name, `description` → description, infers `category` from directory structure
- Preserves body content after the frontmatter
- Writes valid `SKILL.md` files into both targets

4. **Verify conversion integrity**:
```bash
ls ~/.hermes/skills | wc -l
ls ~/.config/opencode/skills | wc -l
# Both counts should match
```

### Field Mapping Reference

| Source Field | Destination | Fallback |
|---|---|---|
| `name` | `name` (slugified) | filename stem |
| `description` | `description` | `""` |
| `vibe` | appended to `description` | omit |
| `emoji` | preserved in body | omit |
| `color` | preserved in body (e.g. `_color: blue_`) | omit |
| directory name | `category` | `"specialized"` |

### Pitfalls

- **Two-level frontmatter**: Some repos wrap frontmatter in `---` blocks; ensure the parser splits on the FIRST two `---` delimiters only.
- **Missing category**: When `divisions.json` or similar metadata exists, load it to map agent directories → categories. Otherwise derive from directory names.
- **Name collisions**: Slugify aggressively (`re.sub(r'[^a-z0-9]+', '-', name.lower())`) to avoid invalid skill names.
- **Excluded directories**: Skip `.git`, `examples/`, `scripts/`, `integrations/`, `strategy/` — these contain non-agent content.

## Scripts Reference
- `scripts/convert-agent-pack.py` — reusable converter for YAML-frontmatter agent repos → Hermes/OpenCode skills. Invoke it directly for any new agent pack.

## Verification
- Count skills in both destinations (`ls ... | wc -l`) and compare.
- For MCP: validate config syntax before declaring success.
- Create ad-hoc verification scripts in `/tmp/hermes-verify-*` when required by system safeguards.
- Validate Hermes YAML separately from OpenCode JSONC; do not reuse the same parser.

## Reference Paths
- OpenCode binary path: `~/.opencode/bin/opencode`
- Hermes skills root: `~/.hermes/skills/`
- OpenCode skills root: `~/.config/opencode/skills/`
