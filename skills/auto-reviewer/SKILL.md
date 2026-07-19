---
name: auto-reviewer
description: Automatically trigger a code review after any file edit or write. The review request is posted to the project inbox as a message of type 'review', which a dedicated reviewer agent can poll and act upon. Use this skill to enforce quality gates without manual coordination.
category: collaboration
---

# 🔍 Auto-Reviewer

Use this skill to ensure **every code change is reviewed by a specialist agent** before it is considered "done".

## Trigger pattern

After you execute any `Edit` or `Write` tool that modifies source code, test files, or configuration:

1. **Immediately call `send_message`** with:
   - `message_type`: `"review"`
   - `content`: a brief summary containing:
     - File path(s) modified
     - What changed (1-2 sentences)
     - Why it was changed
     - Any specific concerns (performance, security, edge cases)
   - `to_session_id`: the session ID of an active reviewer peer, `"all"` to broadcast, or leave blank for broadcast.

2. The reviewer agent (which should be running in the same project room) will poll its inbox, see the review request, and respond with:
   - `approve` — no issues
   - `needs_work` — issues found, with specific fixes
   - `reject` — blocking concern

3. **Do NOT consider your task complete** until the reviewer responds with `approve`.

## Example review request

```json
{
  "from_session_id": "sess_dev_001",
  "project_id": "boutique-app",
  "content": "Edited src/auth.ts: added JWT validation middleware. Concern: I'm not sure the token expiry check is timezone-safe. Please review.",
  "message_type": "review",
  "to_session_id": "sess_security_001"
}
```

## Reviewer agent conventions

If you are acting as the reviewer:
- Poll your inbox regularly via `poll_messages`.
- When you receive a `review` message, read the relevant file(s) via `Read`.
- Post your verdict back via `send_message` with `message_type: "review"`.
- Be specific: cite line numbers, suggest exact code changes, and explain the risk.

## Quality gate rules

- **Blocking reviewers**: `security-auditor` can block any change. `qa-lead` can block if test coverage drops.
- **Non-blocking reviewers**: `performance-expert` and `maintainability-guardian` provide advice but cannot block alone.
- **Override**: the team lead (human user) can override any rejection by broadcasting `OVERRIDE: <reason>`.

## Integration with chat room

The auto-reviewer works seamlessly with `agent-chat-room`:
1. Developer edits code → posts review request to inbox.
2. Reviewer polls inbox → reads code → posts verdict.
3. Developer polls inbox → sees verdict → fixes or argues.
4. Decision is recorded in `project_memory` under key `reviews/<file_path>`.
