---
name: cloudflare-ai
description: "Set up and use Cloudflare Workers AI and AI Gateway as custom OpenAI-compatible providers in Hermes. Covers model_aliases config, auth tokens, model discovery, and the config.yaml vs .env split."
version: 1.2.0
author: agent
tags: [cloudflare, workers-ai, ai-gateway, custom-provider, hermes-config, llm-serving]
---

# Cloudflare AI Provider Setup

## When to use

- The user wants to add Cloudflare Workers AI or AI Gateway as an LLM provider in Hermes
- The user provides a Cloudflare API token (`cfut_...`) or account ID
- You need to list available models from their Cloudflare account

## Quick Reference

### Required env vars (`~/.hermes/.env`)

```
CLOUDFLARE_API_TOKEN=cfut_...
CLOUDFLARE_ACCOUNT_ID=618fc58025826a8b715c13b4cd79b6f6
CLOUDFLARE_AI_GATEWAY_ID=default        # optional, only for gateway
```

### Model aliases (`~/.hermes/config.yaml`) — config shortcuts only

```yaml
model_aliases:
  cloudflare-workers:
    model: '@cf/meta/llama-3.1-8b-instruct-fp8'
    provider: custom
    base_url: https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1
  cloudflare-gateway:
    model: '@cf/meta/llama-3.1-8b-instruct-fp8'
    provider: custom
    base_url: https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_AI_GATEWAY_ID}/compat
```

**⚠️ Critical distinction:** `model_aliases` are config shortcuts for `hermes config set` but do NOT appear in the `hermes model` interactive picker. To make a provider visible in the model picker, use the `providers` section instead (see below).

### Providers section (`~/.hermes/config.yaml`) — appears in `hermes model` picker

Without a `models` list the provider appears in the picker but shows "(0 models)". You MUST list the models for them to be selectable.

```yaml
providers:
  cloudflare-workers:
    api: https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1
    key_env: CLOUDFLARE_API_TOKEN
    default_model: '@cf/meta/llama-3.1-8b-instruct-fp8'
    transport: chat_completions
    models:
      - '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
      - '@cf/meta/llama-3.1-8b-instruct-fp8'
      - '@cf/meta/llama-3.2-11b-vision-instruct'
      - '@cf/qwen/qwen2.5-coder-32b-instruct'
      - '@cf/qwen/qwen3-30b-a3b-fp8'
      - '@cf/qwen/qwq-32b'
      - '@cf/moonshotai/kimi-k2.7-code'
      - '@cf/moonshotai/kimi-k2.6'
      - '@cf/mistralai/mistral-small-3.1-24b-instruct'
      - '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
      - '@cf/google/gemma-4-26b-a4b-it'
      - '@cf/openai/gpt-oss-120b'
      - '@cf/openai/gpt-oss-20b'
      - '@cf/meta/llama-4-scout-17b-16e-instruct'
      - '@cf/zai-org/glm-5.2'
      - '@cf/zai-org/glm-4.7-flash'
      - '@cf/nvidia/nemotron-3-120b-a12b'
      # ... plus any others from the search endpoint
  cloudflare-gateway:
    api: https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_AI_GATEWAY_ID}/compat
    key_env: CLOUDFLARE_API_TOKEN
    default_model: '@cf/meta/llama-3.1-8b-instruct-fp8'
    transport: chat_completions
    models:
      - '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
      - '@cf/meta/llama-3.1-8b-instruct-fp8'
      # (same list as cloudflare-workers)
```

To add these programmatically via the CLI (Python is safest for complex nested dicts):
```bash
cd ~/.hermes && python3 << 'PYEOF'
import yaml
with open('config.yaml') as f:
    cfg = yaml.safe_load(f)
cfg['providers'] = {
    'cloudflare-workers': {
        'api': 'https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1',
        'key_env': 'CLOUDFLARE_API_TOKEN',
        'default_model': '@cf/meta/llama-3.1-8b-instruct-fp8',
        'transport': 'chat_completions',
        'models': ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fp8']
    },
    'cloudflare-gateway': {
        'api': 'https://gateway.ai.cloudflare.com/v1/${CLOUDFLARE_ACCOUNT_ID}/${CLOUDFLARE_AI_GATEWAY_ID}/compat',
        'key_env': 'CLOUDFLARE_API_TOKEN',
        'default_model': '@cf/meta/llama-3.1-8b-instruct-fp8',
        'transport': 'chat_completions',
        'models': ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fp8']
    }
}
with open('config.yaml', 'w') as f:
    yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
PYEOF
```

**⚠️ Note:** `yaml.dump` rewrites the whole file with its own formatting — verify the result didn't break existing sections (platforms, model_aliases, etc.).

### Switching to Cloudflare as active provider

```bash
# If you used the 'providers' section (appears in picker):
hermes model   # interactive picker → cloudflare-workers

# If you only have model_aliases (no picker entry):
hermes config set model.default '@cf/meta/llama-3.1-8b-instruct-fp8'
hermes config set model.provider custom:cloudflare-workers

# After switching, run /reset in-session to apply
```

## Steps

1. **Get env vars from user**: Cloudflare API token (`cfut_...`), Account ID. 
   - Account ID is at `https://dash.cloudflare.com/` → right sidebar → Account ID
   - API token created at `https://dash.cloudflare.com/` → My Profile → API Tokens

2. **Set env vars in `.env`**:
   ```
   sed -i 's/^CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=<token>/' ~/.hermes/.env
   ```
   The cfut_ token goes in `.env`, NOT just in config.yaml. The `hermes config set` command only updates config.yaml.

3. **Verify model aliases exist in config.yaml** — add them if missing (see Quick Reference above).

4. **Test the endpoint**:
   ```bash
   curl -s -X POST \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"@cf/meta/llama-3.1-8b-instruct-fp8","messages":[{"role":"user","content":"hi"}]}' \
     "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/v1/chat/completions"
   ```
   The response is direct OpenAI-format JSON (not wrapped in Cloudflare's `{success, result}` envelope).

5. **List available models**:
   ```bash
   curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/models/search?per_page=50"
   ```
   
   To filter only **text generation** models (useful for LLM providers), filter by task ID `c329a1f9-323d-4e91-b2aa-582dd4188d34`:
   ```bash
   curl -s ... | python3 -c "
   import sys,json
   d=json.load(sys.stdin)
   text_gen = [m['name'] for m in d.get('result',[])
               if 'c329a1f9' in str(m.get('task',{}).get('id',''))]
   for m in sorted(text_gen): print(m)
   "
   ```

6. **Add the model list to the `providers` section** (step 5 output) — otherwise the picker shows "(0 models)". See the Python YAML snippet in the Quick Reference above.

## AI Gateway (optional)

The AI Gateway sits in front of Workers AI and adds caching, rate limiting, analytics.

- Endpoint: `https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/{GATEWAY_ID}/compat/chat/completions`
- The `/compat` path gives OpenAI-compatible format
- Set `CLOUDFLARE_AI_GATEWAY_ID` and the gateway base_url in the model alias
- The same `CLOUDFLARE_API_TOKEN` may need AI Gateway-specific permissions (create a separate token from Dashboard → AI → AI Gateway → Settings → API Key if Workers AI token doesn't work)

## Available models (common text generation)

From `@cf/` namespace on Workers AI:

| Model | Notes |
|-------|-------|
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Strong general LLM |
| `@cf/meta/llama-3.1-8b-instruct-fp8` | Good balance speed/quality |
| `@cf/meta/llama-3.2-11b-vision-instruct` | Vision-capable |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Coding |
| `@cf/qwen/qwen3-30b-a3b-fp8` | Strong general, MoE |
| `@cf/moonshotai/kimi-k2.7-code` | Coding |
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | Reasoning |
| `@cf/google/gemma-4-26b-a4b-it` | |
| `@cf/zai-org/glm-5.2` | |
| `@cf/zai-org/glm-4.7-flash` | Fast |
| `@cf/black-forest-labs/flux-2-dev` | Image generation |
| `@cf/openai/whisper-large-v3-turbo` | STT |
| `@cf/myshell-ai/melotts` | TTS |
| `@cf/baai/bge-base-en-v1.5` | Embeddings |

For the full list, run the models search endpoint above.

## Pitfalls

- **`model_aliases` do NOT appear in the `hermes model` picker.** They are config shortcuts only. For picker visibility, use a `providers` section with `api`, `key_env`, `default_model`, `transport`. Both can coexist — `model_aliases` for quick CLI switching, `providers` for the menu.
- **A `providers` entry without a `models` sub-list shows "(0 models)" in the picker.** Always include a `models` list (see Quick Reference above). You can use a plain YAML list like `models: ['@cf/meta/llama-3.1-8b-instruct-fp8', ...]` — Hermes normalizes it internally.
- **Selecting a Cloudflare model via `hermes model` can set `model.default` to a Cloudflare model ID WITHOUT switching `model.provider`.** This produces a confusing error: `provider=custom base_url=opencode.ai/zen/v1 model=kimi-k2.6` -> `AuthError: Invalid API key`. Always verify BOTH `model.default` AND `model.provider` changed after using the picker. The symptom is a 401 where the URL in the error is NOT a Cloudflare URL.
- **`hermes config set` ONLY updates config.yaml, not `.env`.** The gateway and provider authentications read from `.env` env vars (`TELEGRAM_BOT_TOKEN`, `CLOUDFLARE_API_TOKEN`, etc.). Always update `.env` separately via `sed` or direct edit.
- **Cloudflare Workers AI responses are in raw OpenAI chat completions format.** There is no `success` wrapper — it returns `{id, object, choices, usage}` directly.
- **The `/ai/v1/models` list endpoint does NOT support GET.** Use `/ai/models/search` instead.
- **AI Gateway returns 401 if the API token lacks Gateway permissions.** Generate a dedicated token from the AI Gateway dashboard.
- **Model names use the `@cf/` prefix convention**, e.g. `@cf/meta/llama-3.1-8b-instruct-fp8`.
- **After changing provider config, run `/reset` in-session** to reload the model/toolset — changes don't apply mid-conversation. This includes Telegram sessions — send `/reset` or `/start` IN the Telegram chat, not here in CLI. The gateway session caches the provider at session start and does not hot-reload config changes.
- **Telegram gateway sessions authenticate users by numeric chat_id, NOT by @username alone.** Even with `TELEGRAM_ALLOWED_USERS=@username`, the gateway may block the user. The fix: add the numeric ID (visible in the gateway log as "Blocked unauthorized user <ID>") alongside the @username: `TELEGRAM_ALLOWED_USERS=@username,123456789`.

## Reference files

- `references/telegram-gateway-pitfalls.md` — Telegram Gateway setup gotchas (applies the same config.yaml/.env split pattern)

## Related skills

- `hermes-agent` — general Hermes configuration (bundled, read-only)
- `llama-cpp` — local GGUF inference
- `serving-llms-vllm` — vLLM serving
