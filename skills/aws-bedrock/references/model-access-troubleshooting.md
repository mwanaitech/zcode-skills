# AWS Bedrock Model Access — Diagnostic & Activation

The old "Model access → Request access" console page was **retired Q2 2026**.
Models now activate automatically when first invoked, **but** the EULA must be accepted first.

## Architecture of Access

```
First invocation attempt
  ↓
Bedrock checks agreementAvailability ← if NOT_AVAILABLE → AccessDeniedException
  ↓
Bedrock tries to auto-subscribe via AWS Marketplace (background, ~15 min)
  ↓
If prerequisites met (EULA accepted, payment method valid) → model becomes AVAILABLE
```

Three layers of gating:

| Layer | Check | Fix |
|-------|-------|-----|
| **EULA / Agreement** | `agreementAvailability` via `get_foundation_model_availability()` | `create_foundation_model_agreement()` |
| **FTU Form (Anthropic)** | `get_use_case_for_model_access()` | `put_use_case_for_model_access()` |
| **Marketplace Subscription** | Auto-triggered on first invoke | IAM needs `aws-marketplace:Subscribe` |

## Diagnostic Flow

```python
import boto3
client = boto3.client('bedrock', region_name='us-east-1')

# Step 1: Check model availability
avail = client.get_foundation_model_availability(modelId='anthropic.claude-fable-5')
print(avail['agreementAvailability']['status'])  # AVAILABLE or NOT_AVAILABLE

# Step 2: If NOT_AVAILABLE → accept EULA
offers = client.list_foundation_model_agreement_offers(modelId='anthropic.claude-fable-5')
token = offers['offers'][0]['offerToken']
resp = client.create_foundation_model_agreement(
    modelId='anthropic.claude-fable-5',
    offerToken=token
)
# Returns HTTP 202 — agreement created, subscription starting

# Step 3: Verify model listing
profiles = client.list_inference_profiles()
fable_profiles = [p for p in profiles['inferenceProfileSummaries']
                  if 'fable' in p['inferenceProfileId']]
for p in fable_profiles:
    print(f"{p['inferenceProfileId']}: {p['status']}")  # Should show ACTIVE
```

## Common Error: "not available for this account"

`AccessDeniedException: anthropic.claude-fable-5 is not available for this account` — the full diagnosis:

```
get_foundation_model_availability:
  authorizationStatus:    AUTHORIZED       ← IAM/gate allows it
  entitlementAvailability: AVAILABLE       ← Account is entitled
  regionAvailability:    AVAILABLE         ← Available in this region
  agreementAvailability: NOT_AVAILABLE     ★ THE PROBLEM — EULA not accepted
```

The other three can all be green while only `agreementAvailability` blocks access.

## First Time Use (FTU) Form for Anthropic

First-time Anthropic users on Bedrock must submit a use case before accessing Anthropic models:

```python
import json, base64
form_data = json.dumps({
    "companyName": "Your Company",
    "companyWebsite": "https://example.com",
    "intendedUsers": "0",           # 0=internal, 1=customers, etc.
    "industryOption": "Technology",
    "otherIndustryOption": "",
    "useCases": "Description of your use"
})
client.put_use_case_for_model_access(
    formData=base64.b64encode(form_data.encode()).decode()
)
```

Check if already submitted:
```python
resp = client.get_use_case_for_model_access()
if 'formData' in resp:
    print(base64.b64decode(resp['formData']).decode())
```

## IAM Permissions Required

| API | Action |
|-----|--------|
| `get_foundation_model_availability` | `bedrock:GetFoundationModelAvailability` |
| `list_foundation_model_agreement_offers` | `bedrock:ListFoundationModelAgreementOffers` |
| `create_foundation_model_agreement` | `bedrock:CreateFoundationModelAgreement` + `aws-marketplace:Subscribe` |
| `converse` / `invoke_model` | `bedrock:InvokeModel` / `bedrock:InvokeModelWithResponseStream` |
| `put_use_case_for_model_access` | `bedrock:PutUseCaseForModelAccess` |
| `get_use_case_for_model_access` | `bedrock:GetUseCaseForModelAccess` |

**Bearer tokens alone cannot** perform control-plane operations (agreement, FTU, data retention). Use IAM credentials (root or user with AdminAccess) for those.

## After Acceptance — Wait

After `create_foundation_model_agreement` returns HTTP 202:
1. The Marketplace subscription starts in the background (~up to 15 min but usually 1-2 min)
2. During this window, `converse` may still return `AccessDeniedException`
3. Once subscription completes, the model becomes invocable
4. Verify with: `get_foundation_model_availability()` — check `agreementAvailability` changed to `AVAILABLE`
