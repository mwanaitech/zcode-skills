# invalid_client — Full Resolution Recipe

## Error Transcript

```
OAUTH_CLIENT_DISABLED: ('invalid_client: The provided client secret is invalid.',
  {'error': 'invalid_client',
   'error_description': 'The provided client secret is invalid.'})
```

## Context

Occurs when using `setup.py --check` after a previously-working OAuth setup stops
authenticating. The token file (`google_token.json`) exists with a refresh token,
but Google rejects the client_id + client_secret pair.

## Root Causes (in order of likelihood)

1. **Multiple client_secret files exist and the wrong one is installed.**
   User downloaded a fresh `client_secret_*.json` from Google Cloud Console
   (possibly after creating a new OAuth client or rotating the secret), but
   `~/.hermes/google_client_secret.json` still points to the old file.

2. **The OAuth client was deleted in Google Cloud Console.**
   The credential no longer exists, so any client_secret is rejected.

3. **The client secret was rotated in Google Cloud Console.**
   The old secret is invalidated; the new one must be downloaded and installed.

## Diagnosis Steps

```bash
# 1. Find all client_secret files on the system
find ~ -name "client_secret_*.json" -not -path "*/node_modules/*" -not -path "*/venv/*" 2>/dev/null

# 2. Extract the client_secret from the stored token
grep client_secret ~/.hermes/google_token.json

# 3. Compare with each found file
for f in $(find ~ -name "client_secret_*.json" 2>/dev/null); do
  echo "=== $f ==="
  grep client_secret "$f"
done

# 4. Check what's currently installed
grep client_secret ~/.hermes/google_client_secret.json
```

The token file's `client_secret` field **must** match the installed
`google_client_secret.json`. If they differ, copy the matching file.

## Resolution Path

### If the correct client_secret file exists but isn't installed:

```bash
cp /path/to/correct/client_secret_*.json ~/.hermes/google_client_secret.json
```

### If no client_secret matches, or the correct one still fails:

The OAuth client itself is likely disabled/deleted. Create fresh credentials:

1. Visit https://console.cloud.google.com/apis/credentials
2. Create Credentials → OAuth 2.0 Client ID → Desktop app
3. Download the JSON
4. Install it:
   ```bash
   cp ~/Téléchargements/client_secret_*.json ~/.hermes/google_client_secret.json
   ```
5. Generate auth URL and re-authorise (full workflow in SKILL.md).

## Verification

After resolution:

```bash
$GSETUP --check
# Expected: "OK: Token valid — X scopes granted"
```
