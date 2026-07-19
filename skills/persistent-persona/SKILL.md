---
name: persistent-persona
description: Register and activate reusable agent personas (roles) that persist across sessions. A persona bundles a system prompt, preferred model, allowed tools, and accumulated memory so every agent spawned with that persona starts with consistent identity and learned context.
category: collaboration
---

# 🎭 Persistent Persona

Use this skill to create **specialized, reusable agent identities** that survive beyond a single chat session.

## What is a persona?

A persona is a registered profile that defines:
- **Name** — human-readable label (e.g. `security-auditor`, `react-architect`)
- **System prompt** — the identity injected into every agent using this persona
- **Model preference** — which LLM best suits this role
- **Tools allowlist** — which tools this persona is trusted to use
- **Memory** — accumulated learnings, conventions, and preferences over time

## When to use personas

- You spawn the same type of specialist agent repeatedly (e.g. a security reviewer).
- You want agents to **remember** past reviews, style guides, or team conventions.
- You need strict role boundaries (e.g. `qa` should not edit production code directly).

## How to register a persona

Call `register_persona` with:
```json
{
  "id": "security-auditor",
  "name": "Security Auditor",
  "system_prompt": "You are a paranoid security auditor...",
  "model_preference": "claude-sonnet-4",
  "tools_allowlist": "[\"Read\",\"Grep\",\"Bash\"]",
  "memory_json": "{\"owasp_top_10\":true,\"team_rule\":\"never trust user input\"}"
}
```

## How to activate a persona

Before spawning a sub-agent:
1. Call `get_persona(id)` to load the profile.
2. Pass the persona's `system_prompt` into the sub-agent's prompt.
3. Pass the `model_preference` if you want to override the default model.
4. Pass the `tools_allowlist` to restrict what the agent can do.
5. After the sub-agent finishes, call `register_persona` again with updated `memory_json` to save anything new it learned.

## Persona memory updates

When a persona-bearing agent finishes work, the parent should:
1. Read the agent's final message.
2. Extract any new conventions, lessons, or rules discovered.
3. Merge them into the persona's `memory_json`.
4. Call `register_persona` with the updated memory.

## Example personas to register

| ID | Role | Model | Key rules |
|---|---|---|---|
| `architect` | System designer | claude-opus | No implementation details in design docs |
| `dev-backend` | Backend implementer | qwen-coder | Follow existing patterns; ask architect for ambiguity |
| `dev-frontend` | UI implementer | claude-sonnet | Match Figma exactly; responsive-first |
| `security-auditor` | Security reviewer | claude-opus | Block on any OWASP Top 10 risk |
| `qa-lead` | Test strategist | qwen-coder | 80% coverage minimum; integration > mocks |
| `performance-expert` | Performance engineer | deepseek-v4 | Profile first, optimize second |

## Conventions

- **Persona IDs should be kebab-case** and stable across projects.
- **Each agent can only activate ONE persona at a time**.
- **Persona memory is append-only** — never delete old lessons; overwrite only when correcting a false rule.
- **Sensitive personas** (e.g. `deploy-gatekeeper`) can be restricted in `tools_allowlist` to prevent destructive actions.
