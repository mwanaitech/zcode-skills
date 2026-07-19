# Gmail MCP Server

Two approaches to connect Gmail via MCP in Hermes.

## Option 1 (Broken): @gongrzhe/server-gmail-autoauth-mcp (Node.js)

This npm package uses `googleapis` → `gaxios` → `node-fetch` 2.7.0 for HTTP.

**Symptom:** All Gmail API calls fail with:
```
Error: Invalid response body while trying to fetch
https://gmail.googleapis.com/gmail/v1/users/me/labels: Premature close
```

**Root cause:** `node-fetch` 2.x has an incompatibility with certain response patterns from Google's API servers when used through `gaxios`. The raw Node.js `https` module and Python `google-api-python-client` work fine, ruling out TLS or network issues.

**Credentials file layout (Node.js version):**
- OAuth client config: `~/.gmail-mcp/gcp-oauth.keys.json` (read from `GMAIL_OAUTH_PATH` env var, or default path)
- Token/credentials: `~/.gmail-mcp/credentials.json` (read from `GMAIL_CREDENTIALS_PATH` env var, or default path)
- The `--client-secret <path>` argument passed through `npx` is **ignored** by the code — it reads from `GMAIL_OAUTH_PATH` or the default file path.

## Option 2 (Working): Python Gmail MCP Server

A Python-based MCP server that uses `google-api-python-client` (which works reliably).

**Script:** `/home/gibson/.hermes/scripts/gmail_mcp_server.py`

**Supported tools:**
- `list_email_labels`
- `search_emails` (query, maxResults)
- `read_email` (messageId)
- `send_email` (to, subject, body, cc)
- `draft_email` (to, subject, body, cc, threadId)
- `modify_email` (messageId, addLabelIds, removeLabelIds)
- `delete_email` (messageId)

**Credentials:** Reads from `GMAIL_CREDENTIALS_PATH` env var → `~/.gmail-mcp/credentials.json` → `~/.hermes/google_token.json` (fallback).

**Config.yaml entry:**
```yaml
mcp_servers:
  gmail:
    command: /home/gibson/.hermes/scripts/gmail_mcp_server.py
    enabled: true
```

### Switching from Node.js to Python

1. Disable the Node.js server in config.yaml (remove or set `enabled: false`)
2. Add the Python server entry (see above)
3. Ensure `~/.gmail-mcp/credentials.json` or `~/.hermes/google_token.json` has a valid OAuth token (run `setup.py --check` to verify)
4. Restart the gateway: `hermes gateway restart`

### Dependencies

The script requires `google-api-python-client` and `google-auth-httplib2`. These are installed in:
- `/home/gibson/.hermes/hermes-agent/venv/` (Hermes main venv)
- `/tmp/google-venv/` (backup venv)

### Known issues & debugging

**"Tools discovered: 0" despite connected successfully**

If `hermes mcp test gmail` (or any custom JSON-RPC MCP server) shows `✓ Connected` but `Tools discovered: 0`, check the `capabilities` field in the server's `initialize` response.

**Root cause:** The Hermes MCP client checks `capabilities.tools is not None` before calling `tools/list`. An empty `"capabilities": {}` in the initialize response means the `tools` capability field defaults to `None`, and `tools/list` is never called — so 0 tools are registered even though the server supports them.

**Fix (raw JSON-RPC server):** Change:
```json
"capabilities": {}
```
to:
```json
"capabilities": {"tools": {}}
```

**SDK servers (FastMCP, MCP TypeScript SDK):** These handle capabilities automatically — no manual fix needed. This issue only affects custom raw JSON-RPC implementations.

**Session cache note:** After fixing the server file, the running session still has the old cache (0 tools). Either:
- Start a new session (`/new`)
- Kill stale server processes and restart the gateway (`hermes gateway restart`)
- Or wait for the session's MCP discovery thread to reconnect (may not detect the change automatically without a restart)
