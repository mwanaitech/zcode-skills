# AWS Service Quotas API — Latency & Timeout Issues from High-Latency Regions

## Problem

The `aws service-quotas list-service-quotas` API call times out with HTTP **408 Request Timeout** when invoked from regions with high RTT to AWS us-east-1 (e.g. Central/West Africa, ~250–600ms latency). This is a **server-side timeout**, not a client-side network failure.

## Root Cause

1. `list-service-quotas` paginates over hundreds of quota records (300+ for Bedrock).
2. Each pagination round-trip adds ~500ms–1s with RTT >250ms.
3. AWS Service Quotas server-side timeout (~10–15s) expires before pagination completes.
4. Result: `408` returned by the **AWS server itself**, not the local client.

**Amplifying factor — VPN / proxy egress IPs**: If using Cloudflare WARP or similar, the source IP seen by AWS is a shared Cloudflare range (e.g. `104.28.x.x`). AWS may apply stricter server-side timeouts for traffic from known VPN/proxy IPs. Combined with high RTT from Central/West Africa, this makes 408 almost certain. See `references/warp-split-tunnel-aws.md` for diagnosis and the split-tunnel fix.

**Not a pure network failure**: direct `curl` to `servicequotas.us-east-1.amazonaws.com` responds in ~1.8s with HTTP 404. The TCP path is open. The problem is the paginated API surface combined with source IP / latency profile.

## Diagnosis Checklist

```bash
# 1. Verify network path is open
curl -sS --max-time 5 \
  https://servicequotas.us-east-1.amazonaws.com/ \
  -w "DNS:%{time_namelookup}s Connect:%{time_connect}s Total:%{time_total}s\n"
# Expect: DNS <1s, Connect <1s, Total <2s → network is OK

# 2. Verify the timeout is server-side
aws service-quotas list-service-quotas \
  --service-code bedrock --region us-east-1 2>&1
# Expect: HTTP 408 after ~10–15s → server-side pagination timeout
```

## Client-Side Timeout Increase (Partial Fix)

Increase AWS CLI read/connect timeouts so the client does not give up before the server does. The config lives in `~/.aws/config`:

```ini
[default]
cli_read_timeout = 180
cli_connect_timeout = 60
max_attempts = 3
```

**Limitation**: This only prevents a *client-side* abort. If the server itself returns 408, no client timeout change can fix it.

## What Does NOT Work

| Approach | Result |
|----------|--------|
| `--no-paginate` with `--max-items` | Error: incompatible flags |
| `--page-size 1` | Still 408; just multiplies request count |
| `eu-west-1` region | Same 408; server timeout is global |
| AWS Support `create-case` via CLI | `SubscriptionRequiredException` — requires AWS Premium Support plan |

## Working Alternatives

### 1. AWS Console Web

Directly the fastest path: `https://us-east-1.console.aws.amazon.com/servicequotas/home/services/bedrock/quotas`

- No pagination latency (console uses internal streaming APIs).
- Locate `Tokens per day` for the target Anthropic model → `Request quota increase`.

### 2. Support Case (if Premium Support is active)

```bash
aws support create-case \
  --subject "Increase Bedrock Claude token quota" \
  --service-code service-limit-increase \
  --severity-code low \
  --category-code limit-increase \
  --communication-body "See attached." \
  --region us-east-1
```

### 3. Automated Quota Probe + Cron

For quota *monitoring* (not listing), do a lightweight inference probe and infer quota state from the error:

```bash
aws bedrock-runtime invoke-model \
  --model-id global.anthropic.claude-sonnet-4-20250514-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":5,"messages":[{"role":"user","content":"test"}]}' \
  --region us-east-1 /dev/stdout
```

- `ThrottlingException` / `Too many tokens` → quota exhausted.
- `AccessDeniedException` / `not available` → model gating.
- Success → quota available.

This single-endpoint call is fast (< 2s even from high-latency regions) and can be run from a cron job to alert the user.

## Session-Specific Notes (2026-07-02)

- Account: `358831513781`
- Region: `us-east-1`
- RTT from Owendo, Gabon to AWS: ~250–600ms
- `list-service-quotas --service-code bedrock` consistently returned 408 after ~14s
- `bedrock-runtime invoke-model` for Sonnet 4 worked fine (1.47s) when quota was available
- `aws support describe-severity-levels` returned `SubscriptionRequiredException` (no Premium Support)
