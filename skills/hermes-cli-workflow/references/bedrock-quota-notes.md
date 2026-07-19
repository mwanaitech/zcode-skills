# AWS Bedrock Service Quotas — CLI Limitations

## What Works

```bash
aws service-quotas list-service-quotas \
  --service-code bedrock \
  --region us-east-1
```

Returns only **5 generic quotas**:

| Code | Name | Value |
|------|------|-------|
| L-5B274E24 | Mistral Large 3 requests/min | 0.0 |
| L-0AD9BBE8 | Claude Opus 4.6 cross-region tokens/min | 0.0 |
| L-44FD86CF | GLM 4.7 batch min records | 100.0 |
| L-2767B9A9 | Claude Opus 4.5 batch max records | 100000.0 |
| L-CB5B847D | Custom models per account | 100.0 |

## What Does NOT Work

The **"On-demand inference tokens per day"** quota for Anthropic Claude (Sonnet 4, Fable 5, etc.) is **not exposed** in the Service Quotas API.

## Where to Check

- Console: https://us-east-1.console.aws.amazon.com/servicequotas/home/services/bedrock/quotas
- Bedrock Usage: https://us-east-1.console.aws.amazon.com/bedrock/home#/usage-error

## Quota Reset

Daily token quota resets at **midnight UTC**.

## ThrottlingException

When you hit the quota:
```
Too many tokens, please wait before retrying.
```

**Fallback**: Switch to Cloudflare Workers AI (`@cf/moonshotai/kimi-k2.6`, `@cf/qwen/qwq-32b`, etc.) until quota resets.
