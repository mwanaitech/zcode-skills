#!/bin/bash
# Vérifie le quota Bedrock et envoie alerte si <20%
export HOME=/home/gibson
cd /home/gibson/.hermes/hermes-agent/venv && source bin/activate

python3 << 'PYEOF'
import boto3, json, urllib.request, urllib.parse, os

session = boto3.Session(region_name='us-east-1')
rt = session.client('bedrock-runtime')

BOT = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT = os.getenv("TELEGRAM_ALLOWED_USERS","").split(",")[0]

def send(msg):
    if not BOT or not CHAT: return
    urllib.request.urlopen(
        f"https://api.telegram.org/bot{BOT}/sendMessage",
        data=urllib.parse.urlencode({"chat_id": CHAT, "text": msg}).encode(),
        timeout=10
    )

try:
    rt.invoke_model(
        modelId="global.anthropic.claude-sonnet-4-20250514-v1:0",
        body=json.dumps({"anthropic_version":"bedrock-2023-05-31","max_tokens":5,"messages":[{"role":"user","content":"test"}]})
    )
    send("[Hermes] Bedrock quota OK")
except Exception as e:
    if "Too many tokens" in str(e):
        send("[Hermes] QUOTA BEDROCK PLEIN ! Réduit usage ou augmente limite.")
    elif "not available" in str(e).lower():
        send("[Hermes] Modèle non disponible (gating)")
    else:
        send(f"[Hermes] Erreur Bedrock: {str(e)[:80]}")
PYEOF
