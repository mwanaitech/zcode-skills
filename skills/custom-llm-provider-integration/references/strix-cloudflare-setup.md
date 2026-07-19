# Strix + Cloudflare Workers AI — Notes de session

Contexte : session du 2026-07-08. Configuration de Strix avec Cloudflare Workers
AI comme unique provider LLM, en mode Docker Compose.

## Résultat

L'environnement est configuré et le sandbox image (11 GB) est téléchargée.
La première tentative de scan a échoué sur un crash de Caido dû à un
**certificat RSA incompatible** (Caido 0.56.0 exige des clés EC).
Voir la section « Problème connu : certificat RSA » dans le SKILL.md parent.

## Corrections appliquées en session

1. Timeouts augmentés à 60s (connect) et 300s (execution)
2. Image sandbox corrigée `strix-sandbox-fixed` avec certificats EC prime256v1
3. `STRIX_IMAGE=strix-sandbox-fixed` ajouté au `.env`
4. Vérification manuelle : Caido ready en 2 tentatives après correction

## Le fix en une commande

```bash
# Construire l'image sandbox avec certificats EC
cd /home/gibson/strix

cat > Dockerfile.sandbox << 'DOCKERFILE'
FROM ghcr.io/usestrix/strix-sandbox:1.0.0
RUN openssl ecparam -genkey -name prime256v1 -out /app/certs/ca.key && \
    openssl req -x509 -new -key /app/certs/ca.key -out /app/certs/ca.crt \
      -days 365 -nodes -subj "/C=US/O=Strix/CN=Strix CA" && \
    openssl pkcs12 -export -in /app/certs/ca.crt -inkey /app/certs/ca.key \
      -out /app/certs/ca.p12 -passout pass:
DOCKERFILE

docker build -t strix-sandbox-fixed -f Dockerfile.sandbox .
echo "STRIX_IMAGE=strix-sandbox-fixed" >> .env
```

## Configuration adoptée

Fichier `/home/gibson/strix/.env` :

```
STRIX_LLM=openai/@cf/meta/llama-3.3-70b-instruct-fp8-fast
LLM_API_KEY=cfut_xxxxxxxxx
LLM_API_BASE=https://api.cloudflare.com/client/v4/accounts/618fc58025826a8b715c13b4cd79b6f6/ai/v1/
STRIX_REASONING_EFFORT=high
STRIX_SANDBOX_CONNECT_TIMEOUT=60
STRIX_SANDBOX_EXECUTION_TIMEOUT=300
```

## docker-compose.yml

```yaml
services:
  strix:
    build: .
    image: strix-local
    container_name: strix
    env_file:
      - .env
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - STRIX_LLM=${STRIX_LLM:-openai/gpt-5.4}
      - LLM_API_BASE=${LLM_API_BASE}
      - STRIX_REASONING_EFFORT=${STRIX_REASONING_EFFORT:-high}
    volumes:
      - ./workspace:/workspace
      - /var/run/docker.sock:/var/run/docker.sock
      - /usr/bin/docker:/usr/bin/docker
    working_dir: /workspace
    command: ["--help"]
```

## CLI Strix testée

```bash
docker compose run --rm strix \
  --target http://test-php.example.com \
  --scan-mode quick \
  --non-interactive \
  --instruction "Quick connectivity test only"
```

## Docker host

- Version : Docker 29.1.3
- OS : Linux (6.17.0-35-generic)
- Architecture : x86_64

## Problème connu

**Certificat RSA incompatible** : Caido 0.56.0 ne supporte que les clés EC
pour `--import-ca-cert`, mais l'image officielle génère du RSA 2048.
Solution : builder une image sandbox avec certificats EC (voir section
« Le fix en une commande » ci-dessus, ou le SKILL.md parent section
« Problème connu : certificat RSA incompatible avec Caido ≥0.56 »).

## Liens

- Documentation Strix : https://usestrix-strix.mintlify.app/
- Erreur Caido : instance not ready after 5 attempts
- Skill parent : `custom-llm-provider-integration`
