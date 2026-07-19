---
name: custom-provider-setup
description: "Configure custom OpenAI-compatible API providers in Hermes, including local auth proxies (gateway pattern), env var management, and troubleshooting."
version: 1.1.0
author: Hermes Agent
metadata:
  hermes:
    tags: [hermes, providers, custom, configuration, gateway, proxy, api]
    related_skills: [hermes-agent, hermes-mcp-configuration]

---

# Custom Provider Setup for Hermes

How to configure any OpenAI-compatible API as a provider in Hermes, including those behind auth proxies or unusual authentication schemes.

## When to Use This vs Standard Providers

Hermes has 20+ built-in providers (OpenRouter, Anthropic, OpenAI, Google, DeepSeek, xAI, etc.). Use a **custom provider** when:

**AWS Bedrock is NOT a custom provider.** It is a built-in native provider that uses boto3's Bedrock Converse API directly (not OpenAI-compatible). Configure it via the `aws-bedrock` skill instead. Do not attempt to add it under `providers:` in config.yaml — the plugin system auto-registers it.

- Your endpoint speaks the **OpenAI Chat Completions API format** (`POST /v1/chat/completions`)
- Using a local proxy/gateway (e.g. kiro-gateway, LiteLLM, Ollama) that exposes OpenAI-compatible routes
- A provider that requires non-standard auth (AWS SSO, OAuth with local refresh)
- A self-hosted model (vLLM, llama.cpp, etc.) that exposes an OpenAI-compatible API

## Architecture

```
Hermes Agent → custom provider → (optional: local proxy/gateway) → upstream API
```

The custom provider is defined in `config.yaml` under `providers:`. Hermes calls it directly using the OpenAI-compatible endpoint.

## Configuring a Custom Provider

### 1. Add the Provider Block

In `~/.hermes/config.yaml`:

```yaml
providers:
  my-provider:
    type: custom
    base_url: ${MY_BASE_URL}       # From .env
    api_key: ${MY_API_KEY}         # From .env
    key_env: MY_API_KEY            # Tells Hermes which env var holds the key
    transport: chat_completions     # OpenAI-compatible format
    models:
      - model-name-1
      - model-name-2
```

Key fields:
| Field | Required | Description |
|-------|----------|-------------|
| `type` | yes | Must be `custom` |
| `base_url` | yes | API endpoint URL. Use `${ENV_VAR}` for secrets |
| `api_key` | no¹ | API key for auth. Use `${ENV_VAR}` for secrets |
| `key_env` | recommended | Tells Hermes which env var the key lives in |
| `transport` | recommended | `chat_completions` for OpenAI-compatible API |
| `models` | yes | List of model IDs this provider serves |

> ¹ `api_key` is optional for localhost/127.0.0.1 endpoints that do not require authentication. Omit both `api_key` and `key_env` entirely for no-auth local providers. **Do not pass an empty string or a dummy placeholder** — Hermes sends an empty `Authorization:` header which some endpoints reject. If the field is omitted entirely, no auth header is sent.

### 1a. (Recommended) Probe the Endpoint First

Before writing config, discover available models and verify the endpoint is alive:

```bash
curl -s http://localhost:PORT/v1/models | jq '.data[].id'
```

This reveals the exact model IDs to put in the `models:` list. It also catches port conflicts, silent crashes, and auth issues before you change Hermes's provider config.

### 2. Set Environment Variables

In `~/.hermes/.env`:

```env
MY_BASE_URL=https://my-api.example.com/v1
MY_API_KEY=sk-xxxxxxxxxxxx
```

### 3. Add Model Aliases (Optional)

If you want to route specific models to this provider:

```yaml
model_aliases:
  alias-code-expert:
    model: qwen3-coder-next
    provider: my-provider
  alias-vision-expert:
    model: claude-opus-4.8
    provider: my-provider
```

### 4. Known Plugin Toolsets (Optional)

If this provider is also used by gateway/toolset routing:

```yaml
known_plugin_toolsets:
  my-provider:
    model: auto
    provider: my-provider
    base_url: ${MY_BASE_URL}
    api_key: ${MY_API_KEY}
    key_env: MY_API_KEY
    transport: chat_completions
    type: custom
    models:
      - model-name-1
```

## Gateway Pattern: Auth Proxy on localhost

When the upstream API requires auth that Hermes cannot handle directly (AWS SSO, Cognito, OAuth with local token refresh), run a **local proxy/gateway** that bridges the auth:

```
Hermes → localhost:PORT (proxy) → upstream API
```

### Generic Setup

1. Install the proxy (e.g. `pipx install some-proxy-gateway`)
2. Configure the proxy with the upstream credentials
3. Point Hermes's custom provider to `http://localhost:PORT/v1`
4. Use the proxy's local API key as the `api_key` value

## Local No-Auth Endpoint Pattern

When the endpoint runs on localhost and requires **no authentication at all** (no API key, no token):

```yaml
providers:
  local-gateway:
    base_url: http://localhost:PORT/v1
    transport: chat_completions
    models:
      - model-id-1
      - model-id-2
```

Notice `api_key` and `key_env` are **omitted entirely** — no dummy placeholder. Hermes sends no `Authorization:` header.

### Probing Before Configuring

Always probe the endpoint first to discover available models:

```bash
curl -s http://localhost:PORT/v1/models | jq '.data[].id'
```

Then pass the list to `hermes config set`:

```bash
hermes config set providers.local-gateway.models '["model-1","model-2"]'
```

### Pitfalls specific to no-auth endpoints

- **Empty api_key gotcha**: Setting `api_key: ""` or `api_key: "dummy"` causes Hermes to send `Authorization: Bearer ` with an empty token. Some local servers reject this. Simply omit the field.
- **No .env entry needed**: Since no auth variables are needed, there is nothing to add to `~/.hermes/.env`. The model list is inline in config.yaml.
- **Port probing**: Verify which port the gateway runs on with `lsof -i :PORT` or `ss -tlnp | grep PORT`. Common ports: 20128 (Omniroute), 8080, 8000, 10088.

## Reference Files

- `references/kiro-gateway.md` — Full Kiro Gateway setup and troubleshooting
- `references/cloudflare-workers-ai-model-matrix.md` — Validated vs broken models on Cloudflare Workers AI, tested 2026-07-02
- `references/omniroute-provider-matrix.md` — Omniroute provider prefix map and model list reference

## Common Custom Provider Patterns

### Cloudflare Workers AI

Cloudflare Workers AI is accessible through two paths:

1. **Direct Workers AI endpoint**: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1`
   - Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in `.env`
   - Model IDs prefixed with `@cf/` (e.g. `@cf/qwen/qwq-32b`)
   - **Pitfall**: Not all advertised models actually work. Some return null responses or timeout. Always verify before adding to `providers:` model list. See the model matrix reference file for the validated list.

2. **Cloudflare AI Gateway**: `https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/{GATEWAY_ID}/compat`
   - Requires AI Gateway provider activation in Cloudflare Dashboard
   - **Pitfall**: Workers AI must be explicitly enabled in the Gateway's "Providers" tab, or you'll get HTTP 400 "Invalid provider" / "UnknownOperationException"

**Best model for fallback from Bedrock**: `@cf/qwen/qwq-32b` — reasoning-grade quality, no quota limits, fast.

### Mistral API (Direct)

The direct Mistral API (`api.mistral.ai`) requires a valid API key. Keys that are **expired or from the wrong project** return HTTP 401. If your key fails:
- Check the key in Mistral Console → API Keys → verify it's active
- Alternative: use Mistral models via Cloudflare Workers AI (`@cf/mistralai/mistral-small-3.1-24b-instruct`) — same models, more reliable auth

### Omniroute AI Gateway

**Omniroute** is a self-hosted AI gateway (Next.js web app) that aggregates multiple LLM providers behind a single OpenAI-compatible endpoint. It runs as a local service with a password-protected web dashboard for managing provider connections.

```
Hermes Agent → localhost:PORT/v1 (Omniroute) → upstream providers (API key, OAuth, or web cookie)
```

**Key characteristics:**

| Feature | Detail |
|---------|--------|
| Dashboard | `http://localhost:PORT/` — login-required |
| Default password | `CHANGEME` (shown on login page unless `INITIAL_PASSWORD` env var was set) |
| API endpoint | `http://localhost:PORT/v1` — OpenAI-compatible |
| Provider auth types | API Key, OAuth, Web Cookie, No Auth, Free Tier, IDE |
| Model prefix convention | `owned_by/model-name` (e.g. `lma/claude-sonnet-5`, `aug/claude-opus-4.6`, `cf/@cf/qwen/qwq-32b`) |

**Connecting Hermes to Omniroute** — add as a custom provider in `config.yaml` with no auth (since it's localhost):

```yaml
providers:
  omniroute:
    base_url: http://localhost:20128/v1
    transport: chat_completions
    models:
      - auto/best-coding
      - auto/best-reasoning
      - auto/best-fast
      - auto/best-chat
```

Probe the endpoint to discover all available models:
```bash
curl -s http://localhost:PORT/v1/models | jq '.data[].id'
```

**Adding upstream providers via the dashboard:**

1. Navigate to `http://localhost:PORT/` and log in with the default password (`CHANGEME`)
2. Go to **Providers** in the sidebar
3. Providers are organized by auth type — find yours in the relevant section:
   - **Web Cookie Providers** — for browser-session-based LLMs (Claude Web, ChatGPT, Gemini Web, Arena, Qwen Web, DeepSeek Web, Grok Web, etc.)
   - **Free Tier Providers** — services with free API tiers
   - **API Key Providers** — standard API key auth
   - **OAuth Providers** — OAuth-authenticated services
4. Click on the provider name to open its configuration page
5. Click **Add Connection** and provide the required credential (API key, cookies, or OAuth token)
6. Once connected, the provider's models become available via Omniroute's `/v1/models` endpoint with the appropriate prefix

**Web Cookie provider pattern** — for providers that use browser session cookies instead of API keys:

*Via the UI:*
1. Open the provider's configuration page in Omniroute
2. Click **Add Connection** — a dialog opens asking for a **Name** and the **Cookie** header value
3. Extract cookies from the provider's website via DevTools → Application → Cookies (`document.cookie` is the full header string)
4. Paste the full cookie header (e.g. `arena-auth-prod-v1.0=...; arena-auth-prod-v1.1=...; __cf_bm=...`) into the Cookie field
5. Optionally set a Validation Model and Priority, then save
6. Click **Import from /models** to sync the provider's model list
7. Test a single model via the **play_circle** button, or use **Test all models**

*Via the API (more reliable for long cookie values):*
```bash
# Create the connection (API key field holds the cookie value)
curl -s -b /tmp/omniroute_cookies.txt \
  -X POST 'http://localhost:PORT/api/providers' \
  -H 'Content-Type: application/json' \
  -d '{"provider":"PROVIDER_ID","authType":"apikey","name":"my-connection","apiKey":"cookie-header-string","priority":1}'

# Then configure an API key to allow this connection
curl -s -b /tmp/omniroute_cookies.txt \
  -X PATCH 'http://localhost:PORT/api/keys/KEY_ID' \
  -H 'Content-Type: application/json' \
  -d '{"allowedConnections":["CONNECTION_ID"]}'
```

*Testing:*
- Connection status shows **"connected"** on success, **"expired"** + error message when the cookie is stale
- Use **Retest** to re-validate a connection
- Models appear in `/v1/models` with the provider's prefix (e.g. `lma/claude-sonnet-5`)
- To call a model through OmniRoute: `curl -H 'x-api-key: sk-...' -H 'Content-Type: application/json' http://localhost:PORT/v1/chat/completions -d '{"model":"prefix/model-name","messages":[...]}'`

**Available model prefixes** (determined by `owned_by` in Omniroute's model list):

| Prefix | Provider group | Example model |
|--------|---------------|--------------|
| `auto/` | Combo/routing models | `auto/best-coding`, `auto/best-fast` |
| `aug/` | Auggie | `aug/claude-sonnet-4.6` |
| `oc/` | OpenCode | `oc/deepseek-v4-flash-free` |
| `cf/` | Cloudflare Workers AI | `cf/@cf/qwen/qwq-32b` |
| `tllm/` | The Old LLM | `tllm/GPT_5_4` |
| `ddgw/` | DuckDuckGo Web | `ddgw/gpt-4o-mini` |
| `lma/` | Arena / LM Arena | `lma/claude-sonnet-5` |
| `qwen-web/` | Qwen Web | `qwen-web/qwen3.7-max` |
| `veo-free/` | VEO AI Free | `veo-free/veo` |
| `mcode/` | MiMo Code | `mcode/mimo-auto` |
| `pepper/` | Chipotle AI | `pepper/pepper-1` |

**Pitfalls:**
- **Login lockout**: Too many failed login attempts returns `"Too many failed attempts. Try again later."` — wait before retrying
- **Empty api_key**: When connecting Hermes to Omniroute (localhost), omit `api_key` and `key_env` entirely. Setting them to empty strings sends `Authorization: Bearer ` which some local endpoints reject
- **Provider not in list**: Omniroute's dashboard shows ~250+ providers. If yours isn't visible, use the search box in the sidebar. Most web-based LLMs are under **Web Cookie Providers**
- **Model prefix required**: When using Omniroute models from Hermes, you must use the full prefixed model ID (e.g. `lma/claude-sonnet-5`, not `claude-sonnet-5`)
- **Cookie expiry**: Web cookie provider sessions expire (typically hours to days). When expired, the connection shows **"expired"** with a `[401]: User not found` error. Click **Retest** to confirm expiry, then **edit** the connection to paste fresh cookies from the source website's current browser session
- **API key allowedConnections**: OmniRoute API keys must be explicitly allowed to use specific provider connections. After creating a connection, update the API key via `PATCH /api/keys/KEY_ID` with `{"allowedConnections":["CONNECTION_ID"]}` — otherwise calls return `"No active credentials for provider: PROVIDER_NAME"` even when the connection is valid
- **x-api-key vs Authorization**: OmniRoute's `/v1/chat/completions` endpoint accepts both `Authorization: Bearer sk-...` and `x-api-key: sk-...` headers. The dashboard session cookie **cannot** authenticate API calls — you must create an API key via the dashboard or API

## Pitfalls

- **Model name format**: Some upstream gateways expect dash-format names (`claude-opus-4-5`) while Hermes may use dot-format (`claude-opus-4.5`). Always check the gateway/provider's model mapping before configuring the model list.
- **Port conflicts**: If the proxy fails to start because the port is already in use, kill the old process first: `kill $(lsof -ti :PORT)`
- **Env file location**: Some proxies validate that a `.env` file exists in the working directory they are started from. Run them from the directory containing their config.
- **Auth header format**: The most common custom provider expects `Authorization: Bearer {key}`, but some proxies accept `x-api-key: {key}` or `X-API-Key: {key}`. Check the proxy's source code.
- **Monthly quotas**: Some upstream providers (especially AWS-backed services) have monthly request limits that return HTTP 402. Check upstream billing before investing time in configuration.
- **Endpoint path**: Some proxies use port 10088, others use 8000 or 8080. Verify with `ss -tlnp`.
- **Direct YAML editing blocked**: Hermes blocks writing to `config.yaml` from agent tools. Use `hermes config set <key> <value>` instead. For list values, pass a JSON array string:
  ```bash
  hermes config set providers.my-provider.models '["model-1","model-2"]'
  ```
- **Config drift / stale cache**: After setting `model.default` and `model.provider` via `hermes config set`, the `hermes config` command may show a stale cached value (e.g. `@cf/google/gemma-4-26b-a4b-it` instead of `@cf/qwen/qwq-32b`). Always verify with `head ~/.hermes/config.yaml` rather than trusting the `hermes config` summary, and always use explicit `hermes config set` rather than editing the file directly.
- **ThrottlingException + fallback_providers**: Hermes `fallback_providers` may **not** catch `ThrottlingException` from AWS Bedrock (the native boto3 path throws this exception differently from HTTP-level errors). If Bedrock fails with "Too many tokens per day", the fallback may not auto-trigger. Manual fallback is required — switch principal model to a Cloudflare model via `hermes config set model.default "@cf/qwen/qwq-32b"` and `hermes config set model.provider cloudflare-workers`.
- **AWS Bedrock gating bug**: Anthropic Fable 5 and Sonnet 5 models on AWS Bedrock may show "agreement: AVAILABLE, auth: AUTHORIZED, region: AVAILABLE" but still return "not available for this account" at runtime. This is a known AWS/Anthropic gating issue — contacting AWS support is the only fix. Do not add them to delegation until confirmed working.