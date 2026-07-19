---
name: hermes-model-routing
description: "Configure and maintain a multi-provider model architecture in Hermes Agent: principal/fallback/orchestrator routing, provider validation, compression for 413 errors, and validated model matrices for AWS Bedrock and Cloudflare Workers AI."
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [hermes, providers, routing, fallback, bedrock, cloudflare, compression, multi-provider]
    related_skills: [hermes-agent, custom-provider-setup, aws-bedrock]
---

# Hermes Multi-Provider Model Routing

Configure, validate, and maintain a production-grade multi-provider model architecture for Hermes Agent. Covers principal/fallback/orchestrator setup, provider validation workflows, compression tuning for gateway platforms, and known-good model matrices.

## When to Use

- Switching between provider tiers (e.g. AWS Bedrock paid → Cloudflare Workers AI free)
- Setting up automatic fallback when a provider hits quota or becomes unavailable
- Investigating "Request payload too large (413)" on gateway platforms (Telegram, Desktop)
- Validating which advertised cloud models actually work before adding them to config
- Diagnosing provider-specific errors (gating, timeouts, null responses)

## Architecture Pattern: Principal + Fallback + Orchestrator

The recommended three-tier model architecture:

| Tier | Purpose | Example |
|------|---------|---------|
| Principal | Default model for all user queries | `global.anthropic.claude-sonnet-4-20250514-v1:0` (Bedrock) |
| Fallback | Auto-switch when principal fails (rate limit, timeout, quota) | `@cf/qwen/qwq-32b` (Cloudflare Workers AI) |
| Orchestrator / Delegation | Subagent tasks requiring high reasoning quality | `global.anthropic.claude-sonnet-4-6` (Bedrock) |

Config in `~/.hermes/config.yaml`:

```yaml
model:
  default: global.anthropic.claude-sonnet-4-20250514-v1:0
  provider: bedrock

fallback_providers:
  - provider: cloudflare-workers
    model: '@cf/qwen/qwq-32b'

delegation:
  provider: bedrock
  model: global.anthropic.claude-sonnet-4-6
```

**Which platform falls back on what:**
- CLI (`hermes`) → direct Python calls → `fallback_providers` triggers on ThrottlingException / timeout
- Desktop (`hermes desktop`) → HTTP POST to `localhost:8642` → can hit **413 Payload Too Large** before fallback even fires
- Telegram Gateway (`hermes-gateway`) → HTTP POST to API server → same 413 risk as Desktop; also has longer-lived sessions that accumulate context

## Changing Provider Command Reference

```bash
# Set principal model
hermes config set model.default "global.anthropic.claude-sonnet-4-20250514-v1:0"
hermes config set model.provider bedrock

# Set fallback
hermes config set fallback_providers.0.model "@cf/qwen/qwq-32b"
hermes config set fallback_providers.0.provider cloudflare-workers

# Set orchestrator/delegation
hermes config set delegation.model "global.anthropic.claude-sonnet-4-6"
hermes config set delegation.provider bedrock

# Add a quick-use model alias
hermes config set model_aliases.mistral-fr.model "@cf/mistralai/mistral-small-3.1-24b-instruct"
hermes config set model_aliases.mistral-fr.provider cloudflare-workers
```

**Config drift pitfall:** `hermes config` shows a consolidated view. After setting `model.default` and `model.provider`, verify the YAML file directly (`head ~/.hermes/config.yaml`). In this session the tool reported `@cf/google/gemma-4-26b-a4b-it` for `model.default` even though the YAML had been rewritten to `@cf/qwen/qwq-32b`; the discrepancy was caused by a stale cached entry. Always use explicit `hermes config set` rather than assuming file edits are picked up instantly.

## Provider Validation Workflow

Before trusting a provider or model in production, run these checks:

```bash
# Bedrock: Check model availability (agreement/auth/runtime status)
python3 << 'PYEOF'
import boto3
import json
models_to_check = [
    "global.anthropic.claude-sonnet-4-20250514-v1:0",
    "global.anthropic.claude-sonnet-4-6",
    "global.anthropic.claude-fable-5",
    "global.anthropic.claude-sonnet-5",
]
client = boto3.client('bedrock', region_name='us-east-1')
for m in models_to_check:
    try:
        info = client.get_provisioned_model_throughput(provisionedModelId=m)
        print(f"OK: {m}")
    except Exception as e:
        err = e.response.get('Error', {}) if hasattr(e, 'response') else {}
        code = err.get('Code', type(e).__name__)
        msg = err.get('Message', str(e))
        if 'not available' in msg.lower():
            print(f"GATED: {m} — AWS/Anthropic account gating bug")
        elif 'Throttling' in code or 'quota' in msg.lower():
            print(f"QUOTA: {m} — quota exceeded, model agreement OK")
        else:
            print(f"{code}: {m} — {msg[:80]}")
PYEOF
```

```bash
# Cloudflare Workers AI: Check if model returns non-null content
# (Use the reference file in references/cloudflare-model-validation.md for the full verified list.)
```

**Key rule:** A model that shows `agreement: AVAILABLE` in Bedrock console can still be **gated** at runtime. Always do a live inference test before promoting it to principal or delegation.

## 413 Payload Too Large — Resolution

Symptom: Gateway platforms (Telegram, Desktop) return **"Request payload too large (413). Cannot compress further."**

Root cause: The HTTP layer between Gateway/Desktop and the internal API server has a payload limit lower than the compressed context size.

**Solution: Aggressive compression + shorter sessions**

```bash
hermes config set compression.threshold 0.3
hermes config set compression.target_ratio 0.1
hermes config set compression.protect_last_n 5
hermes config set compression.protect_first_n 1
hermes config set agent.max_turns 40
```

| Setting | Default | Aggressive | Effect |
|---------|---------|------------|--------|
| `compression.threshold` | 0.5 | **0.3** | Compress earlier (30% context length vs 50%) |
| `compression.target_ratio` | 0.2 | **0.1** | Keep only 10% of history, drop 90% |
| `compression.protect_last_n` | 20 | **5** | Only protect the 5 last messages |
| `compression.protect_first_n` | 3 | **1** | Only protect system prompt |
| `agent.max_turns` | 60 | **40** | Cap total turns before hard stop |

**Platform-specific notes:**
- Desktop: Restart `hermes desktop` after changing compression (new Electron process reads config on startup)
- Telegram Gateway: `systemctl --user restart hermes-gateway` — but if 413 is persistent, user must run `/new` in Telegram to clear accumulated session context
- CLI: Least affected — no HTTP intermediary, compression handled inline in Python

## Known Provider Quirks & Bugs

### AWS Bedrock Anthropic Model Gating (Fable 5, Sonnet 5)

Models `claude-fable-5` and `claude-sonnet-5` on Bedrock may show:
- Console: `agreement: AVAILABLE`, `authorization: AUTHORIZED`
- Runtime: `not available for this account`

This is an **AWS/Anthropic account-level gating bug**. No config fix available. Workarounds:
- Use `claude-sonnet-4-20250514-v1:0` (Sonnet 4) as principal
- Use `claude-sonnet-4-6` as delegation/orchestrator
- Contact AWS Support for account lift

### Mistral API Direct (api.mistral.ai) — Geographic Timeout

From some regions (notably Central/West Africa), `api.mistral.ai` times out with **0 bytes received** over 30s+. This is a network/routing issue, not an auth problem.

**Workaround:** Use Mistral models via Cloudflare Workers AI instead:
- `@cf/mistralai/mistral-small-3.1-24b-instruct` — validated OK, same model weights

Do not add a direct `mistral` alias pointing to `api.mistral.ai` if the geographic timeout reproduces.

### Cloudflare AI Gateway "UnknownOperationException"

When using `cloudflare-gateway` provider (`gateway.ai.cloudflare.com`), you may get:
```
HTTP 400: Invalid provider / UnknownOperationException
```

Cause: Workers AI is **not enabled** in the Cloudflare AI Gateway dashboard.
Fix: Dashboard → AI Gateway → [your gateway] → Providers → enable **Workers AI**.

### Cloudflare One / WARP → AWS 408 Request Timeout

If WARP (Cloudflare One client) is active, the public IP seen by AWS becomes a **shared Cloudflare IP** (e.g. `104.28.x.x`). This can cause AWS Service Quotas `list-service-quotas` to return **HTTP 408** (server-side pagination timeout), because AWS server-side timeouts are stricter for requests from known VPN/proxy ranges and pagination over 300+ records fails.

**Diagnosis:**
```bash
# IP source seen by AWS
curl -sS https://ipinfo.io/ip
# Returns 104.28.x.x → WARP is active

# Verify 408 is server-side, not network
curl -sS --max-time 10 https://servicequotas.us-east-1.amazonaws.com/ \
  -w "HTTP:%{http_code} Total:%{time_total}s\n"
# Returns HTTP 404 in ~2s → network OK, API server just dislikes the source IP/latency combo
```

**Fix — Exclude `*.amazonaws.com` from WARP split-tunnel:**
```bash
warp-cli tunnel host add "*.amazonaws.com"
# Reconnect WARP
warp-cli connect
```

After exclusion, AWS CLI works normally. See `references/warp-split-tunnel-aws.md` for full diagnosis steps.

**What does NOT fix this:** increasing AWS CLI read timeout (`cli_read_timeout = 180`). The 408 is emitted by AWS server-side due to the source IP / latency profile.

### Mistral API Direct (api.mistral.ai) — Geographic Timeout

From some regions (notably Central/West Africa), `api.mistral.ai` times out with **0 bytes received** over 30s+. This is a network/routing issue, not an auth problem.

**Workaround:** Use Mistral models via Cloudflare Workers AI instead:
- `@cf/mistralai/mistral-small-3.1-24b-instruct` — validated OK, same model weights

Do not add a direct `mistral` alias pointing to `api.mistral.ai` if the geographic timeout reproduces. A dedicated `mistral-fr` alias for French-language tasks via Cloudflare is the correct pattern:

```yaml
model_aliases:
  mistral-fr:
    model: '@cf/mistralai/mistral-small-3.1-24b-instruct'
    provider: cloudflare-workers
```

## Model Alias for Domain Tasks

Create aliases for specific task types so you can switch fast:

```yaml
model_aliases:
  mistral-fr:
    model: '@cf/mistralai/mistral-small-3.1-24b-instruct'
    provider: cloudflare-workers

  alias-code-expert:
    model: deepseek-v4-flash-free
    provider: opencode-zen

  alias-fallback-cloud:
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
    provider: cloudflare-workers
```

Usage: `/model mistral-fr` switches instantly.

## Reference Files

| File | Content |
|------|---------|
| `references/cloudflare-model-validation.md` | Validated working vs broken models on Cloudflare Workers AI with reproduction notes |
| `references/bedrock-gating-notes.md` | Known gated models, error signatures, and escalation path to AWS Support |
| `references/compression-settings-by-platform.md` | Recommended compression values per platform (CLI, Desktop, Telegram) |
| `references/aws-service-quotas-latency.md` | Diagnosing 408 timeouts from high-latency regions when listing AWS quotas |
