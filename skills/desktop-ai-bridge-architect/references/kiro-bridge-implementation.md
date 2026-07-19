# Case Study: Bridging Kiro Desktop to Hermes Agent

## Problem Statement
Kiro is an agentic IDE designed for desktop use. It lacks a native HTTP API, making it impossible for external agents (like Hermes) to utilize its high-performance models directly.

## Implementation Path

### 1. Discovery
- Confirmed CLI existence via `kiro --help`.
- Identified `kiro chat --no-interactive` as the primary headless execution command.
- Discovered-and-verified the-endpoint pattern: `https://app.kiro.dev/api/v1`.

### 2. The Bridge Architecture
A local Python-based FastAPI server was built to act as a proxy.

**Key Technical Decisions:**
- **Concurrency Control**: Used `asyncio.Lock` to serialize all `kiro-cli` calls, preventing session state corruption in the desktop app.
- **Schema Mapping**: Translated CLI `stdout` into OpenAI-compatible `chat.completion` JSON objects.
- **Authentication**: Integrated the user's `KIRO_API_KEY` via environment variables.

### 3. Deployment & Integration
- **Environment**: The bridge runs as a standalone process.
- **Hermes Integration**: Configured in `config.yaml` as a `custom` provider pointing to `http://localhost:8080/v1`.
- **Intelligence Mapping**: Created specialized `model_aliases` (e.g., `alias-code-expert`) that include a fallback to Cloudflare Workers to ensure continuous operation.

## Troubleshooting Log
- **Issue**: `Connection refused` during testing.
- **Cause**: The bridge server was not running or the port was incorrect.
- **Fix**: Verified port availability and ensured the server was started in the correct directory.

- **Issue**: `NameResolutionError` for `api.kiro.dev`.
- **Cause**: Incorrect guessed domain.
- **Fix**: Performed DNS probing and identified `app.kiro.dev/api/v1` as the correct endpoint.
