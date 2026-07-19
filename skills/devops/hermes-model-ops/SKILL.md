---
name: hermes-model-ops
description: "Operations and governance for Hermes multi-model architecture: add/remove/test providers, validate model connectivity, configure fallbacks, prevent payload-too-large errors, and maintain clean aliases."
version: 1.0.0
author: Gibson Malcolm
platforms: [linux]
metadata:
  hermes:
    tags: [hermes, ai-providers, model-routing, bedrock, cloudflare, fallback, ops]
---

# Hermes Model Operations

Validated workflows for configuring, testing, and maintaining the Hermes multi-provider model stack (Bedrock + Cloudflare Workers AI + custom).

## 1. Pre-flight: always test before promoting a model

Any model moved to `model.default` **must** pass both checks:

```python
import requests, os

key = os.getenv("CLOUDFLARE_API_TOKEN")
account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1/chat/completions"

resp = requests.post(url, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={"model": "MODEL_ID", "messages": [{"role": "user", "content": "Foo"}], "max_tokens": 10},
    timeout=15)
assert resp.status_code == 200
content = resp.json()["choices"][0]["message"]["content"].strip()
assert content  # reject null/empty responses (Nemotron, GPT-OSS, GLM seen to return nothing)
```

**Known dead models on Cloudflare (from Gabon):**
- `@cf/nvidia/nemotron-3-120b-a12b` — returns null
- `@cf/openai/gpt-oss-120b`, `@cf/openai/gpt-oss-20b` — returns null
- `@cf/zai-org/glm-4.7-flash`, `@cf/zai-org/glm-5.2` — timeout

For **Bedrock**, test with boto3 and check not only HTTP 200 but also the exact exception type:
- `ThrottlingException` / `Too many tokens` → quota exhausted (model OK, just wait)
- `AccessDeniedException` + "not available" → gating not yet propagated (wait for Marketplace agreement)
- Any other error → model ID may be wrong

## 2. Changing the active model

1. **Test** the target model (see §1).
2. **Set** via `hermes config set`:
   ```bash
   hermes config set model.default "MODEL_ID"
   hermes config set model.provider "PROVIDER_NAME"
   # If custom/provider needs explicit base_url:
   hermes config set model.base_url "URL"
   ```
3. **Restart the gateway** so Telegram/Desktop pick it up:
   ```bash
   systemctl --user restart hermes-gateway
   ```
4. **Verify** with `hermes config | head -6` and a live test message.

## 3. Fallback configuration

`fallback_providers` in `config.yaml` activates when the primary hits rate-limit, throttling, or timeout. Keep the fallback on a **different provider** than the primary to avoid cascading the same failure.

```yaml
fallback_providers:
  - provider: cloudflare-workers
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
```

**Rule**: fallback model must be tested OK and **not** share the same quota/network path as the primary.

## 4. Preventing 413 Payload Too Large

Telegram and Desktop sessions grow over time. If the compressed context exceeds the API/gateway payload limit, you get `413`.

**Aggressive compression config** (tested working):
```yaml
compression:
  enabled: true
  threshold: 0.3      # start compressing at 30% of context budget
  target_ratio: 0.1   # keep only ~10% of old history
  protect_last_n: 5   # recent messages preserved
  protect_first_n: 1
delegation:
  max_turns: 40       # hard cap turns per session
```

**User workaround**: type `/new` in Telegram or Desktop to start a fresh session immediately.

## 5. Clean-up: removing dead aliases and models

When a provider/API or alias becomes unusable (401, timeout, null responses):

1. Remove from `model_aliases:` block in `config.yaml`.
2. Remove dead model IDs from `providers.cloudflare-workers.models:` list.
3. Remove duplicate keys from `~/.hermes/.env` (sort -u to dedupe).
4. Restart gateway: `systemctl --user restart hermes-gateway`

## 6. Marketplace agreement propagation delay

AWS Marketplace agreement acceptance is **not instant**. After receiving the "agreement created" email:
- Wait **2–8 hours** for the entitlement to propagate to Bedrock inference.
- Until then, tests return `AccessDeniedException` ("not available for this account").
- Do **not** switch `delegation.model` to the new model before validation.

Automation: create a cron script (`test_fable5.sh`) that probes the model and sends a Telegram alert when it becomes available. See `references/` for example.

## 7. Aliases for domain use

Create dedicated aliases for specialized agents instead of polluting the default model:

```yaml
model_aliases:
  mistral-fr:
    model: "@cf/mistralai/mistral-small-3.1-24b-instruct"
    provider: cloudflare-workers
    base_url: "..."
```

Then invoke via `/model mistral-fr` or `delegate_task(...)` with that alias.

## 8. Web-cookie (session) providers

Providers like **arena.ai** (lmarena) use browser session cookies instead of API keys. They are proxied through free web-chat platforms. These are fragile and often blocked by Cloudflare Enterprise.

**Key differences from API-key providers:**
- Credentials expire every few hours (browser session cookies)
- May require reCAPTCHA v3 tokens (expire in ~2 minutes)
- Can be blocked by Cloudflare TLS fingerprinting (JA3/JA4)
- Require `tls-client-node` for Chrome TLS impersonation to work reliably

See `references/omniroute-web-cookie-providers.md` for full setup guide, API reference, and troubleshooting.

## References
- `references/model-validation-checklist.md` — copy-paste checklist for adding a new model
- `references/omniroute-web-cookie-providers.md` — arena.ai web-cookie provider setup + troubleshooting (reCAPTCHA, TLS impersonation, Cloudflare 403)
- `scripts/test_fable5.sh` — example cron probe for AWS Marketplace model availability
