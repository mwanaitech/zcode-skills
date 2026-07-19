---
name: hermes-mcp-configuration
title: Hermes MCP Configuration
description: 'Configure, install, and troubleshoot MCP (Model Context Protocol) servers in Hermes Agent. Covers: finding servers, installation methods (pipx/npx/uvx), config setup via hermes config set mcp_servers.*, environment variables in .env, verification with hermes mcp list, and common pitfalls (PEP 668 on Debian/Ubuntu/Linux Mint, archived repos, corrupt frontmatter).'
tags:
  - hermes
  - mcp
  - configuration
  - servers
  - setup
  - integration
related_skills:
  - agent-fleet-deployment
---
# Hermes MCP Configuration

## When to use

Load this skill when the user asks to **install, configure, or troubleshoot an MCP server** in Hermes — any request involving adding a new MCP server (e.g. office-word, hyperbrowser, a GitHub MCP server, or any `mcp-server-*` package).

MCP servers are distinct from skills: servers add **tools** (executable functions available in every session), while skills add **prompt-level knowledge** (loaded by trigger detection). This skill covers server-side configuration only.

## Workflow

### Phase 1: Identify the MCP server

Determine what the server is and how it's distributed:

| Distribution | Detection | Installation method |
|-------------|-----------|-------------------|
| PyPI | `pipx install <package>` or `uvx <package>` | pipx (Python CLI) |
| npm | `npx <package>` | npx (Node.js CLI) |
| Docker | `docker run <image>` | Docker pull + run |
| HTTP | URL-based MCP endpoint | `url:` in config |
| GitHub (manual) | `git clone`, setup script | venv + pip install |

**Check if it's already installed:**
```bash
hermes mcp list 2>&1
```

### Phase 2: Install the server binary

#### Python packages on PEP 668 systems (Debian/Ubuntu/Linux Mint)

Modern Debian-based systems block `pip install` (even `--user`) per PEP 668. Use **pipx**:

```bash
pipx install <package-name>
```

This creates an isolated venv and symlinks the binary into `~/.local/bin/`.

**Do NOT use:** `pip install --user`, `uv pip install --system`, or the `--break-system-packages` flag.

**Alternative — uv venv:**
```bash
uv venv --python 3.12
source .venv/bin/activate
uv pip install -r requirements.txt
```

#### npm packages
```bash
# Verify they work standalone first
npx -y <package-name>
```

#### Docker images
The server runs in a container. Configure with `command: docker` and proper args.

### Phase 3: Configure in Hermes config

```bash
# For command-based servers (stdio transport):
hermes config set mcp_servers.<server-name>.command <binary-or-runtime>
hermes config set mcp_servers.<server-name>.args '<json-array-of-args>'
hermes config set mcp_servers.<server-name>.enabled true
hermes config set mcp_servers.<server-name>.description "What it does"

# Example for npx-based servers:
hermes config set mcp_servers.hyperbrowser.command npx
hermes config set mcp_servers.hyperbrowser.args '["-y","hyperbrowser-mcp"]'
hermes config set mcp_servers.hyperbrowser.enabled true

# Example for pipx-installed binary:
hermes config set mcp_servers.office-word.command word_mcp_server
hermes config set mcp_servers.office-word.enabled true

# For URL-based servers (SSE transport):
hermes config set mcp_servers.server-name.url https://example.com/mcp
hermes config set mcp_servers.server-name.enabled true
```

### Phase 4: Add API keys to .env

MCP servers read API keys from **environment variables**, NOT from `config.yaml`. Always add them to `~/.hermes/.env`:

```bash
echo "# Server Name" >> ~/.hermes/.env
echo "SERVER_API_KEY=your_key_here" >> ~/.hermes/.env
```

**Key naming:** Must match exactly what the server expects (check its docs). Common patterns:
- `HYPERBROWSER_API_KEY`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`

### Phase 5: Verify

```bash
hermes mcp list 2>&1
```

Expected output:
```
Name             Transport         Tools        Status
server-name      command/binary    all          ✓ enabled
```

If the server doesn't appear, check:
1. The binary is in PATH (`which <binary>`)
2. The config entry has no typos
3. `enabled: true` is set

**Note:** Servers configured during a running session are NOT available until the next session start or MCP reload. The `hermes mcp list` command reads from config — it does NOT start the server.

## Common Pitfalls

### PEP 668 on Debian/Ubuntu/Linux Mint
Modern Debian-based systems block `pip install` (even `--user`) per PEP 668. This causes errors like:
```
error: externally-managed-environment
× This environment is externally managed
╰─> To install Python packages system-wide, try apt install python3-xyz...
```

**Workarounds:**
1. **pipx** (recommended):
   ```bash
   pipx install <package>
   ```
   - Creates an isolated venv and symlinks the binary into `~/.local/bin/`.
   - Hermes already includes `~/.local/bin` in PATH.

2. **uv venv** (alternative):
   ```bash
   uv venv --python 3.12
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

**Do NOT use:**
- `pip install --user` (blocked by PEP 668).
- `uv pip install --system` (blocked).
- `--break-system-packages` (risks breaking system Python).

**Timeouts during large downloads (e.g., `torch`):**
- Install **CPU-only versions** to reduce size:
  ```bash
  uv pip install torch --index-url https://download.pytorch.org/whl/cpu
  ```
- Install dependencies **one by one** to avoid timeouts:
  ```bash
  uv pip install numpy && uv pip install transformers
  ```

### MCP Filesystem Server (npm package missing)
The MCP `filesystem` server is often configured via `npx -y @modelcontextprotocol/mcp-filesystem`, but this package **does not exist** on the public npm registry. This causes the server to fail silently or with `404 Not Found` errors.

**Symptoms:**
- `hermes mcp list` shows the server as `✓ enabled` but tools fail with `ENOENT` or `404`.
- Background processes exit with `npm error 404`.

**Solutions:**
1. **Use the terminal for file operations** instead of the MCP `filesystem` when possible.
2. **Use alternative MCP servers** like `office-word` for `.docx` files or `hyperbrowser` for web-based operations.
3. **Check for local installations** of the MCP server binary (e.g., in `~/.hermes/scripts/` or `/usr/local/bin/`).
4. **Verify the package name** — some MCP servers use `@modelcontextprotocol/mcp-server-filesystem` or similar variants.

See `references/mcp-filesystem-troubleshooting.md` and `references/pep668-troubleshooting.md` for detailed error transcripts and workarounds.

### MCP Filesystem Server (npm package missing)
The MCP `filesystem` server is often configured via `npx -y @modelcontextprotocol/mcp-filesystem`, but this package **does not exist** on the public npm registry. This causes the server to fail silently or with `404 Not Found` errors.

**Symptoms:**
- `hermes mcp list` shows the server as `✓ enabled` but tools fail with `ENOENT` or `404`.
- Background processes exit with `npm error 404`.

**Solutions:**
1. **Use the terminal for file operations** instead of the MCP `filesystem` when possible.
2. **Use alternative MCP servers** like `office-word` for `.docx` files or `hyperbrowser` for web-based operations.
3. **Check for local installations** of the MCP server binary (e.g., in `~/.hermes/scripts/` or `/usr/local/bin/`).
4. **Verify the package name** — some MCP servers use `@modelcontextprotocol/mcp-server-filesystem` or similar variants.

See `references/mcp-filesystem-troubleshooting.md` for detailed error transcripts and workarounds.

### TRINITY Training Script Errors
When integrating TRINITY (or any MCP server that uses Python-based evolutionary algorithms like `cma`), the training script may fail with:
```python
TypeError: CMAEvolutionStrategy.__init__() got an unexpected keyword argument 'popsize'
```

**Root Cause:**
The `cma` library expects `population_size`, not `popsize`. This is a common mismatch in older tutorials or forks.

**Symptoms:**
- Training script crashes immediately with `TypeError`.
- Background processes exit with `exit code 1`.

**Solutions:**
1. **Patch the script** to use `population_size`:
   ```python
   es = CMA(
       self.head.weight.data.numpy().flatten(),
       sigma0=0.5,
       population_size=self.config["training"]["population_size"]
   )
   ```
2. **Verify `config.yaml`** contains the correct key:
   ```yaml
   training:
     population_size: 20  # Example value
   ```
3. **Use `patch` tool** for precise edits (avoids accented character mismatches).

See `references/trinity-training-errors.md` for error transcripts and reproduction steps.

### Archived GitHub repositories
System Python refuses pip install. pipx is the recommended workaround. The installed binary lands in `~/.local/bin/`, which Hermes already has in PATH.

### Archived GitHub repositories
Some MCP server repos are archived/read-only but still distributed via PyPI/npm. Check:
- Last commit date (recent enough?)
- Package version on PyPI/npm is separate from repo state
- Open issues for compatibility

### API keys in .env, not config.yaml
A common mistake is putting secrets in `config.yaml`. Only `.env` handles secrets correctly — `config.yaml` is checked into version control by some users and is read as plain text by the MCP client.

### Accented character mismatches in patch
When patching files that contain French text, the accented characters may differ between the displayed text and the actual file bytes. Always `read_file` first to get exact content.

### `hermes config set` creates duplicate keys
If a key already exists, `hermes config set` adds another entry rather than replacing. For MCP servers, this means you may see duplicate entries. To avoid, edit `config.yaml` directly for complex structures, or use `hermes config set` only for simple flat keys.

## MCP Server Types

### stdio (command-line) servers
The server binary/script runs as a subprocess, communicating via stdin/stdout. Configured with `command` + `args`.

```yaml
mcp_servers:
  example:
    command: some-binary
    args: ["--flag", "value"]
    enabled: true
```

### SSE (HTTP) servers
The server runs as an HTTP endpoint. Configured with a `url`.

```yaml
mcp_servers:
  example:
    url: https://mcp.example.com
    enabled: true
```

### Docker servers
The server runs in a Docker container. Configured with `command: docker`.

```yaml
mcp_servers:
  example:
    command: docker
    args: ["run", "-i", "ghcr.io/org/mcp-server"]
    enabled: true
```

## Quick-reference checklist

| Step | Command |
|------|---------|
| List current servers | `hermes mcp list` |
| Install Python MCP server | `pipx install <package>` |
| Add stdio server config | `hermes config set mcp_servers.<name>.command <binary>` |
| Add URL-based server | `hermes config set mcp_servers.<name>.url <url>` |
| Enable server | `hermes config set mcp_servers.<name>.enabled true` |
| Add env var | `echo "KEY=value" >> ~/.hermes/.env` |
| Set args | `hermes config set mcp_servers.<name>.args '["-y","package"]'` |

## References

See `references/` for specifics and deployment notes about individual MCP servers configured in this Hermes environment.
