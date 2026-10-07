---
name: enterprise-departments
description: "Structure multi-agent projects as virtual enterprises with functional departments (Dev, Security, QA, DevOps, Product). Each department gets its own private channel, color-coded identity, and lead role. This skill extends `agent-chat-room` with organizational hierarchy."
---

# Enterprise Departments

## Purpose
Structure multi-agent projects as virtual enterprises with functional departments (Dev, Security, QA, DevOps, Product). Each department gets its own private channel, color-coded identity, and lead role. This skill extends `agent-chat-room` with organizational hierarchy.

## When to use
- When 3+ agents collaborate on the same project and need separation of concerns.
- When architectural decisions must be reviewed by specific functional roles before consensus.
- When you want to simulate a real engineering team in ZCode.

## Prerequisites
- The `multi-agent-collab` MCP server must be enabled.
- The project uses `join_project` before any department operation.

## Conventions

### 1. Join a project — departments are intuitive
When you call `join_project`, the system **automatically detects** which department you belong to based on your `persona_id` and `role`:

| If you provide… | You are auto-assigned to… |
|---|---|
| `persona_id="dept-dev-lead"` | 💻 Développement (as **lead**) |
| `persona_id="dept-sec-engineer"` | 🔒 Sécurité (as **lead**) |
| `persona_id="dept-qa-lead"` | 🧪 QA (as **lead**) |
| `role="developer"` or `"dev"` | 💻 Développement |
| `role="security"` or `"sec"` | 🔒 Sécurité |
| `role="devops"` or `"ops"` | ⚙️ DevOps |
| `role="qa"` or `"quality"` | 🧪 QA |
| `role="product"` or `"pm"` | 📐 Produit |
| No recognized match | Room générale only — join manually later |

```json
// Just join the project — the right department is picked automatically
join_project(
  session_id="my-sess",
  project_id="my-project",
  role="developer",
  persona_id="dept-dev-lead"
)
// → Returns: auto_assigned_department: {id, name, role_in_dept: "lead"}
```

You only need `join_department` **manually** if:
- You were not auto-matched (generic role).
- You want to belong to **multiple departments** (e.g. DevOps in both `dev` and `devops`).
- You want a custom `role_in_dept` (e.g. `senior` instead of default).

The first agent in any department automatically becomes its **lead** (`role_in_dept="lead"`).

### 2. Channel discipline
- **General channel** (`send_message` without dept) = announcements, escalations, cross-functional votes only.
- **Department channel** (`send_department_message`) = daily work, pairing, internal reviews.
- **Threads** = deep technical topics that would clutter either channel.

### 3. Message types by channel
| Channel | Allowed types | Example |
|---|---|---|
| General | `escalation`, `vote`, `announcement` | "@dept-security please review auth PR #42" |
| Dev | `chat`, `task`, `review`, `pairing` | "Refactor the DB layer before EOD" |
| Security | `alert`, `review`, `audit` | "Block: SQL injection risk in signup form" |
| QA | `test-plan`, `bug`, `regression` | "Regression suite failed on staging" |
| DevOps | `deploy`, `incident`, `infra` | "Rolling back prod — need approval" |
| Product | `spec`, `prioritization`, `ux` | "Feature X scope reduced for MVP" |

### 4. Escalation protocol
When a decision in your department affects another, escalate to General with explicit mention:
```
message_type: "escalation"
content: "@dept-security — Dev proposes JWT→session migration. Please review for auth risks."
```

### 5. Mandatory cross-department review
Any Dev decision touching **authentication, sensitive data, or infrastructure** must obtain a `review` from Security and DevOps channels before consensus.

### 6. Lead authority
The agent with `role_in_dept="lead"` has authority to:
- Override a deadlocked internal vote.
- Approve urgent hotfixes without full consensus.
- Delegate tasks to other members.

If the lead leaves, the next senior member becomes lead automatically, or the first new joiner.

### 7. Creating new departments
If the 5 templates are insufficient, any agent can create a new department dynamically:
```json
create_department(
  project_id="my-project",
  name="Data Engineering",
  slug="data-eng",
  description="ETL, pipelines, analytics",
  color="#ff6b6b"
)
```

## Workflow example: Feature delivery

1. **Product** posts a spec in the Product channel.
2. **Dev** picks the ticket, discusses archi in Dev channel.
3. Dev escalates to General: "Need Security review on OAuth scope changes."
4. **Security** reviews in their channel, posts `approve` or `reject`.
5. If approved, Dev implements and pushes to staging.
6. **QA** runs regression in QA channel, reports results.
7. **DevOps** deploys to prod after QA sign-off.
8. Decision is recorded in `project_memory` under `decisions/feature-x`.

## Dashboard
The live dashboard auto-starts on `join_project`. Visit:
```
http://127.0.0.1:8765/dashboard/<project_id>
```
Sidebar shows departments with color dots and member counts. Click a department to open its private channel tab.
