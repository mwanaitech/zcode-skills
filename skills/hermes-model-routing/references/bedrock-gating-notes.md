# Bedrock Anthropic Model Gating — Known Issues

Observed 2026-07-02 on AWS account in `us-east-1` with Bedrock credits active.

## Affected Models

| Model | Console Status | Runtime Status | Error |
|-------|---------------|----------------|-------|
| `global.anthropic.claude-fable-5` | `agreement: AVAILABLE`, `authorization: AUTHORIZED` | **NOT_AVAILABLE** | "not available for this account" |
| `global.anthropic.claude-sonnet-5` | `agreement: AVAILABLE`, `authorization: AUTHORIZED` | **NOT_AVAILABLE** | "not available for this account" |
| `global.anthropic.claude-sonnet-4-20250514-v1:0` | AVAILABLE | OK (when quota not exceeded) | Can hit `ThrottlingException` "Too many tokens per day" |
| `global.anthropic.claude-sonnet-4-6` | AVAILABLE | OK (when quota not exceeded) | Same throttling risk |

## Error Signatures

### Gating (Fable 5 / Sonnet 5)
```
boto3 error: 'not available for this account'
No retry helps. Model is gated at the account level by AWS or Anthropic.
```

### Quota Exhaustion (Sonnet 4 / Sonnet 4-6)
```
boto3 error: ThrottlingException
Message: "Too many tokens, too many requests, or too many images per day"
```
- This **does not mean the model is broken** — it means the daily token quota is depleted
- Fallback to Cloudflare should trigger automatically
- Quota resets at midnight UTC

## Escalation Path

1. AWS Console → Support → Create Case
2. Service: "Amazon Bedrock"
3. Category: "Account and Billing" → "Service Quota Increase"
4. Request: "Remove model access gating for `claude-fable-5` and `claude-sonnet-5`"
5. Mention console shows `agreement: AVAILABLE` but runtime returns `not available`

## Workaround Until Fixed

Use `claude-sonnet-4-20250514-v1:0` as principal and `claude-sonnet-4-6` as delegation. Both have equivalent reasoning quality for most tasks.

## Memory Note

Do not add Fable 5 or Sonnet 5 to fallback/delegation config until a live inference test passes successfully. Console status is not sufficient proof.
