# Compression Settings by Platform

Settings tested and validated to prevent "Request payload too large (413)" on different Hermes surfaces.

## CLI (`hermes`)

Least affected — no HTTP intermediary. Compression handled inline in Python.

```yaml
compression:
  enabled: true
  threshold: 0.5
  target_ratio: 0.2
  protect_last_n: 20
  protect_first_n: 3
agent:
  max_turns: 60
```

## Desktop (`hermes desktop`)

Affected when context accumulates across many turns. Payload goes through HTTP POST to `localhost:8642`.

```yaml
compression:
  enabled: true
  threshold: 0.35
  target_ratio: 0.15
  protect_last_n: 10
  protect_first_n: 2
agent:
  max_turns: 50
```

**Restart required:** `pkill hermes-desktop && hermes desktop`

## Telegram Gateway (`hermes-gateway`)

Most affected — sessions are longer-lived and accumulate more context across interactions.

```yaml
compression:
  enabled: true
  threshold: 0.3
  target_ratio: 0.1
  protect_last_n: 5
  protect_first_n: 1
agent:
  max_turns: 40
```

**Restart required:** `systemctl --user restart hermes-gateway`

**If 413 persists after restart:** The session context accumulated in Telegram is too large even after compression. User must run `/new` in Telegram to create a fresh session.

## Command Summary

```bash
# Aggressive (for Telegram/Desktop)
hermes config set compression.threshold 0.3
hermes config set compression.target_ratio 0.1
hermes config set compression.protect_last_n 5
hermes config set compression.protect_first_n 1
hermes config set agent.max_turns 40
systemctl --user restart hermes-gateway
```

## Why `compress further` Fails

The error "Request payload too large (413). Cannot compress further." means:
1. Context is at the model's `context_length` limit
2. Compression was triggered but could not reduce below payload limit
3. The HTTP layer (Gateway → API server) has a limit lower than the model's context window

Fix: Reduce `threshold` so compression triggers earlier, and `protect_last_n` so fewer messages are exempt from compression.
