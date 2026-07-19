# Cloudflare One / WARP Split-Tunnel for AWS Services

## When This Applies

You are running Cloudflare One (WARP) and AWS CLI/API calls fail with **HTTP 408 Request Timeout** or unusual latency/timeouts, even though:
- Direct `curl` to AWS endpoints resolves and connects in <2s
- Network path is otherwise healthy (ping to other hosts works, latency is normal)
- `ipinfo.io` shows a **Cloudflare IP** (`104.28.x.x` or similar) instead of your ISP's public IP

## Diagnosis Steps

```bash
# 1. Check if WARP is active
warp-cli status
# Expected: Connected

# 2. Verify public IP is Cloudflare, not ISP
curl -sS https://ipinfo.io/ip
# Returns 104.28.x.x → traffic exits through Cloudflare edge

# 3. Confirm AWS endpoint is reachable via curl
curl -sS --max-time 10 \
  https://servicequotas.us-east-1.amazonaws.com/ \
  -w "HTTP:%{http_code} DNS:%{time_namelookup}s Connect:%{time_connect}s Total:%{time_total}s\n"
# Expect: HTTP 404, Total <2s → TCP path is fine

# 4. Confirm CLI paginated API still fails
aws service-quotas list-service-quotas \
  --service-code bedrock --region us-east-1 2>&1
# Expect: HTTP 408 after ~10-15s → AWS server-side timeout for this source IP
```

## Root Cause

AWS applies different server-side timeout policies based on source IP classification. IPs in Cloudflare's shared ranges (WARP egress) may get shorter pagination timeouts. Combined with ~250-600ms RTT from Central/West Africa, the `list-service-quotas` paginated API (300+ records for Bedrock) cannot complete before AWS server-side timeout fires. Result: **HTTP 408**.

This is **not** a general WARP bug — the single-endpoint AWS API calls (`bedrock-runtime invoke-model`) worked fine even with WARP active. Only paginated list APIs are affected.

## Fix: Add AWS to Split-Tunnel Exclusions

```bash
# Exclude all AWS endpoints from WARP
echo "Current excluded hosts:"
warp-cli tunnel host list

echo ""
echo "Adding AWS exclusion..."
warp-cli tunnel host add "*.amazonaws.com"

echo ""
echo "Reconnecting WARP..."
warp-cli connect

echo ""
echo "Verifying exclusion:"
warp-cli tunnel host list
# Should show: Excluded hosts: *.amazonaws.com (CLI exclude)
```

## Verification After Fix

```bash
# Confirm AWS traffic bypasses WARP
ip route get 44.207.121.250 2>/dev/null
# Should show route via your ISP interface (e.g., wlp2s0), NOT via CloudflareWARP

# Confirm public IP is back to ISP
curl -sS https://ipinfo.io/ip
# Should show ISP IP, not 104.28.x.x

# Confirm AWS Service Quotas works
aws service-quotas list-service-quotas \
  --service-code bedrock --region us-east-1 \
  --query 'Quotas[].{Name:QuotaName,Code:QuotaCode}' \
  --output table --no-paginate
```

## Rollback

```bash
# Remove AWS from split-tunnel
warp-cli tunnel host remove "*.amazonaws.com"
warp-cli connect
```

## Session Notes

- Date: 2026-07-02
- Account: 358831513781
- Region: us-east-1
- Platform: Linux Mint, Cloudflare WARP daemon active
- Location: Owendo/Gabon, ~250-600ms RTT to AWS us-east-1
- Before fix: `aws service-quotas list-service-quotas` consistently timed out with 408 after ~14s
- After fix: same command completed in ~2s successfully
