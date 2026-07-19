---
name: electron-mcp-troubleshooting
description: >-
  Debug MCP servers embedded in Electron desktop apps. Covers asar extraction,
  Chrome DevTools Protocol (CDP) injection to bypass renderer state blocks,
  and MCP protocol negotiation (initialize → list → call) against StreamableHTTP.
trigger:
  - MCP server doesn't respond / times out on initialize
  - Electron app MCP connectivity
  - CDP injection into Electron renderer
  - asar extraction for Electron app analysis
  - debug paper desktop MCP
  - Paper Design MCP bridge blocked
---
# Debugging MCP Servers in Electron Apps

## Problem
An Electron desktop app exposes an MCP server (typically on localhost, e.g. port 29979), but `initialize` requests time out. The root cause is usually that the MCP bridge depends on `window.*` handlers in the **renderer** process, which aren't registered until the user has signed in / loaded the editor view.

### Architecture pattern (Paper Desktop example)
```
POST /mcp → server.ts calls bridge.call('getMCPServerConfig')
           → bridge.ts: win.webContents.executeJavaScript(
               "typeof window.resolveMCPHandlers !== 'undefined'")
           → 10s timeout → "Could not find Paper. Is it running?"
```

The MCP server code lives in the **main process** (Node.js/Hono), but tool definitions and handlers live in the **renderer** via `contextBridge` or `executeJavaScript`.

## Steps

### 1. Kill existing process (ask first)
```sh
kill -9 <PID>
# Wait for it to stop
ps aux | grep paper-desktop | grep -v grep
```

### 2. Restart with CDP debugging enabled + origin allowlist
```sh
xvfb-run -a /path/to/app.AppImage \
  --remote-debugging-port=9222 \
  --remote-allow-origins=*
```
The `--remote-allow-origins=*` flag is essential — without it the CDP WebSocket server rejects connections with 403 Forbidden.

### 3. Find the renderer target
```sh
curl -s http://127.0.0.1:9222/json
```
Returns JSON with `id`, `title`, `url`, `webSocketDebuggerUrl`.

### 4. Extract app.asar for source analysis (if needed)
```sh
npx asar list /path/to/resources/app.asar
npx asar extract /path/to/resources/app.asar /tmp/paper-src
```
Check `dist/main.cjs` and `dist/preload.cjs` (compiled) or `src/` (TypeScript source).

### 5. Inject MCP handlers via CDP
Use Python's `websocket-client`:

```python
from websocket import create_connection
import json, urllib.request

# Connect to CDP WebSocket
ws = create_connection(ws_url, timeout=10, suppress_origin=True)

def send_cmd(method, params=None):
    msg_id = send_cmd.counter; send_cmd.counter += 1
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    # Read until matching response id...

send_cmd.counter = 1

send_cmd("Runtime.enable")

# Inject the handlers that the bridge expects
result = send_cmd("Runtime.evaluate", {
    "expression": """
    (function() {
        if (typeof window.resolveMCPHandlers !== 'undefined')
            return 'already_exists';
        const handlers = {
            getMCPServerConfig: async function() {
                return {
                    tools: [ ... ],
                    instructions: '...'
                };
            },
            handleToolCall: async function(sessionId, name, args) {
                return { content: [{ type: 'text', text: '...' }] };
            },
            mcpLog: async function(msg, level) {},
            registerAgent: async function(id) { return { ok: true }; },
            removeAgent: async function(id) { return { ok: true }; }
        };
        window.resolveMCPHandlers = Promise.resolve(handlers);
        return 'injected_ok';
    })();
    """,
    "returnByValue": True,
    "awaitPromise": True
})
```

### 6. Establish MCP session
```sh
# 6a. Initialize
curl -s -X POST "http://127.0.0.1:29979/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hermes-agent","version":"1.0.0"}}}' \
  --max-time 30

# 6b. Send initialized notification (capture mcp-session-id from response headers)
curl -s -X POST "http://127.0.0.1:29979/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  --max-time 10

# 6c. List tools
curl -s -X POST "http://127.0.0.1:29979/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  --max-time 10

# 6d. Call a tool
curl -s -X POST "http://127.0.0.1:29979/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <session-id>" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hello_world","arguments":{"name":"World"}}}' \
  --max-time 10
```

## Pitfalls

- **CDP 403 Forbidden**: The WebSocket server rejects connections from origins not in `--remote-allow-origins`. The flag must be passed when starting the Electron app. Restarting is the only fix.
- **MCP initialize timeout**: The bridge is waiting for `executeJavaScript` to find `window.resolveMCPHandlers` in the renderer. If the renderer hasn't loaded the editor page (e.g. stuck on sign-in), the timeout is inevitable. CDP injection is the bypass.
- **`asar extract-file` path issues**: Use `npx asar extract <archive> <outdir>` (extracts everything) rather than `extract-file` which can fail on path format.
- **`suppress_origin=True`**: Required when creating the CDP WebSocket from Python's `websocket-client` even with `--remote-allow-origins=*`.
- **Session ID header**: The MCP server (StreamableHTTP) assigns a session ID on first POST. Send it as the `mcp-session-id` header on subsequent requests.

## Verification
After injection, verify the renderer state before attempting MCP initialize:
```python
verify = send_cmd("Runtime.evaluate", {
    "expression": """
    (async function() {
        const h = await window.resolveMCPHandlers;
        const cfg = await h.getMCPServerConfig();
        return 'OK: ' + cfg.tools.length + ' tools';
    })();
    """,
    "returnByValue": True,
    "awaitPromise": True
})
```
