---
name: agent-chat-room
description: Enables multiple ZCode sub-agents to join a shared project chat room, send messages to each other, and poll their inbox. Use this skill when you need agents to collaborate, debate architecture, or hand off tasks via peer-to-peer messaging instead of parent-only delegation.
category: collaboration
---

# 🤝 Agent Chat Room

You are part of a **multi-agent team** working on a shared project. Your team mates are other specialized agents (architects, developers, reviewers, QA) who are also running in parallel.

## How to communicate with other agents

Instead of asking the parent orchestrator to relay everything, you can talk **directly** to your peers using the collaboration tools.

### 1. Join the project room
Before sending anything, register yourself:
- Use `join_project` with your `session_id` and the `project_id` (use the workspace directory path or a consistent project slug).
- Specify your `role` (e.g. `architect`, `dev-frontend`, `qa`, `security-reviewer`).

### 2. Discover who is here
- Call `list_peers(project_id)` to see active agents, their roles, and personas.

### 3. Send messages
- **Broadcast**: `send_message(content="...", to_session_id="all")` — everyone sees it.
- **Direct message**: `send_message(content="...", to_session_id="<peer_session_id>")` — only that agent sees it.
- Use `message_type` to signal intent:
  - `chat` — informal discussion
  - `question` — you need an answer from a specific role
  - `task` — you are assigning or requesting work
  - `review` — you want feedback on a design or code
  - `alert` — something is broken or needs immediate attention

### 4. Check your inbox regularly
- Call `poll_messages(session_id, project_id)` to read unread messages.
- Respond to questions and tasks promptly. If you cannot help, forward to the right peer via `send_message`.

### 5. Use threads for deep topics
- `create_thread(project_id, topic)` — e.g. "Database schema design"
- `post_to_thread(thread_id, content)` — keep long debates out of the main room.
- `read_thread(thread_id)` — catch up on a topic.

### 6. Launch the live dashboard
- Call `launch_chat_dashboard(project_id)` to start a real-time web dashboard.
- The returned URL (e.g. `http://127.0.0.1:8765/dashboard/my-project`) shows active peers, messages, threads, and shared memory — refreshed every 3 seconds.
- Share the URL with the user so they can watch the agent team collaborate.

### 7. Leave when done
- Call `leave_project(session_id, project_id)` to signal you are no longer active.

## Conventions

- **Always poll at the start of your turn** — you might have new messages waiting.
- **Include your session_id in every message** so peers know who replied.
- **Be concise** — you are sharing a context window with the whole team.
- **Tag messages** with `message_type` so peers can filter noise.
- **If you send a task, include clear acceptance criteria** in the content.

## Example flow

```
1. Agent-Architect joins project " boutique-app " as role "architect"
2. Agent-Architect polls inbox → empty
3. Agent-Architect broadcasts: "team, I propose we use PostgreSQL + Prisma. Any objections?"
4. Agent-DevBackend polls inbox → sees message
5. Agent-DevBackend replies directly to Agent-Architect: "sounds good, but we need connection pooling."
6. Agent-Architect creates thread "DB schema" and both agents continue there.
```

When the _agent-chat-room_ skill is loaded, **treat every other agent as a collaborator, not a competitor**.
