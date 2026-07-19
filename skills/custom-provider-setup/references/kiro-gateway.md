# Kiro Gateway Reference

The Kiro IDE exposes an API backed by AWS SSO / Cognito that requires non-trivial auth. The `kiro-gateway` package (third-party, AGPLv3) provides a local OpenAI-compatible proxy.

## Package

- PyPI: `kiro-openai-gateway` (pipx installable)
- Binary: `kiro-gateway`
- Version tested: 1.0.9
- Source: `jwadow/kiro-gateway` on GitHub

## Installation

```bash
pipx install kiro-openai-gateway
```

## Configuration

### Files

| Path | Purpose |
|------|---------|
| `~/.kiro-gateway/.env` | Gateway config (PROXY_API_KEY, REFRESH_TOKEN) |
| `~/.aws/sso/cache/kiro-auth-token.json` | AWS SSO credentials for Kiro |
| `~/.config/systemd/user/kiro-gateway.service` | Systemd user service |

### `.env` Structure

```env
PROXY_API_KEY=ksk_<random>    # Local auth key for the gateway API
REFRESH_TOKEN=aorAAAA...       # Kiro refresh token (from AWS Cognito)
```

### Systemd Service

```ini
[Unit]
Description=Kiro OpenAI Gateway
After=network.target

[Service]
Type=simple
Environment=PROXY_API_KEY=ksk_<random>
Environment=KIRO_CREDS_FILE=%h/.aws/sso/cache/kiro-auth-token.json
ExecStart=%h/.local/bin/kiro-gateway
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

The service reads the credentials file (AWS SSO cache) to authenticate with Kiro's API. The PROXY_API_KEY is only for local access to the gateway itself.

## API Endpoints

- Port: **10088** (not 8000)
- Auth header: `Authorization: Bearer {PROXY_API_KEY}`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root health check |
| GET | `/health` | Detailed health check |
| GET | `/v1/models` | List available models |
| POST | `/v1/chat/completions` | Chat completions (OpenAI format) |

### Example

```bash
curl -H "Authorization: Bearer ksk_<key>" \
     -H "Content-Type: application/json" \
     -d '{"model":"auto","messages":[{"role":"user","content":"hello"}],"max_tokens":50}' \
     "http://localhost:10088/v1/chat/completions"
```

## Available Models (via Kiro)

- `claude-opus-4-5`, `claude-opus-4-5-20251101`
- `claude-haiku-4-5`
- `claude-sonnet-4-5`, `claude-sonnet-4-5-20250929`
- `claude-sonnet-4`, `claude-sonnet-4-20250514`
- `claude-3-7-sonnet-20250219`

## Limitations

- **Monthly quota**: Kiro has monthly request limits (HTTP 402). The account needs to be on a paid tier or within the free tier's monthly reset.
- **Auth expiry**: The AWS SSO token expires periodically. The gateway auto-refreshes via the refresh token.
- **No direct cloud API**: Direct calls to `app.kiro.dev/v1/chat/completions` fail with AWS API Gateway 403. The gateway handles this auth.

## Model Name Format

The gateway uses **dash-format** model IDs (`claude-opus-4-5`) — NOT dot-format (`claude-opus-4.5`). The internal `MODEL_MAPPING` converts dash-formats to Kiro internal IDs. Any model name not in the mapping is passed raw to Kiro.

Always use dash-format model names in the Hermes provider config and model aliases when targeting the gateway.

## Hermes Provider Config (Production)

```yaml
providers:
  kiro:
    type: custom
    base_url: ${KIRO_BASE_URL}
    api_key: ${KIRO_API_KEY}
    key_env: KIRO_API_KEY
    transport: chat_completions
    models:
      - claude-opus-4-5
      - claude-opus-4-5-20251101
      - claude-haiku-4-5
      - claude-sonnet-4
      - claude-sonnet-4-5
      - claude-sonnet-4-5-20250929
      - claude-3-7-sonnet-20250219
      - auto                  # gateway maps this → claude-sonnet-4.5
```

With `.env`:

```env
KIRO_BASE_URL=http://localhost:10088/v1
KIRO_API_KEY=ksk_<proxy_key_from_.kiro-gateway/.env>
```

Notice the `/v1` suffix on the base URL — the gateway's routes are under `/v1/` and Hermes appends `/chat/completions` to `base_url`.

## Applying Changes to Hermes Config

Use `hermes config set` (not direct YAML edits):

```bash
# Update provider model list
hermes config set providers.kiro.models \
  '["claude-opus-4-5","claude-haiku-4-5","claude-sonnet-4-5","auto"]'

# Update individual alias model names
hermes config set model_aliases.alias-vision-expert.model claude-opus-4-5
```

## Systemd Service Lifecycle

```bash
# Enable + start
systemctl --user enable kiro-gateway
systemctl --user start kiro-gateway

# Check status
systemctl --user status kiro-gateway

# Restart (after config changes or port conflict)
systemctl --user restart kiro-gateway

# Stop
systemctl --user stop kiro-gateway

# View logs
journalctl --user -u kiro-gateway -n 50 --no-pager
```

### Port Conflict

If the service fails with "address already in use" on port 10088, an old gateway process is still bound:

```bash
systemctl --user stop kiro-gateway
kill $(lsof -ti :10088)
systemctl --user start kiro-gateway
```

The gateway starts on port 10088 by default (NOT 8000). Verify with:

```bash
ss -tlnp | grep 10088
```
