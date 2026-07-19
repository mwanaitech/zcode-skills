# Cas Odysseus — 2026-07-04

## Symptômes
- Conteneur `odysseus-odysseus-1` : Up 7h, CPU 102.56%, MEM 385 MiB (stable)
- Processus `uvicorn` PID 1 : **95.6% CPU**, TIME 07:09:10 sur ~7h uptime
- Swap système : **100% utilisé** (2.0 GiB / 2.0 GiB)
- Logs : vides depuis 5+ min, pas d'erreur visible en stdout/stderr

## Environnement
- Image : Dockerfile custom basé sur python:3.12-slim
- ASGI : uvicorn lancé directement (`CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7000"]`)
- Flag `ODYSSEUS_INPROCESS_POLLERS=1` (poller email in-process, pas worker externe)
- Base : SQLite dans `/app/data/` (WAL non activé)

## Commandes de diagnostic utilisées

```bash
# État conteneur
docker stats odysseus-odysseus-1 --no-stream
# → CPU 102.56%, MEM 385 MiB, 26 PIDs

docker exec odysseus-odysseus-1 ps -eo pid,ppid,%cpu,%mem,time,comm --sort=-%cpu
# → PID 1 uvicorn 95.6% CPU, TIME 07:09:10 (quasi-égal à l'uptime conteneur)

# Logs récents
docker logs --since=5m odysseus-odysseus-1 2>&1 | head -50
# → Aucune sortie (silence total)

# Variables d'environnement
docker exec odysseus-odysseus-1 env | grep -iE "poll|email|imap"
# → ODYSSEUS_INPROCESS_POLLERS=1 (seul match)
```

## Accès bloqué (contrainte utilisateur)
- `docker exec ... find /app/data/*.db` → **BLOCKED** par l'utilisateur (non-consenti)
- `docker exec ... ss -tulpn` → `ss` absent de l'image
- `docker exec ... netstat -tulpn` → `netstat` absent de l'image

**Leçon** : Lire le code source depuis le checkout host (`/home/gibson/odysseus/`) plutôt que d'insister sur `docker exec` quand les outils réseau sont absents.

## Analyse code source (host checkout)

### Fichiers clés lus
- `routes/email_pollers.py` (~50 lignes sur ~1100) : poller IMAP sans circuit breaker
- `src/task_scheduler.py` (~300 lignes sur 2323) : boucle `_loop()` avec `sleep_for = max(1.0, min(60.0, delta))`
- `app.py` : uvicorn mono-process, pas de workers

### Patterns problématiques trouvés
1. **Poller IMAP retry sans backoff** — connexion `127.0.0.1:1143` (port apparemment erroné ou mock) échoue, le poller attend 30-60s et relance un nouveau `asyncio.create_task()`
2. **API Mistral 401** — clé API expirée/invalide dans le pipeline `auto_summarize`, pas d'abort rapide avec compteur de retry
3. **SQLite sans WAL** — journal mode `DELETE` par défaut, contention entre le scheduler (lecture `next_run` chaque seconde) et les pollers (écriture logs/status)
4. **`next_run` pas avancé sur échec** — dans `_execute_task_locked`, si le task runner plante avant l'update `next_run`, la tâche redevient `due` immédiatement et est redispatchée

## Causes racine

| Priorité | Cause | Impact | Fix |
|----------|-------|--------|-----|
| P0 | Boucle retry poller IMAP sans circuit breaker | CPU 99%, famine asyncio | Abort après 3 échecs consécutifs, backoff exponentiel |
| P1 | Port IMAP incorrect (127.0.0.1:1143) | Échec systématique | Configurer `imap.gmail.com:993` + TLS |
| P1 | Clé Mistral 401 | Échec LLM, pas de fallback | Renouveler clé ou désactiver `auto_summarize` |
| P2 | SQLite sans WAL | Contention silencieuse | `PRAGMA journal_mode=WAL` |
| P2 | `ODYSSEUS_INPROCESS_POLLERS=1` | Polling dans le process ASGI | Externaliser dans un worker séparé ou ajouter `min_interval` entre runs |

## Sortie recommandée
1. Ne PAS redémarrer le conteneur immédiatement (perte des données zombie-task)
2. Corriger la config IMAP + API Mistral
3. Ajouter circuit breaker dans `email_pollers.py`
4. Activer WAL SQLite
5. Redémarrer proprement
