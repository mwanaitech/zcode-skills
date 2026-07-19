---
name: omniroute-web-cookie-providers
description: Configure, debug, and troubleshoot OmniRoute web-cookie providers (arena.ai, qwen-web, etc.) that require browser session cookies instead of API keys
tags:
  - omniroute
  - web-cookie
  - arena
  - lmarena
  - cloudflare
  - tls-impersonation
  - recaptcha
---

# OmniRoute Web-Cookie Providers

## Overview

OmniRoute supports **"Web Cookie" providers** — services like arena.ai that don't have a public API but can be proxied using browser session cookies. These providers require special handling:

1. **Session cookies** from the target website (e.g., `arena-auth-prod-v1.0`, `arena-auth-prod-v1.1`)
2. **Optional reCAPTCHA tokens** for some providers
3. **TLS fingerprint impersonation** for Cloudflare-protected sites

## Common Providers

| Provider ID | Display Name | Type | Auth |
|-------------|-------------|------|------|
| `lmarena` | Arena (Free) | Web session | `arena-auth-prod-v1.*` cookies |
| `qwen-web` | Qwen Web | Web session | Qwen cookies |

## How to Add a Connection

### Via API (recommended for automation)

```bash
curl -s -b "$COOKIE_JAR" \
  -X POST 'http://localhost:20128/api/providers' \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "lmarena",
    "authType": "apikey",
    "name": "arena-connection",
    "apiKey": "COOKIE_HEADER_VALUE",
    "priority": 1,
    "providerSpecificData": {
      "recaptchaV3Token": "RECAPTCHA_TOKEN"
    }
  }'
```

The `apiKey` field takes the **full Cookie header** string (e.g. `arena-auth-prod-v1.0=xxx; arena-auth-prod-v1.1=yyy; __cf_bm=zzz`).

### Via Browser UI
1. Go to `http://localhost:20128/dashboard/providers/<provider_id>`
2. Click **"Add"**
3. Fill the **Cookie** field with the full `Cookie:` header value
4. Optionally set a **Validation Model** and **Priority**

## Troubleshooting

### 403: Arena API error (Cloudflare challenge)

Arena.ai sits behind **Cloudflare Enterprise** which:
- Pins `cf_clearance` to the client's TLS fingerprint (JA3/JA4)
- Blocks Node.js Undici fetch (not a browser handshake)
- Even valid cookies + reCAPTCHA tokens are rejected

**Solution:** OmniRoute must use **Chrome TLS impersonation** via `tls-client-node` (see OmniRoute PR #6280). This is implemented in the `open-sse/services/lmarenaTlsClient.ts` module.

If you still get 403 even on v3.8.47+:
1. Check that `tls-client-node` binary is installed in the OmniRoute environment
2. The `cf_clearance` cookie may be needed (obtained by completing a Cloudflare challenge in a real browser)
3. Some models may be soft-excluded (return 404/502)

### 401: User not found
The API key you're using in the `x-api-key` or `Authorization` header is not recognized. Create or update an OmniRoute API key:
```bash
# Create a new API key
curl -s -b "$COOKIE_JAR" -X POST 'http://localhost:20128/api/keys' \
  -H 'Content-Type: application/json' \
  -d '{"name":"my-key","scopes":["manage"]}'
```

### No active credentials for provider
The API key doesn't have the provider's connection allowed. Update the key:
```bash
curl -s -b "$COOKIE_JAR" -X PATCH 'http://localhost:20128/api/keys/<KEY_ID>' \
  -H 'Content-Type: application/json' \
  -d '{"allowedConnections":["<CONNECTION_ID>"]}'
```

### ReCAPTCHA token required
Arena.ai sends:
```
[403]: Arena API error: 403. If this persists, supply a browser reCAPTCHA v3 token
```

1. Get a fresh token from the browser console on `arena.ai`:
   ```javascript
   grecaptcha.enterprise.execute('SITE_KEY', {action: 'submit'}).then(console.log)
   ```
2. Include it in `providerSpecificData.recaptchaV3Token` when creating the connection
3. Tokens expire in ~2 minutes — you must create the connection immediately

### Test connection passes but model calls fail
The `/api/providers/<id>/test` endpoint only checks that the connection reaches the upstream. Individual model calls may fail due to:
- Model-specific restrictions (paid-only models)
- Cloudflare challenges specific to the model endpoint
- Expired reCAPTCHA tokens

## Connection Recreation Pitfall

When you DELETE and recreate a connection (e.g., to update `providerSpecificData`), the **old connection ID** is invalidated. Any API keys that had `allowedConnections` pointing to the old ID will silently fail with `"Key not found"` or `"No active credentials for provider"`.

**Fix:** After recreating, always:
1. Get the new connection ID from the POST response
2. PATCH the API key with the new ID:
   ```bash
   curl -s -b "$COOKIE_JAR" -X PATCH 'http://localhost:20128/api/keys/<KEY_ID>' \
     -H 'Content-Type: application/json' \
     -d '{"allowedConnections":["<NEW_CONNECTION_ID>"]}'
   ```

### tls-client-node: Building & Verification

If the arena provider still returns 403 even on OmniRoute v3.8.47+, the `tls-client-node` native binary may be missing or not compiled for the current architecture.

### Attempt rebuild
```bash
cd /opt/hermes && npm rebuild tls-client-node
```

**⚠️ Known pitfall:** `npm rebuild tls-client-node` reports "rebuilt dependencies successfully" even when the package is NOT actually installed (npm's default behavior). This is a false positive — the command returns success for any package name in node_modules, regardless of whether it has a native binary. The absence of the binary is what matters.

### Verify binary presence
```bash
# Check for the actual binary (not just the package)
find node_modules -name "*tls*client*" -not -path "*/node_modules/*/node_modules/*" 2>/dev/null
# Or grep for the executable
node_modules/.bin/tls-client* 2>/dev/null && echo "BINARY EXISTS" || echo "NO BINARY"
```

### Fallback
If `tls-client-node` is genuinely missing, the provider cannot bypass Cloudflare Enterprise's TLS fingerprint check. The provider will remain stuck on 403 regardless of cookie freshness, reCAPTCHA tokens, or API key configuration. This is a known architectural limitation of this OmniRoute deployment — the fix PR #6280 exists in the codebase but the binary dependency isn't satisfied in this environment.

## Working With Paper.design

Paper.design uses WorkOS-based session auth. Cookies can be saved as JSON for later use:
- Format: standard cookie JSON array (name, value, domain, path, secure, httpOnly, sameSite, expirationDate)
- Save location convention: `/opt/data/.<service>-cookies.json`
- The auth cookie is `D7pPzj4phQRAjBC01` (httpOnly, secure, lax)
- User info cookie: `paper-preauth-user-info` (JSON-encoded first/last name, avatar)

## Architecture Note

OmniRoute has two deployment modes:

### Hermes Dashboard Mode
The OmniRoute proxy is embedded in Hermes Agent's gateway process:
```
/opt/hermes/.venv/bin/hermes gateway run
```
- Dashboard on port `9119` (configurable via `HERMES_DASHBOARD_PORT`)
- API proxy on `20128`
- Static Next.js build in `/opt/hermes/hermes_cli/web_dist/`

### Standalone Docker Mode
OmniRoute can run as an independent Docker container using the Go binary (`cliproxyapi -standalone`). See `references/docker-deployment.md` for full setup.

## Model Loading Pitfalls

### Models not appearing in `/v1/models`

The server maintains an **in-memory model registry**. Even if `model_capabilities` table has rows, the API returns empty until the server itself populates its runtime registry.

Causes of empty model list:

1. **Missing `STORAGE_ENCRYPTION_KEY`** (most common in Docker) — Provider credentials in `provider_connections` are encrypted. Without this env var, the server cannot decrypt them → it never queries upstream APIs → no models loaded.
2. **Expired OAuth tokens** — Google/Antigravity tokens expire after ~1h. The server refreshes them automatically, but if the refresh fails (e.g., network issue), the provider becomes effectively inactive.
3. **Invalid API keys** — Cloudflare, Qwen, or OpenCode keys may have been rotated. The server detects this on next model sync cycle (every 3h).

### Manual `model_capabilities` inserts are ignored

Do not manually INSERT into `model_capabilities` — the server overrides it with its own in-memory state. Fix the root cause (encryption key, expired tokens) instead.

### Debug workflow

```
1. Check env vars: docker inspect <container> --format '{{json .Config.Env}}'
2. Check DB providers: sqlite3 storage.sqlite "SELECT provider, auth_type, name, is_active FROM provider_connections;"
3. Check models loaded: sqlite3 storage.sqlite "SELECT COUNT(*) FROM model_capabilities;"
4. Restart container if env var was missing
5. Wait ~30s for startup model refresh
6. Test: curl http://localhost:20128/v1/models | python3 -m json.tool
```

## References

- `references/arena-ai-cloudflare-tls.md` — Detailed analysis of arena.ai's Cloudflare TLS fingerprinting and the tls-client-node fix
- `references/docker-deployment.md` — Docker Compose deployment of OmniRoute standalone with management panel GUI
