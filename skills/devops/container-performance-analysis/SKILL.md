---
name: container-performance-analysis
description: Diagnose runaway CPU, memory pressure, and silent async loops inside Docker containers running Python/FastAPI/ASGI workloads.
title: Container Performance Analysis
trigger:
  - container CPU high
  - docker CPU 100%
  - python asyncio loop
  - uvicorn CPU usage
  - fastapi container slow
  - scheduled task zombie
  - poller retry loop
  - docker stats high CPU
  - memory swap full container
internal: false
---

# Container Performance Analysis

Diagnose runaway CPU, memory pressure, and silent async loops inside Docker containers running Python/FastAPI/ASGI workloads.

## 1. Quick health snapshot (non-intrusive)

Always start with read-only commands. The user may block `find`/`ls` inside `/app` as intrusive.

```bash
docker stats <container> --no-stream
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Look for:
- **CPU% >> 100** with **TIME+ >> uptime** → busy loop (not just burst)
- **MEM% stable but SWAP 100%** → memory pressure, OOM risk
- **PORTS empty or loopback-only** → check if binds are correct

## 2. Identify the hot process

```bash
docker exec <container> ps -eo pid,ppid,%cpu,%mem,time,comm --sort=-%cpu
```

- `uvicorn` or `python` at top with **TIME near container uptime** → async event-loop starvation
- Multiple `python` children with small CPU each → worker pool overload
- `ps` itself high → container just started, ignore

## 3. Inspect recent logs (last 5 min window)

```bash
docker logs --since=5m <container> 2>&1 | tail -50
docker logs --since=5m <container> 2>&1 | grep -iE "error|exception|traceback|fail|timeout" | head -20
```

**Pitfall**: Empty logs do NOT mean the app is idle. A silent `while True` with no logging produces zero output but burns CPU. Proceed to code inspection.

## 4. Read source from host (never rely solely on exec)

If the container image is built from a local repo, read files directly from the host checkout:

```bash
read_file path=/host/repo/src/task_scheduler.py
search_files path=/host/repo pattern="while True|_loop|asyncio.create_task|poll|retry"
```

Key patterns that cause runaway CPU:

| Pattern | File clues | Fix direction |
|---------|-----------|---------------|
| `while self._running:` with `sleep(1)` or no sleep | scheduler, poller, worker | Add adaptive sleep or use `asyncio.Event` |
| Retry loop without backoff | `except Exception: continue` | Exponential backoff + circuit breaker |
| `next_run` not advanced on failure | DB task scheduler | Always update `next_run` before releasing lock |
| New task created on every error | `create_task()` inside except | Guard with `if not already_running` |
| SQLite `busy timeout` missing / no WAL | `database.py`, `.db` path | Enable `PRAGMA journal_mode=WAL` |

## 5. Check environment & external dependencies

```bash
docker exec <container> env | grep -iE "imap|smtp|api_key|url|poll|retry"
```

Common mis-configurations that trigger retry storms:
- **IMAP** host set to `127.0.0.1:1143` instead of provider endpoint + TLS port
- **API key** expired → 401 on every request, no abort
- **Database** connection string pointing to internal DNS that resolves but refuses
- `ODYSSEUS_INPROCESS_POLLERS=1` or similar flag forcing in-process polling instead of external worker

## 6. Database / scheduler inspection (when accessible)

If the app exposes a task/scheduler table (SQLAlchemy, Celery, APScheduler):

- Query `scheduled_task` rows where `status='active'` AND `next_run < now()`
- Count rows per minute bucket to find clusters
- Check `task_run` for rows stuck `running` or `queued` since container start → zombie runs

## 7. Decision tree

```
CPU high + TIME ≈ uptime
  └─ Logs show repeated error? → Fix config (IMAP/API key/DB)
  └─ Logs empty or silent? → Read scheduler/poller code, find while-True or retry loop
  └─ Process is uvicorn + single thread? → Async loop starvation, inspect event loop queue

CPU high + TIME << uptime
  └─ Burst workload or request spike → Scale workers, check queue depth

MEM high + SWAP full
  └─ Memory leak → Profile with tracemalloc / memray
  └─ Legitimate load → Add RAM or enable swap limits
```

## Pitfalls

- **Do NOT** run `find /app` or database writes inside the container without explicit user consent; treat them as potentially destructive.
- **Do NOT** assume empty logs = healthy app. Silent tight loops exist.
- **Do NOT** restart the container before capturing `docker stats` + `ps` output; a restart wipes zombie-task evidence.
- SQLite default journal mode = `DELETE`. Without WAL, frequent reads from scheduler + writes from pollers cause `BUSY` contention that manifests as CPU spin (busy-wait retry).
