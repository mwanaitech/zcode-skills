# Odysseus Specific Quirks

**Last updated:** 2026-07-02 (session: diagnostic CPU spike)

## Skill Marketplace Spam

Odysseus (interface web) charge **toutes les skills simultanement** quand le marketplace ou l'autocomplete s'affiche.
- Pattern: `GET /api/skills/{name}/markdown` x 198+ requetes paralleles
- IP client: `172.18.0.1` (Docker bridge gateway — frontend/browser)
- Impact: UVicorn a 56%+ CPU / 100%+ au global
- Solution cote dev: debounce les calls, cache les markdowns, pagination
  
## Services MCP inactifs

4 MCP servers tournent en fond a 0% CPU mais sont non-fonctionnels si non configures:

| Serveur | Fichier | Defaut |
|---|---|---|
| RAG | `rag_server.py` | Inactif |
| Memory | `memory_server.py` | Inactif |
| Image Gen | `image_gen_server.py` | Inactif |
| Email | `email_server.py` | Inactif — logs WARNING `SMTP not configured`, `IMAP not configured` |

## Erreurs courantes dans les logs

```
WARNING - SMTP not configured — add an Email Account in Settings or set env vars
WARNING - IMAP not configured — add an Email Account in Settings or set env vars
ERROR   - Failed to list emails: [Errno 111] Connection refused
404 Not Found - /static/icon-192.png
```

## Command entrypoint

```
uvicorn app:app --host 0.0.0.0 --port 7000
```

## SearXNG (container voisin)

- Toujours `healthy` dans `docker-compose`
- Recherche web en fallback si le LLM principal est indisponible

## Reverse Proxy / Reseau

Dans le setup compose d'Odysseus, le reseau bridge est `172.18.0.0/16`. Toutes les requetes HTTP vues par Odysseus viennent de `172.18.0.1` — le host ou le reverse proxy (pas d'IP distincte par container).
