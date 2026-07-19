# Model Validation Checklist

Use this before promoting any model to `model.default` or an active alias.

## Connectivity Test

```python
import requests, os
key = os.getenv("CLOUDFLARE_API_TOKEN")
account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1/chat/completions"
resp = requests.post(url, headers={"Authorization": f"Bearer {key}"},
    json={"model": "MODEL_ID", "messages": [{"role":"user","content":"Dire OK"}], "max_tokens": 10},
    timeout=15)
assert resp.status_code == 200
```

## Quality Test

```python
content = resp.json()["choices"][0]["message"]["content"].strip()
assert content and len(content) > 0  # reject null/empty
# Optional: assert "O" in content.upper() or "K" in content.upper()
```

## Bedrock-Specific Test

```python
import boto3, json
rt = boto3.Session(region_name="us-east-1").client("bedrock-runtime")
try:
    r = rt.invoke_model(modelId="MODEL_ID", body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Test"}]
    }))
    body = json.loads(r["body"].read())
    print("OK:", body["content"][0]["text"])
except Exception as e:
    err = e.response.get("Error", {}) if hasattr(e, "response") else {}
    code = err.get("Code", type(e).__name__)
    msg = err.get("Message", str(e))
    if "Too many tokens" in msg or "Throttling" in code:
        print("QUOTA_EXCEEDED (model OK)")
    elif "not available" in msg.lower():
        print("NOT_AVAILABLE (gating)")
    else:
        print(f"FAIL: {code} — {msg}")
```

## Post-Promotion Steps

- [ ] `hermes config set model.default "MODEL_ID"`
- [ ] `hermes config set model.provider "PROVIDER"`
- [ ] `systemctl --user restart hermes-gateway`
- [ ] `hermes config` to verify
- [ ] Send live test message via Telegram/Desktop
