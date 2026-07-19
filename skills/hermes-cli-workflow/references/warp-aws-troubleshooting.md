# WARP + AWS Troubleshooting

## Problem
AWS CLI calls (`aws service-quotas`, `aws bedrock invoke-model`) fail with **408 Request Timeout** when Cloudflare WARP is active.

## Root Cause
WARP tunnels all traffic, adding significant latency to AWS API calls from certain regions (e.g., Gabon). The TLS handshake times out before AWS responds.

## Fix: Split-Tunnel Exclusion

Exclude `*.amazonaws.com` from the WARP tunnel so AWS traffic goes direct:

```bash
# WARP GUI: Settings > Split Tunnel > Manage > Add Host
# Or via gCloud WARP CLI:
warp-cli tunnel add-excluded-host-pattern "*.amazonaws.com"
```

## Verification

```bash
# Should succeed without 408
aws service-quotas list-service-quotas --service-code bedrock --region us-east-1
aws bedrock invoke-model --model-id anthropic.claude-sonnet-4-20250514-v1:0 ...
```

## Note on AWS Service Quotas API

`aws service-quotas list-service-quotas --service-code bedrock` **only returns 5 generic quotas** in us-east-1. The "Tokens per day" quota for Anthropic Claude models does **not** appear in the CLI/API — it must be checked via the AWS Console:

- https://us-east-1.console.aws.amazon.com/servicequotas/home/services/bedrock/quotas
- Or Bedrock dashboard: https://us-east-1.console.aws.amazon.com/bedrock/home#/usage-error

The daily token quota resets at **midnight UTC**.
