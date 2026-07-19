---
name: electron-mcp-debugging
description: Launch headless Electron/AppImage apps, extract ASAR source, inspect MCP server architecture via Chrome DevTools Protocol, and verify endpoints.
trigger: Launch electron app headless OR inspect MCP server in desktop app OR extract ASAR source OR electron remote debugging OR appimage mcp analysis
---

# Electron MCP Debugging

Pattern for launching Electron desktop apps (AppImage), extracting their source, understanding their MCP server integration, and verifying connectivity.

## Workflow

### 1. Launch the App Headlessly

Electron-based desktop apps typically ship as an AppImage. Use `xvfb-run` to start them without a display:

```bash
xvfb-run -a /path/to/app.AppImage --remote-debugging-port=9222
```

- `-a` auto-selects a free display number
- `--remote-debugging-port=9222` enables Chrome DevTools Protocol on the renderer process
- Always use `background=true` in the terminal tool (the app runs as a daemon)

Verify the process started:

```bash
ps aux | grep paper-desktop | grep -v grep
```

### 2. Verify the MCP Server Port

Electron MCP servers bind to localhost. Find the listening port:

```bash
ss -tlnp | grep -E "29979|9222"
```

Test endpoint responsiveness:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:29979/mcp -H "Accept: application/json, text/event-stream" --max-time 5
```

Expected responses:
- `GET /mcp` -> 404 (no session yet — correct)
- `POST /mcp` -> MCP JSON-RPC handshake (long-polling)
- `OPTIONS /mcp` -> 403 (blocked by CORS middleware — correct)
- `GET /` -> 404 (only `/mcp` is routed — correct)

Common pitfalls:
- The MCP port is hardcoded (e.g., 29979 for Paper Desktop). Check the source if not found.
- Some apps bind to localhost only — do not test from a remote machine.
- Bearer token auth may be required in headless mode. Check source for middleware.

### 3. Inspect via Chrome DevTools Protocol

The `--remote-debugging-port` gives access to the renderer process:

```bash
# List available pages
curl http://127.0.0.1:9222/json
```

Use `browser_navigate` to the page URL for visual inspection, or the DevTools frontend URL for full debugging.

The DevTools frontend URL from `/json` response (chrome-devtools-frontend.appspot.com) may not work from proxied browser sessions due to WebSocket host mismatch. Alternative: navigate directly to the app URL in the browser tool.

### 4. Extract ASAR Source Code

AppImage is a self-extracting archive. Find the mount point:

```bash
ls /tmp/.mount_*/resources/app.asar 2>/dev/null
```

Extract the ASAR:

```bash
# Find the AppImage
find ~ -maxdepth 3 -name "*AppImage" 2>/dev/null

# The AppImage auto-extracts to /tmp/.mount_<name>/
# The ASAR is at: /tmp/.mount_<name>/resources/app.asar
```

To read ASAR contents without the `asar` tool, check if the app was extracted separately (e.g., for debugging purposes) at `/tmp/<app>-extracted/`.

Key source files to inspect for MCP understanding:

| File | What it contains |
|---|---|
| `src/main.ts` | App entry, MCP initialization, auth flow setup |
| `src/mcp/server.ts` | MCP server (Hono + StreamableHTTP), session management, auth middleware |
| `src/mcp/bridge.ts` | Renderer bridge via `webContents.executeJavaScript` |
| `src/mcp/index.ts` | Module init/cleanup |
| `src/auth/auth-through-mcp.ts` | Bearer token validation against server |

### 5. Understand the MCP Architecture

Key elements to identify:

1. **Transport** — StreamableHTTP (SDK `@hono/mcp`) or SSE
2. **Framework** — Hono, Express, or raw Node `http`
3. **Bridge pattern** — How the MCP server communicates with the renderer (usually `executeJavaScript`)
4. **Auth** — Bearer token (headless) or UI-based login
5. **Session management** — Multi-session via `Map<string, Session>`, cleanup on close
6. **Tool discovery** — Tools are defined dynamically by the renderer, not hardcoded in the main process

### 6. Architecture Reference

```
Agent (Claude Code, Cursor, etc.)
    |
    | MCP StreamableHTTP POST/GET/DELETE /mcp
    v
Electron Main Process
    +-- Hono HTTP Server (port 29979)
    |   +-- Auth middleware (Bearer or skip)
    |   +-- Anti-CORS / anti-rebinding middleware
    |   +-- Session manager (Map<sessionId, {Server, Transport}>)
    |
    +-- Bridge (webContents.executeJavaScript)
    |   +-- Calls window.resolveMCPHandlers
    |   +-- Methods: getMCPServerConfig, handleToolCall, registerAgent, etc.
    |
    v
Electron Renderer Process
    +-- Paper editor web app
        +-- window.resolveMCPHandlers (installed by client app)
```

### 7. Pitfalls

- **Process management**: Use `terminal(background=true)` with `notify_on_complete=true`. Do NOT use shell-level `&` backgrounding.
- **Single instance lock**: Many Electron apps use `app.requestSingleInstanceLock()`. You must kill any existing instance before relaunching.
- **AppImage extraction path**: The mount point `/tmp/.mount_<name>/` is auto-cleaned on exit. Re-extract if the app restarts.
- **DevTools WebSocket**: chrome-devtools-frontend.appspot.com connects via WebSocket to `127.0.0.1:9222` — this won't work from proxied browser sessions. Navigate directly to the app URL instead.
- **Bearer auth error names**: The SDK interprets `error` / `error_description` field names as OAuth challenges. Servers should use neutral names like `status` / `message` to avoid confusing MCP clients.
- **Accept header**: Some MCP clients omit `Accept: application/json, text/event-stream`, causing 406 errors. Servers may inject this header automatically.
