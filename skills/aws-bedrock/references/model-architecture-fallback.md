# Bedrock + Cloudflare Multi-Provider Architecture

Pattern for using Bedrock (Claude Sonnet 4) as primary provider with Cloudflare Workers AI as free fallback, and Claude Fable 5 as delegation orchestrator.

## Architecture

```
Provider principal: Bedrock (Claude Sonnet 4)
  ↳ Fallback turn: Cloudflare Workers (Llama 3.3 70B)

Orchestrateur subagents: Bedrock (Claude Fable 5)
  ↳ Fallback: Cloudflare Workers

Auxiliaire vision: Bedrock (Sonnet 4)
  ↳ Fallback: Cloudflare Workers (Llama 4 Scout)

Auxiliaire compression: Cloudflare Workers (Kimi K2.6) — gratuit
```

## Config.yaml Implementation

```yaml
model:
  provider: bedrock
  default: global.anthropic.claude-sonnet-4-20250514-v1:0

fallback_providers:
  - provider: cloudflare-workers
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

delegation:
  provider: bedrock
  model: global.anthropic.claude-fable-5
```

### Interactive Setup

```bash
# Add primary fallback via interactive CLI
hermes fallback add

# Or use the subcommands:
hermes fallback add --provider cloudflare-workers --model '@cf/meta/llama-3.3-70b-instruct-fp8-fast'

# View current chain
hermes fallback list

# Remove
hermes fallback remove --index 0
```

## How Fallback Works

- **Per-turn scoped**: Each new user message starts with the primary model (Sonnet 4). If Sonnet 4 fails mid-turn, fallback activates for that turn only.
- **Triggers on**: HTTP 429 (rate limits), 500/502/503, 401/403 auth failures, 404, invalid responses.
- **Does NOT trigger on**: Transient rate limits with `Retry-After` header (treated as request constraints).
- **Fallback is NOT sticky**: Next turn always retries Bedrock first.

## Delegation Provider Override

Subagents spawned by `delegate_task` inherit the parent's fallback chain. The `delegation` config overrides the **primary** provider for subagents:

```yaml
delegation:
  provider: bedrock
  model: global.anthropic.claude-fable-5
```

This means all `delegate_task` calls use Fable 5 as the orchestrator. If Fable 5 hits Bedrock's daily quota, subagents fall back to Cloudflare Workers (inherited from parent's `fallback_providers`).

## Prerequisites for This Architecture

1. **Bedrock credentials** in `.env` (bearer token or IAM keys)
2. **Cloudflare Workers API token** in `.env` (`CLOUDFLARE_API_TOKEN`)
3. **Cloudflare Account ID** in `.env` (`CLOUDFLARE_ACCOUNT_ID`)
4. **Cloudflare provider** defined in `config.yaml` providers section (see `cloudflare-ai` skill)
5. **Fable 5**: Data retention enabled + EULA accepted (via `create_foundation_model_agreement` API or Model Catalog in console). See `references/model-access-troubleshooting.md`.

## When to Use Which

| Task | Model | Cost |
|------|-------|------|
| Daily chat, coding, vision | Sonnet 4 (Bedrock) | ~$3/M input |
| Complex multi-step delegation | Fable 5 (Bedrock) | ~$15/M input |
| Simple Q&A, fallback | Llama 3.3 70B (Cloudflare) | Free |
| Vision fallback | Llama 4 Scout (Cloudflare) | Free |
| Context compression | Kimi K2.6 (Cloudflare) | Free |
| Emergency backup | Kiro gateway (Claude Opus 4.5) | Via Kiro quota |
