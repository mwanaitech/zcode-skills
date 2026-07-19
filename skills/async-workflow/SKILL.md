---
name: async-workflow
description: Launch long-running agents that work in the background and notify the parent when they finish. The parent does not block — it continues its own work and polls the inbox periodically for task-completed messages from its children.
category: collaboration
---

# ⏳ Async Workflow

Use this skill when you want to **delegate a long task to a sub-agent without pausing your own work**.

## Problem

By default, spawning a sub-agent with the `Agent` tool blocks the parent until the child returns. This wastes context window and time when the child runs for many minutes.

## Solution

Instead, use **cooperative async delegation** via the chat room:

### Step 1 — Delegate via inbox, not `Agent` tool
When you need async work, call `send_message` with:
- `message_type`: `"task"`
- `content`: a detailed brief with acceptance criteria and deadline
- `to_session_id`: the target agent's session ID (or `"all"` if you don't care who picks it up)

### Step 2 — The worker agent picks up the task
The target agent polls its inbox (`poll_messages`), reads the task, and replies with:
- `message_type`: `"task"` and content: `ACK: accepted <task_id>`

### Step 3 — Parent continues its own work
The parent does **not** wait. It continues doing other things (planning, coding, coordinating other agents).

### Step 4 — Worker reports back
When the worker finishes, it calls `send_message` with:
- `message_type`: `"task"`
- `content`: `DONE: <summary of results>` + any relevant file paths or memory keys

### Step 5 — Parent collects results
The parent calls `poll_messages` periodically (e.g. every 3-5 turns) to check for completed tasks.

## Example

```
Parent:
  send_message(to="sess_worker_001", type="task",
               content="Refactor auth.ts to use strategy pattern. Acceptance: all tests pass, no regressions.")
  → continues implementing the shopping cart

Worker (sess_worker_001):
  poll_messages → sees task
  → replies ACK
  → works for 15 minutes
  → replies DONE + summary

Parent (10 minutes later):
  poll_messages → sees DONE
  → reads the refactored file
  → runs tests
```

## Tips

- Use `project_memory_write` to store intermediate results so the parent can peek without waiting.
- Set expectations in the task brief: "report back in 10 minutes max".
- If a worker goes silent, the parent can broadcast a ping: `STATUS: sess_worker_001 ?`
- Combine with `check_async_results` (an MCP tool alias) to filter only task-completed messages.

## Limitations

- This is **cooperative**, not true OS-level background. The worker is a normal ZCode session running on its own turn loop. It just doesn't block the parent.
- If the worker crashes, the parent won't know until it polls. Mitigate by setting a timeout and checking `list_peers`.
