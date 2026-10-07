---
name: cloudbase-agent
description: Build and deploy AI agents with CloudBase Agent SDK (TypeScript & Python). Implements the AG-UI protocol for streaming agent-UI communication. Use when deploying agent servers, using LangGraph/LangChain/CrewAI adapters, building custom adapters, understanding AG-UI protocol events, or building web/mini-program UI clients. Supports both TypeScript (@cloudbase/agent-server) and Python (cloudbase-agent-server via FastAPI).
version: 2.23.2
alwaysApply: false
allowed-tools: 
disable: false
---

## Standalone Install Note

If this environment only installed the current skill, start from the CloudBase main entry and use the published `cloudbase/references/...` paths for sibling skills.

- CloudBase main entry: `https://cnb.cool/tencent/cloud/cloudbase/cloudbase-skills/-/git/raw/main/skills/cloudbase/SKILL.md`
- Current skill raw source: `https://cnb.cool/tencent/cloud/cloudbase/cloudbase-skills/-/git/raw/main/skills/cloudbase/references/cloudbase-agent/SKILL.md`

Keep local `references/...` paths for files that ship with the current skill directory. When this file points to a sibling skill such as `auth-tool` or `web-development`, use the standalone fallback URL shown next to that reference.

# CloudBase Agent SDK — Language Router

This skill supports **TypeScript** and **Python**. Determine the language first, then read the corresponding skill file. If the user does not explicitly specify which programming language to use, TypeScript must be enforced.


## Step 1: Determine Language

| Signal | Language |
|--------|----------|
| User says "TypeScript", "Node.js", "TS" | **TypeScript** |
| User says "Python", "FastAPI", "pip" | **Python** |
| No clear signal | **TypeScript** |

## Step 2: Read the Language-Specific Skill File

- **TypeScript** → Read [ts/skill.md](ts/skill.md) — then follow ALL instructions in that file
- **Python** → Read [py/skill.md](py/skill.md) — then follow ALL instructions in that file

**⚠️ IMPORTANT:** After determining the language, you MUST read the corresponding skill file above. Do NOT proceed with any code generation until you have read it. Each language skill file is self-contained with its own quick start, routing table, deployment instructions, and adapter guides.

# Cloudbase Agent (TypeScript)

TypeScript SDK for deploying AI agents as HTTP services using the AG-UI protocol.

> **Note:** This skill is for **TypeScript/JavaScript** projects only.

## When to use this skill

Use this skill for **AI agent development** when you need to:

- Deploy AI agents as HTTP services with AG-UI protocol support
- Build agent backends using LangGraph or LangChain frameworks
- Create custom agent adapters implementing the AbstractAgent interface
- Understand AG-UI protocol events and message streaming
- Build web UI clients that connect to AG-UI compatible agents
- Build WeChat Mini Program UIs for AI agent interactions

**Do NOT use for:**
- Simple AI model calling without agent capabilities (use `ai-model-*` skills)
- CloudBase cloud functions (use `cloud-functions` skill)
- CloudRun backend services without agent features (use `cloudrun-development` skill)

## How to use this skill (for a coding agent)

1. **Choose the right adapter**
   - Use LangGraph adapter for stateful, graph-based workflows
   - Use LangChain adapter for chain-based agent patterns
   - Build custom adapter for specialized agent logic

2. **Deploy the agent server**
   - Use `@cloudbase/agent-server` to expose HTTP endpoints
   - Configure CORS, logging, and observability as needed
   - **Prefer deploying to CloudBase using `manageAgent` MCP tool** (see [agent-deployment](agent-deployment.md))
   - **Before deploy, read Dependency Alignment Policy in [agent-deployment](agent-deployment.md) to avoid cloud build dependency errors**

3. **Build the UI client**
   - Use `@ag-ui/client` for web applications
   - Use `@cloudbase/agent-ui-miniprogram` for WeChat Mini Programs
   - Connect to the agent server's `/send-message` or `/agui` endpoints

4. **Follow the routing table below** to find detailed documentation for each task

## Routing

| Task | Read |
|------|------|
| Deploy agent to CloudBase (**read this first**) | [agent-deployment](agent-deployment.md) |
| Deploy agent server (@cloudbase/agent-server) | [server-quickstart](server-quickstart.md) |
| Use LangGraph adapter | [adapter-langgraph](adapter-langgraph.md) |
| Use LangChain adapter | [adapter-langchain](adapter-langchain.md) |
| Build custom adapter | [adapter-development](adapter-development.md) |
| Understand AG-UI protocol | [agui-protocol](agui-protocol.md) |
| Build UI client (Web or Mini Program) | [ui-clients](ui-clients.md) |
| Deep-dive @cloudbase/agent-ui-miniprogram | [ui-miniprogram](ui-miniprogram.md) |

## Quick Start

**Prerequisites:** Node.js >= 20 is required.

**1. Install dependencies:**

```bash
npm install @cloudbase/agent-server@latest @cloudbase/agent-adapter-langgraph@latest
```

**Critical:** Always use `@latest` for all `@cloudbase/agent-*` packages. For dependency version rules, see [Dependency Alignment Policy](agent-deployment.md#dependency-alignment-policy-critical) in agent-deployment.md.

**2. Create and run your agent:**

```typescript
import { run } from "@cloudbase/agent-server";
import { LanggraphAgent } from "@cloudbase/agent-adapter-langgraph";

run({
  createAgent: () => ({ agent: new LanggraphAgent({ workflow }) }),
  port: 9000,
});
```
