---
title: MCP Server Management
name: mcp-server-management
description: 'Configure, test, and troubleshoot MCP servers in Hermes. Covers pipx/npx install patterns, config.yaml setup, .env credential injection, and specific servers (office-word, hyperbrowser).'
tags:
  - mcp
  - server
  - configuration
  - setup
  - tool
  - integration
  - office-word
  - hyperbrowser
  - browser-automation
  - web-scraping
  - word-document
---

# MCP Server Management

General workflow for adding and administering MCP servers in Hermes.

## Overview

MCP servers extend Hermes with external capabilities. They are configured in `~/.hermes/config.yaml` under `mcp_servers:` and remain **always connected** (unlike skills which load on trigger). Credentials go in `~/.hermes/.env` to keep them out of config.

## General Installation & Configuration

### 1. Install the server binary

| Pattern | Command | Example |
|---------|---------|---------|
| Python package (no GUI dep) | `pipx install <pypi-package>` | `pipx install office-word-mcp-server` |
| Python script (no install needed) | `python3 /path/to/script.py` | Custom MCP server in ~/.hermes/scripts/ |
| Node.js package | `npx -y <npm-package>` (no install needed) | `npx -y hyperbrowser-mcp` |
| Docker | `docker run -i ...` | github-mcp-server (docker pattern) |
| pip (system venv) | `uv pip install --system ...` | Only if PEP 668 allows |

**Prefer pipx** for Python packages — creates isolated venvs, avoids PEP 668 blocks, and puts commands in `~/.local/bin/`.

### 2. Add the API key to .env (if needed)

```bash
echo "HYPERBROWSER_API_KEY=hb_xxxxxxxx" >> ~/.hermes/.env
```

Keys in `.env` are loaded automatically by Hermes as environment variables.

### 3. Configure in config.yaml

Use `hermes config set` (preferred) or edit `~/.hermes/config.yaml` directly.

**stdio mode (command-based):**
```bash
hermes config set mcp_servers.<name>.command <binary>
hermes config set mcp_servers.<name>.args '["-y","<package>"]'
hermes config set mcp_servers.<name>.enabled true
```

**HTTP/URL mode (remote server):**
```bash
hermes config set mcp_servers.<name>.url <https://...>
hermes config set mcp_servers.<name>.enabled true
```

### 4. Verify

```bash
hermes mcp list          # lists all configured servers with status
```

After config change, servers are active at next session start.

## Server-Specific References

See `references/` for detailed per-server setup:

- **office-word** → `references/office-word-mcp.md` — Pure Python .docx creation/manipulation, no office suite needed
- **hyperbrowser** → `references/hyperbrowser-mcp.md` — Cloud browser automation (scraping, structured extraction, crawling)
- **gmail** → `references/gmail-mcp.md` — Gmail integration via MCP. Covers the `node-fetch`/`gaxios` "Premature close" bug with the Node.js MCP server and the working Python-based alternative.

## Testing an MCP Server

### Quick smoke test (command-line)

```bash
# For command-based servers, test the binary directly:
word_mcp_server --help

# For npx-based servers:
npx -y hyperbrowser-mcp --help
```

### In-session test

Once the server is loaded (at session start), its tools appear in the tool list. Try using them directly — e.g. for office-word:

```
create_document(path="/tmp/test.docx")
add_paragraph(path="/tmp/test.docx", text="Hello world")
```

## Pitfalls

| Problem | Cause | Solution |
|---------|-------|----------|
| Server shows `✓ enabled` in `hermes mcp list` but tools not available | Server started after session init | Restart session or use `hermes gateway restart` |
| `word_mcp_server: command not found` | pipx install path not in PATH | Use absolute path: `~/.local/bin/word_mcp_server` |
| Hyperbrowser fails with auth error | API key missing from .env | Add `HYPERBROWSER_API_KEY=hb_...` to `~/.hermes/.env` |
| `npx: command not found` | Node.js not installed | `sudo apt install nodejs npm` |
| PEP 668 blocks pip install | Debian/Ubuntu restriction | Use pipx instead of pip |
| MCP server exits silently on session start | Missing env var or bad config | Test the binary manually first, check arguments |
| `hermes mcp test <name>` shows ✓ Connected but Tools discovered: 0 | MCP server initialize response has empty `capabilities: {}` instead of `capabilities: {"tools": {}}` | In the server's `initialize` response, include `"tools": {}` (or other specific capability objects) under `capabilities`. The MCP client's `_advertises_tools()` checks `capabilities.tools is not None` before calling `tools/list` — an empty capabilities dict means tools are never discovered even though the server supports them. |
| `node-fetch`/`gaxios` "Premature close" error with Google APIs | Node.js `googleapis` npm package uses `node-fetch` 2.x which has an HTTP response incompatibility with Google's servers | Switch to a Python-based MCP server using `google-api-python-client` — see `references/gmail-mcp.md` |
| Config changes not picked up | Hermes reads config at start | Manually edit `~/.hermes/config.yaml` then restart |

## Voir aussi

- `bilan-journalier` → `references/multi-agent-kanban-setup.md` — includes MCP pitfalls table
- SkillHub MCP install: `skillhub search "mcp"` for available MCP skills
