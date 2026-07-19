---
name: aws-bedrock
description: "Configure AWS Bedrock as a native Hermes provider using the Converse API (boto3), including bearer token auth and IAM credentials."
version: 1.3.0
author: Hermes Agent
metadata:
  hermes:
    tags: [aws, bedrock, providers, boto3, configuration, auth]
    related_skills: [hermes-agent, custom-provider-setup]

---

# AWS Bedrock Provider for Hermes

How to configure AWS Bedrock as a provider in Hermes. Unlike custom providers that use OpenAI-compatible REST endpoints, Bedrock uses **boto3** and the **Amazon Bedrock Converse API** directly — Hermes includes a native adapter for this.

## Architecture

```
Hermes Agent → bedrock adapter (agent/bedrock_adapter.py) → boto3 → Bedrock Converse API
```

The Bedrock provider is a **built-in plugin** auto-registered by `plugins/model-providers/bedrock/`. It does NOT need a provider block in `config.yaml`.

- `api_mode: bedrock_converse` — uses boto3 `client.converse()` / `converse_stream()`
- `auth_type: aws_sdk` — uses the standard AWS credential chain
- `base_url: https://bedrock-runtime.us-east-1.amazonaws.com`

## Authentication Methods

Hermes supports two auth methods for Bedrock, checked in priority order:

### 1. Bearer Token (Bedrock API Keys) — Recommended

AWS now issues Bedrock-specific API keys in the format `ABSK<base64>`. These are supported by botocore via the `ScopedEnvTokenProvider`.

Set in `~/.hermes/.env`:

```env
AWS_BEARER_TOKEN_BEDROCK=ABSKQmVkcm9ja0FQSUtleS1ocWlqLWF0LTM1...
AWS_DEFAULT_REGION=us-east-1
```

**How it works**: botocore's `ScopedEnvTokenProvider` looks up `AWS_BEARER_TOKEN_{SIGNING_NAME}` where the signing name for Bedrock Runtime is `bedrock` → `AWS_BEARER_TOKEN_BEDROCK`. The loader chain is:

```
create_token_resolver() → ScopedEnvTokenProvider
  → get_token_from_environment(signing_name='bedrock')
  → _get_bearer_env_var_name('bedrock')
  → os.environ['AWS_BEARER_TOKEN_BEDROCK']
```

### 2. IAM Credentials (Access Key + Secret Key)

Standard AWS IAM user credentials:

```env
AWS_ACCESS_KEY_ID=AKI...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
```

### 3. Named Profile (SSO, Assume Role)

```env
AWS_PROFILE=my-production-profile
```

AWS SSO profiles must be configured in `~/.aws/config` first.

### 4. Implicit (Instance Role, ECS, Lambda)

Works automatically on EC2, ECS, Lambda, etc. — no env vars needed.

## Prerequisites

- **boto3 >= 1.34.59** (Converse API support). Hermes ships it as optional; install in the Hermes venv:
  ```bash
  cd ~/.hermes/hermes-agent && source venv/bin/activate && pip install boto3
  ```
- An AWS account with Bedrock access and the desired models enabled in the Bedrock console.

## Configuration Steps

### 1. Set Credentials (IMPORTANT — in `.env`, NOT config.yaml)

All AWS credential env vars **MUST go into `~/.hermes/.env`**, not `config.yaml`.
`hermes config set` writes to `config.yaml` by default, which will **leak secrets**
into your config file. Always append credentials directly to `.env`:

```bash
echo "AWS_BEARER_TOKEN_BEDROCK=<your-token>" >> ~/.hermes/.env
echo "AWS_DEFAULT_REGION=us-east-1" >> ~/.hermes/.env
echo "AWS_ACCESS_KEY_ID=AKI..." >> ~/.hermes/.env
echo "AWS_SECRET_ACCESS_KEY=<secret>" >> ~/.hermes/.env
```

If you already ran `hermes config set AWS_...` and they leaked into `config.yaml`,
clean them up with `sed`:
```bash
sed -i '/^AWS_/d' ~/.hermes/config.yaml
sed -i '/^AWS_BEARER_TOKEN_BEDROCK:/d' ~/.hermes/config.yaml
```

Then verify: `grep AWS_ ~/.hermes/config.yaml` should return nothing,
and `grep AWS_ ~/.hermes/.env` should show your credentials.

### 2. Set as Active Provider

```bash
hermes config set model.provider bedrock
hermes config set model.default global.anthropic.claude-sonnet-4-20250514-v1:0
```

### 3. Verify

Start an agent session:
```bash
hermes agent
```

Or test the Converse API directly:
```python
import os, boto3
os.environ['AWS_BEARER_TOKEN_BEDROCK'] = '<token>'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
client = boto3.client('bedrock-runtime', region_name='us-east-1')
resp = client.converse(
    modelId='us.anthropic.claude-3-5-haiku-20241022-v1:0',
    messages=[{'role': 'user', 'content': [{'text': 'Hello'}]}],
    inferenceConfig={'maxTokens': 50}
)
print(resp['output']['message']['content'][0]['text'])
```

## Available Models

The Bedrock adapter auto-discovers available foundation models per region. Common Anthropic Claude model IDs:

| Model ID | Notes |
|----------|-------|
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Fast, cheap |
| `anthropic.claude-sonnet-4-20250514-v1:0` | Latest Sonnet |
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | Cross-region inference profile |
| `anthropic.claude-opus-4-20250514-v1:0` | Opus tier |
| `anthropic.claude-fable-5` | Fable 5 — Messages API (bedrock-mantle endpoint) |
| `global.anthropic.claude-fable-5` | Fable 5 — Converse API (bedrock-runtime) |
| `us.anthropic.claude-fable-5` | Fable 5 — Cross-region inference profile |

Run `hermes models list` after setting Bedrock as the active provider to see all available models. See `references/model-catalog-2026.md` for the full Bedrock model catalog (18 providers, 100+ models) and `references/model-architecture-fallback.md` for a complete multi-provider architecture with Cloudflare fallback.

### Claude Fable 5 — Data Retention Requirement

Claude Fable 5 (Anthropic's latest, June 2026, 1M context, 128K output, vision, adaptive reasoning) **requires `provider_data_share` mode** on the Bedrock account before invocation. Anthropic mandates 30-day input/output retention plus human review for abuse detection.

The data retention setting is a **control-plane** operation — the bearer token alone cannot call it. Two endpoints exist:

| Endpoint | Auth | Requires |
|----------|------|----------|
| `bedrock-mantle.us-east-1.api.aws/v1/data_retention` | `x-api-key` header | IAM policy `bedrock-mantle:PutAccountDataRetention` |
| `bedrock.us-east-1.amazonaws.com/data-retention` | SigV4 | IAM credentials with `bedrock:PutAccountDataRetention` |

**Via AWS CLI** (recommended — handles SigV4 automatically):
```bash
export AWS_BEARER_TOKEN_BEDROCK=<token>
aws bedrock put-account-data-retention --mode provider_data_share
```

**Via curl** (bearer-compatible mantle endpoint):
```bash
curl -X PUT https://bedrock-mantle.us-east-1.api.aws/v1/data_retention \
  -H "x-api-key: $AWS_BEARER_TOKEN_BEDROCK" \
  -H "Content-Type: application/json" \
  -d '{"mode": "provider_data_share"}'
```

**Via curl** (SigV4 runtime endpoint — needs IAM creds):
```bash
curl -s -X PUT https://bedrock.us-east-1.amazonaws.com/data-retention \
  --aws-sigv4 "aws:amz:us-east-1:bedrock" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  -H "x-amz-security-token: $AWS_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"provider_data_share"}'
```

**Permission error**: `User: arn:aws:iam::358831513781:user/BedrockAPIKey-{id} is not authorized to perform: bedrock-mantle:PutAccountDataRetention on resource: * because no identity-based policy allows the bedrock-mantle:PutAccountDataRetention action` — means the Bedrock API key's IAM user lacks the data retention permission. Add an IAM policy granting `bedrock-mantle:PutAccountDataRetention` to the API key's user.

## Gateway Diagnostics

When the Telegram gateway (or any gateway session) reports provider failures, check `references/gateway-logs-diagnostics.md` for log reading patterns, common error signatures, and troubleshooting steps.

## Pitfalls

- **`AWS_BEARER_TOKEN_BEDROCK` goes to config.yaml**: `hermes config set` routes this var name to `config.yaml` instead of `.env`. Append it to `.env` manually via `echo >>`.
- **`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` also route to config.yaml**: Same routing issue as the bearer token. Append them directly to `.env`:
  ```bash
  echo "AWS_ACCESS_KEY_ID=AKI..." >> ~/.hermes/.env
  echo "AWS_SECRET_ACCESS_KEY=..." >> ~/.hermes/.env
  ```
- **`ALLOWED_DIRECTORIES` error**: If Hermes blocks file writes, the token must still end up in `.env` for the Hermes launcher to inject it into the runtime environment.
- **Bearer token detection**: `resolve_aws_auth_env_var()` in `bedrock_adapter.py` checks `AWS_BEARER_TOKEN_BEDROCK` first — the detection function and the boto3 auth chain must agree on the env var name.
- **No model listing from management API**: The bearer token only works for the Bedrock **Runtime** (Converse) API. Listing models via `list_foundation_models()` needs IAM credentials. Hermes handles this gracefully — it returns `None` and falls back to curated lists.
- **Data retention for Fable 5**: Before invoking Claude Fable 5, you must set `provider_data_share` mode via the Data Retention API. The bearer token alone lacks the `bedrock-mantle:PutAccountDataRetention` permission — add an IAM policy to the API key's IAM user, or use SigV4 credentials. See `references/data-retention-api.md` for details.
- **Gated models (Fable 5, Sonnet 5) — hidden runtime restriction**: Even after accepting the EULA and `agreementAvailability: AVAILABLE`, these models may still return `AccessDeniedException: anthropic.claude-fable-5 is not available for this account`. This is a known AWS/Anthropic gating bug invisible to the public API. `get_foundation_model_availability()` reports `AUTHORIZED`/`AVAILABLE`/`AVAILABLE`, but the runtime blocks invocation. Only workaround: contact AWS Support or wait for gating auto-lift. Use **Sonnet 4-6** or **Sonnet 4** as fallback for orchestration tasks.
- **Root IAM user needed for agreement creation**: The `bedrock:CreateFoundationModelAgreement` permission is often missing from programmatic Bedrock API key users (e.g., `arn:aws:iam::*:user/BedrockAPIKey-*`). The root account or a broader IAM user can call it successfully. If you see `not authorized to perform: bedrock:CreateFoundationModelAgreement`, switch to root credentials.
- **Orphaned delegation blocks in config**: After changing `delegation.model`, the old `provider`/`model` key at the bottom of config may become orphaned. Clean with: `sed -i '/^  provider: bedrock$/{N;/provider: bedrock\n  model: global.anthropic.claude-fable-5/d}' ~/.hermes/config.yaml`
- **Model access page RETIRED (July 2026)**: The old "Model access → Request access" console page is gone. Models auto-enable on first **successful** invocation, but the EULA must be accepted first via the **agreement API** or the **Model Catalog** console.
  - **Diagnose via API**: `get_foundation_model_availability(modelId='<model-id>')` — check `agreementAvailability`:
    - `AVAILABLE` → model should work for inference (unless gated — see above)
    - `NOT_AVAILABLE` → EULA not accepted → must create an agreement
  - **Fix via API — accept the EULA**:
    ```python
    client = boto3.client('bedrock', region_name='us-east-1')
    offers = client.list_foundation_model_agreement_offers(modelId='anthropic.claude-fable-5')
    token = offers['offers'][0]['offerToken']
    client.create_foundation_model_agreement(modelId='anthropic.claude-fable-5', offerToken=token)
    ```
  - **Fix via Console**: AWS Console → Bedrock → **Model Catalog** → find model → **Subscribe** / Accept
  - **IAM needed**: `bedrock:CreateFoundationModelAgreement` + `aws-marketplace:Subscribe`
  - **Bearer tokens can't call it**: Control-plane API needs SigV4 IAM credentials
  - **1-2 min delay**: after acceptance, subscription finalizes before model becomes invocable
- **Inference profile required**: Accounts without dedicated throughput must use `global.` or `us.` inference profile prefixes. Plain model IDs like `anthropic.claude-sonnet-4-20250514-v1:0` fail with: `Invocation of model ID ... with on-demand throughput isn't supported. Retry your request with the ID or ARN of an inference profile that contains this model.` Always use `global.anthropic.claude-sonnet-4-20250514-v1:0` or `us.anthropic.claude-sonnet-4-20250514-v1:0` format.
- **Bearer token = runtime only**: Bedrock API keys (bearer tokens) only authorize `bedrock-runtime` operations (converse, invoke, converse_stream). Control-plane operations (list models, data retention, guardrails) need IAM credentials or additional IAM policies.
- **Streaming permission**: The IAM principal needs `bedrock:InvokeModelWithResponseStream` for streaming. If denied, `call_converse_stream()` falls back to non-streaming `converse()`.
- **Region matters**: Bedrock models vary by region. Set `AWS_DEFAULT_REGION` to the region where your desired models are enabled.
- **Model discovery lists**: `hermes models list` only works when the provider is active — `hermes config set model.provider bedrock` first.
- **Daily quota exhaustion (on-demand throughput)**: Bedrock on-demand throughput has per-model daily token limits. Hitting the quota returns `ThrottlingException: Too many tokens per day` (HTTP 429). This triggers Hermes' fallback chain automatically — configure `fallback_providers` in `config.yaml` so the session doesn't break. The quota resets the next day (AWS account level, not per-region). See `references/model-architecture-fallback.md` for a complete multi-provider architecture with fallback.
- **`fallback_providers` and `delegation` format**: `hermes config set fallback_providers '[...]'` stores the value as a **JSON string literal** in YAML, which Hermes may not parse correctly. Always write `fallback_providers` as proper YAML list in `config.yaml`:
  ```yaml
  fallback_providers:
    - provider: cloudflare-workers
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
  ```
  You can also use `hermes fallback add` (interactive CLI) which handles the format correctly. If you already set it as JSON, edit it manually or use `sed` to replace with proper YAML.
- **Credentials leaked to config.yaml need sed cleanup**: If you accidentally used `hermes config set AWS_ACCESS_KEY_ID ...` (which writes to config.yaml), clean it up:
  ```bash
  sed -i '/^AWS_/d' ~/.hermes/config.yaml
  ```
  The `.env` copies survive. Verify with `grep AWS_ ~/.hermes/config.yaml`.
- **Pay-as-you-go pricing — no free tier**: Amazon Bedrock has **no free tier**. Even AWS accounts in their 12-month free period are charged per-token for Bedrock. Pricing is per-million-tokens, varies by model (Sonnet 4 ~$3/M in, Fable 5 ~$15/M in, Haiku 4.5 ~$0.80/M in). Use credits or budget alerts — don't assume free usage.
