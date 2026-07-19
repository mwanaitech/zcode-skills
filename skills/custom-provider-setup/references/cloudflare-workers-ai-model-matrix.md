# Cloudflare Workers AI — Modèles validés et modèles cassés

> Date de création: 2026-07-02 (session Fable-5 / Bedrock debugging)
> Compte Cloudflare: 618fc58025826a8b715c13b4cd79b6f6 (us-east-1)

## Modèles testés et VALIDES (réponse OK, qualité acceptable)

| Modèle | Tags | Usage recommandé |
|--------|------|-----------------|
| `@cf/qwen/qwq-32b` | reasoning | Principal / principal fallback — meilleur rapport qualité/coût |
| `@cf/qwen/qwen3-30b-a3b-fp8` | general | Usage général, rapide |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | code | Code, refactoring, review |
| `@cf/moonshotai/kimi-k2.6` | general | Principal alternatif (actuellement utilisé) |
| `@cf/moonshotai/kimi-k2.7-code` | code | Code alternatif |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | general | Fallback rapide, compatible tout |
| `@cf/meta/llama-4-scout-17b-16e-instruct` | general | Nouveau, qualité OK |
| `@cf/mistralai/mistral-small-3.1-24b-instruct` | general | Alternatif léger |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | reasoning | Distill DeepSeek, raisonnement OK |

## Modèles testés et CASSÉS (à éviter)

| Modèle | Symptôme | Note |
|--------|----------|------|
| `@cf/nvidia/nemotron-3-120b-a12b` | Réponse nulle (NoneType sur contenu) | Inutilisable en pratique |
| `@cf/openai/gpt-oss-120b` | Réponse nulle | Inutilisable |
| `@cf/openai/gpt-oss-20b` | Réponse nulle | Inutilisable |
| `@cf/zai-org/glm-4.7-flash` | Timeout / connexion échouée | Inutilisable |
| `@cf/zai-org/glm-5.2` | Timeout / connexion échouée | Inutilisable |

## Méthode de test rapide

```python
import os, requests

key = os.getenv("CLOUDFLARE_API_TOKEN")
account = os.getenv("CLOUDFLARE_ACCOUNT_ID")
url = f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1/chat/completions"

resp = requests.post(url, headers={"Authorization": f"Bearer {key}"},
    json={
        "model": "@cf/qwen/qwq-32b",
        "messages": [{"role": "user", "content": "Dis 'OK'"}],
        "max_tokens": 10
    }, timeout=15)
print(resp.json()["choices"][0]["message"]["content"])
```

## Problème connu: fallback_providers et AWS quota

Le `fallback_providers:` dans config.yaml ne se déclenche que sur des
conditions spécifiques (rate limit 429, 503, timeout, exhausted retries).
Un quota AWS "Too many tokens per day" retourne HTTP 400 avec une
ThrottlingException — l'erreur est une "validation exception", ce qui fait
que le fallback n'est PAS toujours déclenché.

Solution: quand Bedrock est throttlé, basculer manuellement ou redémarrer
avec un provider Cloudflare en principal.
