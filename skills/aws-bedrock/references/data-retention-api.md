# Bedrock Data Retention API for Claude Fable 5

## Why It Exists

Anthropic requires 30-day input/output retention plus human review for Claude Fable 5 (abuse detection). AWS Bedrock enforces this via the Data Retention API before allowing invocation of Fable 5.

## Endpoints

### bedrock-mantle (recommended with bearer token)

```
PUT https://bedrock-mantle.{region}.api.aws/v1/data_retention
x-api-key: {bearer_token}
Content-Type: application/json

{"mode": "provider_data_share"}
```

### bedrock-runtime (SigV4 — needs IAM creds)

```
PUT https://bedrock.{region}.amazonaws.com/data-retention
Authorization: AWS4-HMAC-SHA256 ...
Content-Type: application/json

{"mode": "provider_data_share"}
```

## Working Commands

### Via curl with SigV4 (confirmed working 2026-07-02)

With IAM credentials (access key + secret key):

```bash
curl -s -X PUT https://bedrock.us-east-1.amazonaws.com/data-retention \
  --aws-sigv4 "aws:amz:us-east-1:bedrock" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode":"provider_data_share"}'
```

**Success response**: `{"mode":"provider_data_share","updatedAt":"2026-07-02T00:55:49.239Z"}`

### Via bedrock-mantle with x-api-key

```bash
curl -X PUT https://bedrock-mantle.us-east-1.api.aws/v1/data_retention \
  -H "x-api-key: $AWS_BEARER_TOKEN_BEDROCK" \
  -H "Content-Type: application/json" \
  -d '{"mode": "provider_data_share"}'
```

Requires IAM policy `bedrock-mantle:PutAccountDataRetention` on the API key's user.

## Permission Model

| API | IAM Action | Auth Type |
|-----|-----------|-----------|
| `bedrock-mantle:PutAccountDataRetention` | `bedrock-mantle:PutAccountDataRetention` | x-api-key (bearer token) |
| `bedrock:PutAccountDataRetention` | `bedrock:PutAccountDataRetention` | SigV4 (IAM creds) |

The bearer token (Bedrock API key, format `ABSK...`) only grants **runtime** permissions (Converse, Invoke, InvokeModel). Control-plane actions like `PutAccountDataRetention` need explicit IAM policy on the API key's associated IAM user, or use SigV4 with IAM credentials directly.

## Permission Error

```json
{"error":{"code":"access_denied",
  "message":"User: arn:aws:iam::358831513781:user/BedrockAPIKey-{id} is not authorized 
  to perform: bedrock-mantle:PutAccountDataRetention on resource: * because no 
  identity-based policy allows the bedrock-mantle:PutAccountDataRetention action",
  "type":"permission_denied_error"}}
```

**Fix**: Either (a) add IAM policy to the `BedrockAPIKey-{id}` user granting `bedrock-mantle:PutAccountDataRetention`, or (b) use SigV4 curl with IAM credentials.

## boto3 Limitation

`boto3.client('bedrock')` versions < 1.35.x do NOT expose `put_account_data_retention`. Use the raw HTTP API or AWS CLI v2.

## AWS CLI (once installed)

```bash
export AWS_BEARER_TOKEN_BEDROCK=<token>
aws bedrock put-account-data-retention --mode provider_data_share
```

## Query Current Setting

```bash
curl -s https://bedrock.us-east-1.amazonaws.com/data-retention \
  --aws-sigv4 "aws:amz:us-east-1:bedrock" \
  --user "$AWS_ACCESS_KEY_ID:$AWS_SECRET_ACCESS_KEY" | jq .
```

## Fable 5 — After Data Retention

Data retention alone is NOT enough to use Claude Fable 5. You must also **enable model access** in the Bedrock console:

1. Go to AWS Console > Amazon Bedrock > Model access (us-east-1)
2. Find Claude Fable 5, click "Request access" / "Enable"
3. May take minutes to hours for approval

Without model access, you get:
`AccessDeniedException: anthropic.claude-fable-5 is not available for this account.`
