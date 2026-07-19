---
name: google-oauth-setup
version: 1.0.0
description: "Complete Google OAuth2 setup workflow for Hermes, covering Google Workspace (Gmail, Calendar, Drive, Sheets, Docs). Includes real pitfalls and fixes encountered in production sessions."
author: Nous Research
platforms: [linux, macos, windows]
required_environment: []
---

# Google OAuth Setup for Hermes

This skill guides the non-interactive Google OAuth2 flow used by Hermes skills (notably `google-workspace`) to authenticate with Gmail, Calendar, Drive, Sheets, and Docs.

## Prerequisites

- A Google Cloud project
- User must enable required APIs manually in Google Cloud Console (the Hermes script cannot do this)
- OAuth consent screen configured

## Workflow (6 Steps)

```bash
GSETUP="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/setup.py"

# 1. Check if already authenticated
$GSETUP --check

# 2. Store client_secret.json (downloaded from Google Cloud Console)
$GSETUP --client-secret /path/to/client_secret_xxx.json

# 3. Generate auth URL
$GSETUP --auth-url

# 4. User visits URL in browser, authorizes, copies redirected URL
# 5. Exchange code for token
$GSETUP --auth-code "PASTE_FULL_REDIRECT_URL_HERE"

# 6. Verify
$GSETUP --check
```

## Creating OAuth Credentials (User does this once)

1. Go to https://console.cloud.google.com/projectselector2/home/dashboard → Create project
2. Enable APIs at https://console.cloud.google.com/apis/library:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API (optional)
   - Google Docs API (optional)
3. Go to https://console.cloud.google.com/apis/credentials
4. Create Credentials → OAuth 2.0 Client ID → Application type: **Desktop app**
5. Download JSON

⚠️ **CRITICAL**: If the app is in **Testing** status (which is default), the user's email MUST be added as a test user at https://console.cloud.google.com/auth/audience before authorization will succeed.

## Pitfalls & Fixes

### 1. Error: `access_denied` during authorization

**Cause**: App is in Testing mode and the user's email is NOT in the test users list.

**Fix**:
- Go to https://console.cloud.google.com/auth/audience
- Add user's email as a test user
- Re-run `$GSETUP --auth-url` and re-authorize

### 2. Error: `Gmail API has not been used in project before or it is disabled`

**Cause**: The API was enabled in Google Cloud Console but Google's systems need time to propagate, OR the API was never enabled.

**Fix**:
- Go directly to the URL shown in the error message (it contains the project ID)
- Click "Enable"
- Wait 2-3 minutes
- Retry the API call

### 3. Script does NOT support --services or --format flags

The `setup.py` script bundled with Hermes has a simple argument parser. Valid flags are ONLY:

- `--check`
- `--check-live`
- `--client-secret PATH`
- `--auth-url`
- `--auth-code CODE`
- `--revoke`
- `--install-deps`

There is **no `--services`** flag to scope scopes. The script requests all Workspace scopes on every auth.

### 4. Redirected URL must be pasted fully, not just the code

The `--auth-code` flag accepts either:
- The full redirect URL (e.g. `http://localhost:1/?code=4/0A...&scope=...`)
- Or just the raw code string

If the user pastes the full URL, the script extracts the code and scopes automatically.

### 5. Browser shows "localhost refused to connect"

This is **expected**. The redirect goes to `http://localhost:1` which has no server listening. The user must copy the URL from the browser's address bar.

### 6. Error: `invalid_client: The provided client secret is invalid`

**Cause**: The OAuth 2.0 Client credential in Google Cloud Console has been deleted, disabled, or had its client secret rotated. This is NOT a token expiry issue — it means Google no longer recognises the credential pair.

**Diagnosis — multiple client_secret files**:

Users often download multiple `client_secret_*.json` files (from creating new credentials or rotating secrets). To identify which one matches the stored token:

```bash
# Extract client_secret from the token file
grep client_secret ~/.hermes/google_token.json

# Compare with each client_secret file
grep client_secret ~/Téléchargements/client_secret_*.json
```

The token's `client_secret` must match the file installed as `~/.hermes/google_client_secret.json`. If they differ, copy the matching file.

**Fix when the correct file still fails**:

1. Go to https://console.cloud.google.com/apis/credentials
2. Check if the OAuth client with ID `581943771814-xxxx` still exists and is enabled
3. If the secret was rotated, download the new JSON and re-auth
4. If the client was deleted, create a new one:
   - Create Credentials → OAuth 2.0 Client ID → Application type: **Desktop app**
   - Download the JSON
5. Update `~/.hermes/google_client_secret.json` with the new credentials
6. Run `$GSETUP --auth-url` to get a fresh authorization URL
7. Have the user visit it, authorize, and paste back the redirected URL
8. Exchange the code: `$GSETUP --auth-code "PASTE_FULL_URL_HERE"`
9. Verify: `$GSETUP --check`

## Verification Commands

After setup, test with:

```bash
GAPI="python ${HERMES_HOME:-$HOME/.hermes}/skills/productivity/google-workspace/scripts/google_api.py"

# Gmail: list unread emails
$GAPI gmail search "is:unread" --max 5

# Calendar: list upcoming events
$GAPI calendar list

# Drive: search files
$GAPI drive search "report" --max 5
```

## Revoking Access

```bash
$GSETUP --revoke
```

## Troubleshooting Summary

| Error | Root Cause | Fix |
|---|---|---|
| `access_denied` | Email not in test users list | Add at https://console.cloud.google.com/auth/audience |
| `API not enabled` | API disabled in project | Enable in Google Cloud Console, wait 2-3 min |
| `NOT_AUTHENTICATED` | No token stored | Run full setup workflow |
| `TOKEN_REVOKED` | Token invalidated by user | Re-run setup workflow |
| `REFRESH_FAILED` | Refresh token expired | Re-run setup workflow |
| `invalid_client` | OAuth client disabled/deleted/rotated | Verify in Cloud Console, create new client if needed, re-auth |
| `pip install` fails with `externally-managed-environment` (PEP 668) | Debian/Ubuntu blocks system pip | Create a venv: `python3 -m venv ~/.hermes/.venv-google && ~/.hermes/.venv-google/bin/pip install google-api-python-client google-auth-oauthlib google-auth-httplib2`, then prefix all `$GSETUP`/`$GAPI` commands with `~/.hermes/.venv-google/bin/python3` |

## References

- `references/google-oauth-errors.md` — Full error transcripts and resolution recipes
- `references/invalid-client-resolution.md` — Step-by-step recipe for the `invalid_client` error with multi-secret diagnosis
