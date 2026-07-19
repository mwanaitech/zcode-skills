---
name: desktop-ai-bridge-architect
description: Architect and implement local OpenAI-compatible bridges for desktop-only AI tools (like Kiro) to integrate them into Hermes Agent workflows with automatic failover.
trigger: bridge desktop tool, connect desktop ai, proxy desktop app, kiro bridge, openai compatible proxy
---

# Desktop-to-Agent Bridge Architecture

This skill is used when a user wants to integrate a desktop-only AI application (which lacks a native API) into the Hermes Agent ecosystem. The goal is to make the desktop tool appear to Hermes as a standard OpenAI-compatible provider.

## Core Strategies

### 1. The CLI Wrapper Pattern (The "Bridge")
If the desktop tool provides a CLI (Command Line Interface) that can run in a non-interactive mode (e.g., `tool-cli chat --no-interactive`), build a local Python-based proxy.

**Workflow:**
1.  **Identify CLI Capabilities**: Check if the tool supports non-interactive mode and if it uses a specific authentication mechanism (e. ==e.g., `KIRO_API_KEY` in environment).
2.  **Build an OpenAI-Compatible Server**: Create a FastAPI server that implements:
    *   `POST /v1/chat/completions`: Translates OpenAI JSON requests into CLI subprocess calls.
    *   `GET /v1/models`: Returns the list of models available in the desktop tool.
3.  **Implement Request Serialization**: Use an `asyncio.Lock` or a `Queue` to ensure that only one CLI invocation runs at a time, preventing session corruption or state conflicts in the desktop app.
4.  **Response Translation**: Capture `stdout` from the CLI and wrap it in the OpenAI `ChatCompletionResponse` schema.

### 2. The MCP (Model Context Protocol) Pattern
If the desktop tool supports MCP, do not build a proxy. Instead:
1.  Configure the tool as an MCP server.
2.  Add the MCP server definition to the Hermes `config.yaml` under `mcp_servers`.

## Advanced Intelligence Mapping (Failover Strategy)

To ensure high availability, do not map agents to single models. Instead, map them to **Specialist Aliases** that implement a fallback chain.

**Implementation Pattern:**
In `config.yaml`, define `model_aliases` that link a primary provider (e.g., Kiro via the Bridge) to a fallback provider (e.g., Cloudflare Workers).

**Example Mapping:**
- `alias-code-expert` $\rightarrow$ `[kiro:qwen3-coder-next, cloudflare:llama-3.1-8b]`
- `alias-vision-expert` $\rightarrow$ `[kiro:claude-opus-4.8, cloudflare:llama-3.2-vision]`

## Pitfalls & Troubleshooting

- **DNS/Connection Errors**: When testing a new bridge, always check if the local port is bound and if the domain (e.g., `api.provider.dev`) resolves.
- **Non-Interactive Mode**: Many desktop CLIs hang if they expect user input. Always verify the `--no-interactive` or `--headless` flag works.
- **Terminal IO**: Desktop apps often output ANSI escape codes or non-UTF8 characters. Ensure the bridge cleans the `stdout` before returning JSON.
- **Concurrency**: Desktop apps often share a single session state. **Never** run multiple CLI commands in parallel without a serialized queue.

## References
- `references/kiro-bridge-implementation.md`: A case study on bridging Kiro Desktop to Hermes.
