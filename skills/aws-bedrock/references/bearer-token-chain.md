# botocore Bearer Token Resolution Chain for Bedrock

This document traces exactly how botocore resolves `AWS_BEARER_TOKEN_BEDROCK` from the environment. Useful when debugging auth failures or understanding which env var name to set.

## Auth Model in Service Definition

The Bedrock Runtime service model (`botocore/data/bedrock-runtime/2023-09-30/service-2.json.gz`) declares **two** auth methods:

```json
"auth": [
    "aws.auth#sigv4",
    "smithy.api#httpBearerAuth"
]
```

With `signingName: "bedrock"` and `signatureVersion: "v4"`. The bearer auth is a secondary mechanism that botocore attempts when no SigV4 credentials are available and a bearer token provider is configured.

## Token Resolution Chain

```
boto3.client("bedrock-runtime", region_name=region)
  → botocore Endpoint / Signer
    → create_token_resolver(session)
      → [ScopedEnvTokenProvider, SSOTokenProvider]
        → ScopedEnvTokenProvider.load_token(signing_name="bedrock")
          → get_token_from_environment("bedrock", os.environ)
            → _get_bearer_env_var_name("bedrock")
              → signing_name: "bedrock"
              → uppercase + underscores: "BEDROCK"
              → final: "AWS_BEARER_TOKEN_BEDROCK"
            → return os.environ.get("AWS_BEARER_TOKEN_BEDROCK")
          → returns FrozenAuthToken(token=value)
        → TokenProviderChain resolves the token
      → BearerAuth(token) signs the request
```

### Key Source Code

`botocore/utils.py`, function `_get_bearer_env_var_name`:

```python
def _get_bearer_env_var_name(signing_name):
    bearer_name = signing_name.replace('-', '_').replace(' ', '_').upper()
    return f"AWS_BEARER_TOKEN_{bearer_name}"
```

For `signing_name="bedrock"`:
- `bearer_name = "BEDROCK"`
- `return "AWS_BEARER_TOKEN_BEDROCK"`

`botocore/tokens.py`, class `ScopedEnvTokenProvider`:

```python
class ScopedEnvTokenProvider:
    METHOD = 'env'

    def load_token(self, **kwargs):
        signing_name = kwargs.get("signing_name")
        if signing_name is None:
            return None
        token = get_token_from_environment(signing_name, self.environ)
        if token is not None:
            logger.info("Found token in environment variables.")
            return FrozenAuthToken(token)
        return None
```

## Why NOT `AWS_BEARER_TOKEN`

The generic `AWS_BEARER_TOKEN` (without suffix) is **not** checked by `ScopedEnvTokenProvider`. The scoped provider requires a signing-name-specific env var. Only `AWS_BEARER_TOKEN_BEDROCK` works for Bedrock Runtime.

`AWS_BEARER_TOKEN` alone triggers `NoCredentialsError` because botocore can't match it to any service.

## Hermes Detection Layer

`agent/bedrock_adapter.py` has its own detection function:

```python
def resolve_aws_auth_env_var(env=None):
    # Priority:
    # 1. AWS_BEARER_TOKEN_BEDROCK
    # 2. AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
    # 3. AWS_PROFILE
    # 4. Implicit (IMDS, ECS, etc.)
```

This is Hermes-specific and mirrors OpenClaw's `resolveAwsSdkEnvVarName()`. It checks the same env var that botocore looks for, in the same priority order.

## `hermes config set` Routing Exception

`AWS_BEARER_TOKEN_BEDROCK` does NOT match `hermes config set`'s `.env` routing patterns (which typically look for `*_API_KEY`, `*_TOKEN`, `*_SECRET`, `*_SECRET_ACCESS_KEY`). The var name routes to `config.yaml` instead of `.env`.

**Workaround**: Append directly to `.env`:

```bash
echo "AWS_BEARER_TOKEN_BEDROCK=<token>" >> ~/.hermes/.env
```

## Debugging Checklist

If Bedrock auth fails with "Unable to locate credentials":

1. Check `.env` contains `AWS_BEARER_TOKEN_BEDROCK` (not just `AWS_BEARER_TOKEN`)
2. Verify `AWS_DEFAULT_REGION` is set (in `.env` or `config.yaml`)
3. Confirm `boto3 >= 1.34.59` is installed in the Hermes venv
4. Test with a direct boto3 call (not via Hermes):
   ```python
   os.environ['AWS_BEARER_TOKEN_BEDROCK'] = '<token>'
   os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
   client = boto3.client('bedrock-runtime', region_name='us-east-1')
   client.converse(modelId='...', messages=[...], inferenceConfig={'maxTokens': 50})
   ```
5. Check if the token has the `ABSK` prefix (Bedrock API key format)
6. Verify the Bedrock model IDs are enabled in the AWS Console for the configured region
