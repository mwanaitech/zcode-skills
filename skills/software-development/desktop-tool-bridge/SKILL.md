---
name: desktop-tool-bridge
description: Architecture and implementation patterns for wrapping desktop-first CLI tools into OpenAI-compatible API endpoints for agentic frameworks.
trigger: bridge desktop tool OR connect desktop app to api OR wrap cli as api OR desktop tool api proxy
---

# Desktop Tool Bridge (DTB)

When a tool is designed primarily for human interaction via a Desktop GUI (e.g., Kiro, Cursor, specialized IDEs) but provides a CLI, it often lacks a network-accessible API. This skill provides the pattern to build a local "Bridge" that translates standard agentic requests (OpenAI-compatible) into CLI commands.

## 🏗️ Architecture Pattern

The Bridge acts as a **Local Proxy Server** (typically using FastAPI) that sits between the Agent (Hermes) and the Desktop Tool.

### Core Components

1.  **The API Layer (FastAPI)**: Exposes standard endpoints:
    *   `POST /v1/chat/completions`: For LLM/Chat interaction.
    *   `GET /v1/models`: To list available models/aliases.
2.  **The Request Queue (Concurrency Control)**: 
    *   **CRITICAL**: Most desktop CLIs are stateful or single-instance. The Bridge **MUST** use an asynchronous lock (`asyncio.Lock`) to serialize all CLI calls. Concurrent calls will corrupt settings or session state.
3.  **The Translation Engine (CLI Wrapper)**:
    *   Converts JSON payloads into command-line arguments (e.g., `tool chat --no-interactive "prompt"`).
    *   Handles "Model Selection" by executing setup commands before the chat (e.g., `tool settings chat.defaultModel <alias>`).
    *   Capt-ures `stdout` and converts it into a structured JSON response.
4.  **Security Layer**: Implements a `Shared_Secret` (Bearer Token) to prevent unauthorized local processes from consuming credits.

## 🛠️ Implementation Steps

### 1. Environment Setup
*   Identify the CLI command (e.g., `kiro`).
*   Ensure the CLI is in the system PATH or provide an absolute path.
*   Identify if a `headless` or `--no-interactive` flag is required.

### 2. Python Implementation (FastAPI)
*   Use `asyncio.create_subprocess_exec` to run the CLI without blocking the event loop.
*   Implement a singleton `Lock` to manage the `Request_Queue`.
*   Implement error handling for:
    *   **HTTP 401**: Invalid Shared Secret.
    *   **HTTP 400**: Invalid request body or unsupported model.
    *   **HTTP 502**: CLI execution error (captured from `stderr`).
    *   **HTTP 504**: Subprocess timeout.

### 3. Integration with Hermes
*   Add the Bridge URL and Key to `~/.hermes/.env`.
*   Add the provider to `~/.hermes/config.yaml` using the `custom` type with `base_url`.

## ⚠️ Pitfalls & Lessons Learned

*   **DNS/Network Loopback**: When testing locally, ensure the server binds to `127.0.0.1` or `0.0.0.0`.
*   **Shell Escape/Safety**: Always use list-based arguments in `subprocess` rather than string-based shells to prevent injection.
*   **Streaming Simulation**: Since most desktop CLIs don't support true token-by-token streaming via stdout, the Bridge should implement **Simulated Streaming** (emitting the full response as a single SSE chunk) to satisfy the OpenAI contract without breaking.
*   **State Persistence**: Be aware that many CLI tools change global settings (like the active model) when run. The Bridge must account for this by setting the model explicitly for every request or managing a stateful session.

## 📂 Reference Files
- `references/kiro-requirements-analysis.md`: Specific requirements for the Kiro-to-Hermes bridge.
- `templates/fastapi-openai-bridge.py`: A production-ready boilerplate for an OpenAI-compatible proxy.
