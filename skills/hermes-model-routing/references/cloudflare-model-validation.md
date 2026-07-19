# Cloudflare Workers AI Model Validation Matrix

Tested 2026-07-02. Endpoint: `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions`.
Models listed with `provider: cloudflare-workers` in Hermes config.

## ✅ Validated Working (non-null response, coherent output)

| Model | Quality | Notes |
|-------|---------|-------|
| `@cf/qwen/qwq-32b` | ⭐⭐⭐⭐⭐ | Best fallback from Bedrock. Reasoning-grade, fast, stable. |
| `@cf/qwen/qwen3-30b-a3b-fp8` | ⭐⭐⭐⭐ | Good reasoning, smaller than QwQ-32B |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | ⭐⭐⭐⭐ | Coding tasks, stable |
| `@cf/moonshotai/kimi-k2.6` | ⭐⭐⭐⭐ | General purpose, fast |
| `@cf/moonshotai/kimi-k2.7-code` | ⭐⭐⭐⭐ | Coding variant of Kimi |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | ⭐⭐⭐⭐ | Fast generation, good fallback |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | ⭐⭐⭐⭐ | Multilingual, stable |
| `@cf/meta/llama-3.2-11b-vision-instruct` | ⭐⭐⭐ | Vision capable |
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | ⭐⭐⭐⭐ | Linguistic tasks in French, validated OK |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | ⭐⭐⭐⭐ | Reasoning, distilled |

## ❌ Broken (null response, timeout, or garbled output)

| Model | Error | Symptom |
|-------|-------|---------|
| `@cf/nvidia/nemotron-3-120b-a12b` | Null content | `'NoneType' object has no attribute ...` |
| `@cf/openai/gpt-oss-120b` | Null content | Same null response pattern |
| `@cf/openai/gpt-oss-20b` | Null content | Same null response pattern |
| `@cf/zai-org/glm-4.7-flash` | Timeout | `HTTPSConnectionPool ... Read timed out` |
| `@cf/zai-org/glm-5.2` | Timeout | Same timeout pattern |

## Action

- Keep only models from the ✅ list in `providers.cloudflare-workers.models:`
- Remove broken models to avoid misleading availability errors during fallback routing
- Re-test periodically as Cloudflare updates model registry
