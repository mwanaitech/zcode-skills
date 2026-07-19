# Gateway Log Diagnostics for Provider Failures

How to diagnose mid-session provider failures from the Hermes gateway logs.

## Quick Diagnostic Flow

```
1. User reports "model provider failed after retries"
2. → Check gateway logs: journalctl --user -u hermes-gateway.service --since "5 min ago"
3. → Look for: provider=, base_url=, model=, error_type=, summary=
4. → Identify which fallback provider failed and why
```

## Log Anatomy

```
WARNING agent.conversation_loop:
  API call failed (attempt 1/3)            ← attempt number
  error_type=BadRequestError               ← error class
  thread=hermes-gateway_0:128200453637824  ← gateway session
  provider=custom                          ← provider name
  base_url=https://.../v1                   ← endpoint URL
  model=@cf/moonshotai/...                 ← model ID
  summary=HTTP 400: Invalid provider        ← human-readable error
                                                       
ERROR agent.conversation_loop:             ← non-retryable: stops here
  Non-retryable client error: Error code: 400
  {'success': False, 'error': [{'code': 2008, 'message': 'Invalid provider'}]}
```

## Common Error Patterns

### 1. Cloudflare AI Gateway — "Invalid provider" (HTTP 400)

```
provider=custom
base_url=https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/{GATEWAY_ID}/compat
model=@cf/moonshotai/kimi-k2.6
summary=HTTP 400: Invalid provider
```

**Cause**: The `@cf/` model prefix routes to Cloudflare Workers AI, but the AI Gateway doesn't have Workers AI enabled as a provider in its dashboard.

**Fix**: 
- Option A: Go to Cloudflare Dashboard → AI Gateway → Gateway → Providers → enable **Workers AI**
- Option B: Remove the model from the provider's list (it won't work via Gateway)
- Option C: Use the direct Workers AI endpoint instead of the Gateway

The direct URL `api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1` does NOT require provider configuration — `@cf/` models work directly.

### 2. Cloudflare Workers AI — "Payload too large" (HTTP 413)

```
provider=custom
base_url=https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1
model=@cf/meta/llama-3.3-70b-instruct-fp8-fast
summary=HTTP 413: The estimated number of input and maximum output tokens (94099)
        exceeded this model context window limit (24000).
```

**Cause**: Long-running sessions exceed the model's context window limit (e.g., Llama 3.3 70B = 24K ctx). The gateway tries to compress but can't fit.

**Fix**:
- Use `/new` to start a fresh session
- Use `/compress` to retry compression
- Switch to a model with larger context window (e.g., Llama 4 Scout 17B = 1M ctx or Kimi K2.6 = 262K ctx)
- The `fallback_providers` chain will try the next provider when this error occurs

### 3. Bedrock — "Too many tokens per day" (HTTP 429)

```
error_type=ThrottlingException
provider=bedrock
model=global.anthropic.claude-sonnet-4-20250514-v1:0
summary=Too many tokens per day
```

**Cause**: Bedrock on-demand throughput has per-model daily token limits.

**Fix**: 
- Fallback activates automatically for that turn
- The quota resets the next day (AWS account level)
- Configure fallback_providers in config.yaml so the session continues with an alternative

### 4. Bedrock — "Model not available for this account" (HTTP 403)

```
error_type=AccessDeniedException
provider=bedrock
model=anthropic.claude-fable-5
summary=is not available for this account
```

**Cause**: The model hasn't been enabled in the AWS Bedrock console.

**Fix**:
- Go to AWS Console → Amazon Bedrock → Model access
- Request/Enable access for the model
- May take minutes to hours

## Quick Commands

```bash
# Recent logs (last 5 min)
journalctl --user -u hermes-gateway.service --since "5 min ago" --no-pager

# Filter for errors only
journalctl --user -u hermes-gateway.service --since "5 min ago" --no-pager | grep -i "error\|Non-retryable"

# See provider-level detail
journalctl --user -u hermes-gateway.service --since "5 min ago" --no-pager | grep "provider=\|model="

# Full log since last restart
journalctl --user -u hermes-gateway.service -o cat --since "1 hour ago" --no-pager

# Read the gateway's PID and process tree
systemctl --user status hermes-gateway.service --no-pager

# Check service file for log config
cat ~/.config/systemd/user/hermes-gateway.service
# StandardOutput=journal means logs go to journald
```

## Verify Delivery

When a user says "sent" but doesn't see the message, verify independently:

```bash
# hermes send --json returns delivery details
hermes send -t telegram:CHAT_ID "message" --json
# Returns: {"success":true, "platform":"telegram", "chat_id":"...", "message_id":"4715", "mirrored":true}

# Direct API test (Telegram example)
TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' ~/.hermes/.env | cut -d= -f2-)
curl -s "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=6336259792" -d "text=Hello"
# Returns: {"ok":true, "result":{"message_id":4716, ...}}
```

## Gateway Logs Are Quiet — No Provider Errors

If the gateway is running but no provider errors appear in the logs:
- The gateway may be processing but caching the session from a previous run
- Check the `session_reset` and `idle_minutes` config
- Try restarting the gateway: `systemctl --user restart hermes-gateway.service`
- If blocked from restarting, use `/new` to clear the session context
