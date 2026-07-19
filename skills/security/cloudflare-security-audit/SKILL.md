---
name: cloudflare-security-audit
description: Security audit methodology for Cloudflare Pages + Workers deployments. Covers reconnaissance, CORS validation, XSS testing, Turnstile verification, CSP analysis, and a structured prioritised remediation workflow. Use when the user says "auditer la securite", "reviser la securite", "faire un audit", "check securite", "trouver des failles" or references a Cloudflare-hosted site.
version: 1.0.0
author: gibson
platforms:
- linux
- macos
---

# Cloudflare Security Audit

Workflow structure pour auditer la securite d'un site heberge sur Cloudflare Pages avec un Worker API associe.

## Principes generaux

- **Langue** : repondre en francais (sauf termes techniques).
- **Priorisation** : classer les correctifs par gravite (Critique > Elevee > Moyenne > Basse).
- **Verification** : chaque correctif applique doit etre verifie immediatement (test reussi).
- **Validation utilisateur** : toujours presenter le plan de correction pour approbation AVANT d'appliquer les changements.
- **Zero tolerence** : ne pas laisser une faille ouverte sans la signaler clairement.

## Phase 1 : Reconnaissance

### 1.1 Site distant
```bash
# En-tetes HTTP (CSP, HSTS, XFO...)
curl -sI https://<cible> | grep -iE '^(content-security-policy|strict-transport|x-frame|x-content|x-permitted|referrer|permissions-policy)'

# En-tetes complets
curl -sI https://<cible>

# HTML complet
curl -sL https://<cible>
```

### 1.2 Worker API (si connu)
```bash
# En-tetes du worker
curl -sI https://<worker-domain>

# Test CORS
curl -s -D- -X OPTIONS https://<worker-domain>/<endpoint> -H "Origin: https://evil.com" -H "Access-Control-Request-Method: POST"

# Test endpoints connus
curl -s -X POST https://<worker-domain>/contact -H "Content-Type: application/json" -d '{"test":true}'
```

### 1.3 Depots GitHub
```bash
# Chercher le repo source
curl -s "https://api.github.com/search/repositories?q=<nom-projet>+pages" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(f\"{r['full_name']} - {r['html_url']}\") for r in d.get('items',[])]"

# Si trouve, cloner
git clone <url-repo> <dossier-local>
```

### 1.4 Fichiers Cloudflare Pages (source locale)
Verifier systematiquement :
- `_headers` — en-tetes de securite
- `_redirects` — regles de redirection
- `wrangler.toml` — config Worker
- `src/index.js` ou `src/worker.js` — code du Worker
- `js/script.js` — JS client
- `index.html` — page principale

## Phase 2 : Analyse des vulnerabilites

### 2.1 CORS Worker
**Test** : `curl -X OPTIONS -H "Origin: https://evil.com" -H "Access-Control-Request-Method: POST" <worker-url>`
**Critere** : `Access-Control-Allow-Origin` ne doit PAS etre `*`. Doit restreindre au domaine legitime.
**Correctif** : Dans le Worker, verifier `Origin` et repondre avec le domaine autorise uniquement.

### 2.2 XSS (Cross-Site Scripting)
**Test** : Soumettre `<script>alert('XSS')</script>` dans chaque champ de formulaire.
**Vecteurs** :
- Champs de formulaire envoyes au Worker (`name`, `email`, `phone`, `service`, `message`)
- URL parameters
- Query strings
**Correctif client** : `DOMPurify.sanitize()` sur tous les champs avant `fetch()`.
**Correctif worker** : validation stricte (regex, limites de taille) sur chaque champ.

### 2.3 Validation Turnstile (Cloudflare CAPTCHA)
**Verification** :
- Token recupere via `window.turnstile.getResponse()` avant soumission
- Verification serveur via `https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Token expire apres 300s — verifier qu'il n'est pas obsoleted
**Defaut courant** : la verification serveur est absente ou incomplete.

### 2.4 Validation des champs (client)
**Champs obligatoires** : nom, email, message
**Regex recommandees** :
```javascript
email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
phone: /^[\+\d\s\-\(\)]{7,20}$/
message: min 10-20 chars, max 5000 chars
```

### 2.5 CSP (Content-Security-Policy)
**Verifications** :
- `script-src` : doit limiter aux domaines Cloudflare Turnstile et Google Fonts — pas de `'unsafe-inline'`
- `connect-src` : ne doit pas contenir d'URL backend qui n'est pas appelee par le frontend
- `frame-src` : doit autoriser uniquement `https://challenges.cloudflare.com`
- `form-action` : doit autoriser uniquement `'self'` et le worker
- `base-uri` : doit etre `'self'`

### 2.6 Exposition d'informations
- Email et telephone en clair dans le HTML → encoder via JS (split/join)
- Cles API dans `wrangler.toml` ou `.env` → `npx wrangler secret put` pour les cacher

## Phase 3 : Corrections priorisees

Ordre d'application :

### PRIORITE 1 — CRITIQUE
1. **CORS Worker** restreint au seul domaine legitime
2. **Validation Turnstile serveur** via API `/siteverify`
3. **XSS** : DOMPurify client + validation regex worker

### PRIORITE 2 — ELEVEE
4. **Validation client renforcee** : regex email/phone/message, limites de taille
5. **Expiration Turnstile** : forcer reset si token obsolet

### PRIORITE 3 — MOYENNE
6. **Gestion d'erreurs Worker** : propagation correcte des erreurs Resend
7. **Variables d'environnement** : verifier que les secrets sont dans wrangler.toml

### PRIORITE 4 — BASSE
8. **CSP trop large** : retirer `connect-src` inutiles (api.resend.com si backend-only)
9. **Cache-control** : ajouter pour assets statiques (img, css, js)
10. **Email/tel encodes** : masquer en clair dans le HTML

## Phase 4 — Verification post-correctif

Apres chaque correctif :
- Navigateur : soumettre formulaire complet (avec Turnstile valide) → succes attendu
- curl OPTIONS avec `Origin: evil.com` → 403 (pas 200)
- curl OPTIONS avec origine legitime → 200 avec ACAO correct
- Tentative XSS → bloquee (message d'erreur ou rejet 400)
- Tentative sans Turnstile → 400 Bad Request
- Verification en-tetes securite : `curl -sI <url> | grep -i <header>`

## Pitfalls et points d'attention

- **Worker sans repo public** : les correctifs CORS doivent etre appliques via Cloudflare Dashboard directement
- **Turnstile frontend only** : si le token n'est pas valide cote serveur, la protection est contournable
- **DOMPurify import** : peut etre ralenti ou bloque si le CDN est inaccessible sur le reseau local
- **Split/join pour email** : ne protege pas contre les bots JavaScript avances (qui executent le JS) — offre une protection partielle seulement
- **Wrangler secrets** : toujours verifier que le fichier `.env` ou `.dev.vars` est dans `.gitignore`
- **Minification** : si le JS est minifie (98K+), la correction est plus difficile — travailler sur le source non-minifie puis re-minifier
- **Turnstile sitekey** : ne pas commit la sitekey dans le code source versionne (c'est public de toute facon, mais eviter la confusion)

## Voir aussi

- `security/strix-scan-ops` — skill operationnel pour lancer des scans Strix automatises (syntaxe, timeout, configuration Docker, TTY)
- `security/strix-scan-ops/references/strix-llm-provider-setup.md` — configuration du provider Cloudflare Workers AI pour Strix
- `security/strix-scan-ops/references/strix-sandbox-build.md` — build de la sandbox Strix custom

## Fichiers de reference

Ce skill peut contenir des fichiers de reference dans `references/` :
- `references/mwana-itech-audit-2026-07-09.md` — audit complet de Mwana-Itech (site + Worker)