---
name: consensus-vote
description: Launch a structured consensus vote among multiple sub-agents using the collaboration inbox. Spawns specialized voter personas in parallel, collects their verdicts, tallies the result, and writes the binding decision into shared project memory.
category: collaboration
---

# 🗳️ Consensus Vote

Use this skill when a critical architectural or design decision needs **collective agreement** from multiple specialist agents.

## When to use consensus voting

- Choosing between two tech stacks (REST vs GraphQL, SQL vs NoSQL)
- Deciding on a database schema that affects multiple services
- Approving a major refactor or breaking API change
- Security design reviews
- Any decision where a single agent might have blind spots

## Pre-registered voter personas (use these IDs)

| Persona ID | Specialty | Typical stance |
|---|---|---|
| `voter-performance` | Speed, throughput, resource use | Blocks high-latency proposals |
| `voter-security` | Security, auth, data leaks | Blocks anything with OWASP risk |
| `voter-maintainability` | Readability, testability, debt | Blocks over-complex solutions |
| `voter-ops` | Deployability, observability, cost | Blocks unmonitored changes |

Load them with `get_persona(id)` before spawning voters.

## Executable Protocol

### Step 1 — Define the proposal
Write a clear proposal and post it to the project inbox (broadcast). Include:
- **Context** — why this decision is needed
- **Options** — A, B, (C…)
- **Decision criteria** — ranked by importance
- **Deadline** — e.g. "respond within 5 minutes"

Example broadcast:
```
send_message(
  from_session_id="<parent_session_id>",
  project_id="<project_id>",
  content="PROPOSAL: Use PostgreSQL (Option A) vs MongoDB (Option B) for the main data store.\nContext: we need ACID transactions and complex joins.\nCriteria: (1) data integrity, (2) query flexibility, (3) ops overhead.\nPlease vote: approve / needs_work / reject. Justify in 1-2 sentences.",
  message_type="task",
  to_session_id="all"
)
```

### Step 2 — Spawn voters in parallel
Use the `Agent` tool (native ZCode subagent dispatch) to spawn 3–4 voters **concurrently**. Each voter:
1. Calls `join_project` with its persona ID.
2. Polls inbox for the proposal via `poll_messages`.
3. Reads relevant `project_memory` if needed.
4. Casts its vote via `send_message` with `message_type="review"`:
   - `vote: "approve"` — fully supports
   - `vote: "reject"` — opposes, must explain why
   - `vote: "needs_work"` — supports direction but requires specific changes

Each voter's reply must include:
```
VERDICT: <approve|reject|needs_work>
JUSTIFICATION: <2-3 sentences>
CONDITIONS: <only if needs_work — what would flip your vote>
```

### Step 3 — Collect votes
The parent polls its inbox (`poll_messages`) and waits until:
- All voters have responded, OR
- A timeout expires (e.g. 5 minutes)

### Step 4 — Tally
Count the `VERDICT` lines in each voter's message:

| Outcome | Rule | Action |
|---|---|---|
| **Unanimous approve** | All voters `approve` | Binding. Write to `project_memory`. |
| **Majority approve** (≥60%) | Most voters `approve`, no `reject` | Binding unless a `needs_work` cites blocking risk. |
| **Majority `needs_work`** | Most voters want changes | Postpone. Synthesize conditions, revise proposal, restart Step 2. |
| **Any `reject` + blocking concern** | A voter cites security/data-loss/legal risk | Decision **blocked**. Record in `project_memory` and explore alternatives. |
| **任何 `reject`** | Simple disagreement without blocking concern | Count as `needs_work` unless the rejection is well-justified. |

### Step 5 — Record the decision
Write the final decision into `project_memory`:
```json
{
  "key": "decisions/<slug>",
  "value_json": {
    "proposal": "...",
    "outcome": "approved | rejected | postponed",
    "votes": {
      "voter-performance": "approve",
      "voter-security": "needs_work",
      ...
    },
    "summary": "Approved with conditions: add input sanitization (security voter).",
    "escalation_path": "If load exceeds 1000 req/s, reconsider CQRS.",
    "timestamp": "2026-07-10T12:00:00Z"
  }
}
```

## Quick-start template

If the user says "let's vote on this", execute:

1. `get_persona` for each voter you need (performance, security, maintainability, ops).
2. Broadcast the proposal.
3. Spawn 3–4 `Agent` calls in **parallel** (same message), each with `subagent_type: general-purpose` and the voter persona prompt injected.
4. Poll for results.
5. Tally and record.

## Voting etiquette

- **No lobbying** — voters must decide independently; do not reveal other votes before everyone has cast.
- **Explain rejections** — a `reject` without justification is invalid and should be ignored.
- **Conditions, not complaints** — `needs_work` must state exactly what would change your vote.
- **Respect the tally** — once consensus is reached, all agents commit to the decision even if they personally preferred another option.
