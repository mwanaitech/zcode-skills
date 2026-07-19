---
name: custom-provider-setup
description: "Configure custom OpenAI-compatible API providers in Hermes, including local auth proxies (gateway pattern), env var management, and troubleshooting."
version: 1.0.0
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
| `api_key` | yes | API key for auth. Use `${ENV_VAR}` for secrets |
| `key_env` | recommended | Tells Hermes which env var the key lives in |
| `transport` | recommended | `chat_completions` for OpenAI-compatible API |
| `models` | yes | List of model IDs this provider serves |

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

### Pitfalls

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

## Reference Files

- `references/kiro-gateway.md` — Full Kiro Gateway setup and troubleshooting
- `references/cloudflare-workers-ai-model-matrix.md` — Validated vs broken models on Cloudflare Workers AI, tested 2026-07-02

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