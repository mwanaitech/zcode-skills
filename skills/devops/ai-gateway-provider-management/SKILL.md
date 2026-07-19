---
name: ai-gateway-provider-management
description: Configure, test, and troubleshoot AI provider connections in gateway proxies (OmniRoute). Cookie-based web providers, API key management, connection lifecycle, and common pitfalls.
category: devops
---

# AI Gateway Provider Management

Configure AI provider connections in gateway proxies. Covers OmniRoute provider setup, cookie-based auth for web providers, connection lifecycle, and troubleshooting.

## OmniRoute API

Base URL: `http://localhost:20128` (or configured port).

### Authentication

The management API uses a session cookie (`auth_token`). Get it by logging in:
```bash
# Browser: navigate to /login, submit password
# Then curl with cookie jar:
curl -c /tmp/cookies.txt -X POST 'http://localhost:20128/api/login' \
  -H 'Content-Type: application/json' \
  -d '{"password":"CHANGEME"}'
```

The `/v1/chat/completions` public API requires an **API key** via `x-api-key` header or `Authorization: Bearer`.

### Provider Connections

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/providers` | List all connections with masked apiKeys |
| `POST` | `/api/providers` | Create a new connection |
| `PATCH` | `/api/providers/{id}` | Update connection fields |
| `DELETE` | `/api/providers/{id}` | Remove a connection |
| `POST` | `/api/providers/{id}/test` | Test connection validity |

Create a connection:
```bash
curl -b /tmp/cookies.txt -X POST 'http://localhost:20128/api/providers' \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "lmarena",
    "authType": "apikey",
    "name": "arena-connection",
    "apiKey": "full-cookie-header-string",
    "priority": 1
  }'
```

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/keys` | List all API keys (masked) |
| `POST` | `/api/keys` | Create a new API key |
| `PATCH` | `/api/keys/{id}` | Update key settings |

Update `allowedConnections` so a key can use a specific provider:
```bash
curl -b /tmp/cookies.txt -X PATCH 'http://localhost:20128/api/keys/{keyId}' \
  -H 'Content-Type: application/json' \
  -d '{"allowedConnections": ["connectionId"]}'
```

### Calling Models via v1 API

```bash
curl -s -m 120 'http://localhost:20128/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: sk-...' \
  -d '{
    "model": "lma/claude-sonnet-5",
    "messages": [{"role":"user","content":"hi"}],
    "max_tokens": 10,
    "stream": false
  }'
```

## Cookie-Based Web Providers

For providers like arena.ai that authenticate via browser cookies (not API keys):

1. **Export cookies**: From the target website's DevTools → Application → Storage → Cookies. Export as JSON array.
2. **Build cookie header**: Concatenate the critical auth cookies into a single `;`-separated string: `name1=value1; name2=value2`
3. **Store as apiKey**: The cookie header goes into the connection's `apiKey` field. OmniRoute treats it as the credential.
4. **Allow API key access**: After creating the connection, PATCH the API key to add the connection ID to `allowedConnections`.

## Pitfalls

### Cookie Expiration
- Web session cookies expire frequently. If a connection shows **"expired"** / **"[401]: User not found"**, the cookies need refreshing.
- Refresh by re-exporting from the browser and PATCHing the connection's `apiKey` field.

### reCAPTCHA Block (arena.ai specific)
- arena.ai requires a **reCAPTCHA v3 token** in addition to the session cookie.
- Error: `[403]: Arena API error: 403. If this persists, supply a browser reCAPTCHA v3 token via credentials.providerSpecificData.recaptchaV3Token`
- To fix: retrieve the token from an active browser session on arena.ai via:
  ```javascript
  grecaptcha.execute('6Lc...', {action: 'submit'}).then(console.log)
  ```
  Then add it to the connection's `providerSpecificData` field:
  ```json
  {"providerSpecificData": {"recaptchaV3Token": "..."}}
  ```

### providerSpecificData Limitations

Some provider metadata fields (like `providerSpecificData.recaptchaV3Token`) can ONLY be set at **connection creation time** via POST. PATCHing these fields after creation silently ignores them.

To update them, you must:
1. DELETE the connection
2. RECREATE it with the fields included in the POST body
3. Re-configure any API keys that referenced the old connection ID

### API Key Masking
- OmniRoute returns `allowKeyReveal: false` — keys are ALWAYS masked in API responses (e.g. `sk-1cc...db97`).
- The full key is only shown once in the creation response (also masked in this version).
- **Workaround**: Create a fresh key when you need one; the response is the only chance to see it.

### Redirect Blocking During Tests
- OmniRoute's test endpoint may reject HTTP redirects (307) from upstream providers. Error: `"Redirect blocked for GET https://... (307)"`.
- This does NOT mean the cookie is invalid — it means the test protocol doesn't follow redirects.
- Actual model calls via `/v1/chat/completions` may still work if the test passes or even if it fails on redirect alone.

### Model Not Found / No Active Credentials
- If API calls return `"No active credentials for provider: {name}"`:
  1. Verify the connection's `apiKey` has the full cookie header
  2. Check the API key has `allowedConnections` including this connection's ID
  3. Verify the provider name matches exactly what OmniRoute expects

## Verification Workflow

1. **Create connection** → `POST /api/providers`
2. **Test connection** → `POST /api/providers/{id}/test` (expect `valid: true`)
3. **Update API key** → `PATCH /api/keys/{keyId}` with `allowedConnections`
4. **Call a model** → `POST /v1/chat/completions` with `model: "{prefix}/{model-name}"`
5. **Check UI** → Browser dashboard shows "connected" status, model count

## Related Skills

For **web-cookie providers** (arena.ai, qwen-web, etc.) with Cloudflare TLS issues, reCAPTCHA tokens, and connection recreation pitfalls, see:
- `omniroute-web-cookie-providers` — arena.ai-specific TLS fingerprint analysis, PR #6280 details, tls-client-node troubleshooting
