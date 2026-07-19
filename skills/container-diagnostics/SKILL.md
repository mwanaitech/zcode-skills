---
title: Container Diagnostics
name: container-diagnostics
description: Diagnostic rapide des environnements Docker Compose - identification des CPU spikes, crash-loop, services non configurees, et analyse ciblee des logs.
trigger:
  - docker cpu high
  - container crash
  - docker health check
  - container restart loop
  - service not responding
  - investigate container
  - docker logs analysis
  - container resource usage
---

# Container Diagnostics

Diagnostic rapide d'un environnement Docker Compose (ou standalone) quand un service consomme trop de ressources, tombe, ou montre un comportement anormal.

## Workflow : CPU spike sur un container

**1. Overview rapide**
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**2. Attribution processus interne**
```bash
# Depuis l'hote
docker top <container> -eo pid,pcpu,pmem,comm,args | sort -k2 -nr | head -10

# Ou depuis dans le container
docker exec <container> ps aux | sort -nr | head -10
```

**3. Historique de restart**
```bash
docker inspect --format='{{.Name}} {{.RestartCount}} restarts' $(docker ps -q) | tr -d '/'
```
Zero restart = le container n'a jamais crash. 10+ restarts = loop probable.

**4. Analyse des logs ciblee**

Compter un pattern precis :
```bash
docker logs --tail 200 <container> 2>&1 | grep -c "GET /api/skills"
```

Filtrer le bruit pour voir les vraies erreurs :
```bash
docker logs --tail 1000 <container> 2>&1 | grep -v "GET /api/skills" | tail -30
```

Rechercher les methodes actives (POST/PUT/DELETE) :
```bash
docker logs --tail 500 <container> 2>&1 | grep -E "(POST|PUT|DELETE|crawl|scrape|task|job|worker)" | tail -20
```

**5. Identifier le client**
Dans un setup Docker Compose, `172.18.0.1` (ou le subnet du reseau bridge) est le gateway = l'hote ou un reverse proxy qui fait les requetes. Si toutes les requetes viennent de la, le probleme est probablement un frontend/browser ou un autre container intermediaire.

## Workflow : service non fonctionnel (mail, DB, API externe)

**1. Verifier que le process tourne**
```bash
docker exec <container> ps aux | grep <service>
```

**2. Verifier les logs d'erreur de connexion**
```bash
docker logs --tail 100 <container> 2>&1 | grep -iE "(error|warn|fail|refused|timeout|not configured)"
```

**3. Verifier la config manquante**
Typiquement : `SMTP not configured`, `IMAP not configured`, `DATABASE_URL not set`.
Souvent dans les variables d'env du compose ou dans l'interface web du service.

## References

- `references/container-quirks.md` — Edge cases et specificites par service (Odysseus, SearXNG, etc.)

## Signaux cles a surveiller

| Signal | Interpretation |
|---|---|
| CPU > 80% sur uvicorn/gunicorn | Spam de requetes ou endpoint lent |
| CPU > 80% sur un worker unique | Tache bloquante sans async |
| 0 restarts + CPU haut | Le container est sain mais surcharge — pas un crash |
| N restarts > 0 | Le service crash-loop. Voir `docker logs` juste apres le demarrage |
| `Connection refused` | Service cible down ou mauvais port/host |
| `not configured` | Variables d'environnement ou settings UI manquants |
| 404 sur assets statiques | Fichiers manquants au build ou mauvais `WORKDIR` |
