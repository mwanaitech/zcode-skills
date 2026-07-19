# Headroom — Context Compression Layer for AI Agents

Compress everything your agent reads (tool outputs, logs, RAG chunks, files, conversation history) before it reaches the LLM. 60–95% fewer tokens, same answers.

## Installation

```bash
pip install "headroom-ai[all]"          # Python, everything
npm install headroom-ai                 # TypeScript / Node
docker pull ghcr.io/chopratejas/headroom:latest
```

Granular extras: `[proxy]`, `[mcp]`, `[ml]`, `[code]`, `[memory]`, `[relevance]`, `[image]`, `[agno]`, `[langchain]`, `[evals]`, `[pytorch-mps]`.

Requires Python 3.10+. On Debian/Ubuntu with PEP 668, use `pipx install "headroom-ai[proxy,mcp,memory]"`.

## Modes

### 1. Proxy (drop-in, zero code changes)

```bash
headroom proxy --port 8787
```

All traffic to the LLM passes through the proxy and gets compressed automatically.

```bash
# Point any client at the proxy
ANTHROPIC_BASE_URL=http://localhost:8787 opencode
OPENAI_BASE_URL=http://localhost:8787/v1 cursor
```

Key CLI options:
- `--host` / `--port` — bind address (default: `127.0.0.1:8787`)
- `--budget <USD>` — daily budget limit
- `--llmlingua` — enable ML-based compression (needs `[ml]` extra)
- `--log-file <path>` — JSONL log file
- `--no-intelligent-context` — fall back to RollingWindow (oldest-first drops)

Endpoints: `GET /health`, `GET /stats`, `GET /metrics` (Prometheus), `POST /v1/messages` (Anthropic), `POST /v1/chat/completions` (OpenAI), `POST /v1/compress`.

Environment variables: `HEADROOM_HOST`, `HEADROOM_PORT`, `HEADROOM_BUDGET`, `HEADROOM_OUTPUT_SHAPER=1` (output token reduction).

### 2. Wrap (agent wrapper)

```bash
headroom wrap opencode
```

Transparently wraps a CLI agent to route through the proxy. Also supports `claude`, `codex`, `cursor`, `aider`, `copilot`.

### 3. MCP tools (on-demand compression)

```bash
headroom mcp install     # register with Claude Code / opencode
headroom mcp serve       # stdio mode
headroom mcp serve --transport http --port 8080  # HTTP mode for Docker/remote
```

Available tools:
- **`headroom_compress(content)`** — compress text on demand. Returns compressed text, hash, original/compressed token counts, savings percent.
- **`headroom_retrieve(hash, query?)`** — retrieve original uncompressed content by hash. Optionally search within original.
- **`headroom_stats()`** — session compression statistics (compressions, retrievals, tokens saved, estimated cost saved).

MCP is available at `/mcp` on the proxy (`http://host:8787/mcp`) via Streamable HTTP transport.

### 4. headroom learn (failure mining)

```bash
headroom learn                    # dry-run, show recommendations
headroom learn --apply            # write corrections to AGENTS.md / CLAUDE.md
headroom learn --all --apply      # analyze all projects
```

Mines failed agent sessions, correlates failures with what eventually worked, writes specific project-level learnings:
- Environment facts (which runtime commands work)
- File path corrections (wrong paths → correct paths)
- Search scope (which directories to search)
- Command patterns (how to run things)
- Known large files (need `offset`/`limit`)

Writes between `<!-- headroom:learn:start -->` / `<!-- headroom:learn:end -->` markers.

### 5. Output token reduction (via proxy)

```bash
export HEADROOM_OUTPUT_SHAPER=1
headroom proxy
```

Trims what the model writes back (preambles, restated code, deep thinking on routine steps). Verbosity level auto-learned via `headroom learn --verbosity --apply`.

## Architecture

```
Agent → Headroom (local proxy/library/MCP) → LLM
         ├─ ContentRouter — detects content type, selects compressor
         ├─ SmartCrusher — universal JSON
         ├─ CodeCompressor — AST-aware (Python, JS, Go, Rust, Java, C++)
         ├─ Kompress-base — text (HuggingFace model)
         ├─ CacheAligner — stabilizes prefixes for KV cache hits
         └─ CCR — reversible compression (originals cached locally, retrievable on demand)
```

## Backends

```bash
# AWS Bedrock
headroom proxy --backend bedrock --region us-east-1

# Google Vertex AI
headroom proxy --backend vertex_ai --region us-central1

# Azure OpenAI
headroom proxy --backend azure

# OpenRouter (400+ models)
OPENROUTER_API_KEY=sk-or-... headroom proxy --backend openrouter
```

## Production

```bash
# gunicorn
pip install gunicorn
gunicorn headroom.proxy.server:app --workers 4 --bind 0.0.0.0:8787 --worker-class uvicorn.workers.UvicornWorker

# Docker
docker run -p 8787:8787 ghcr.io/chopratejas/headroom:latest
```

## Updates

```bash
headroom update              # detects pip/pipx/uv and upgrades
headroom update --check      # check latest version without upgrading
```

## Configuration

Key env vars:
- `HEADROOM_HOST` / `HEADROOM_PORT` — proxy bind address
- `HEADROOM_BUDGET` — daily USD budget
- `HEADROOM_OUTPUT_SHAPER=1` — enable output token reduction
- `HEADROOM_TELEMETRY=off` — disable telemetry
- `ANTHROPIC_BASE_URL` / `OPENAI_BASE_URL` — proxy endpoint for agents
- `HF_HUB_OFFLINE=1` — offline mode (after pre-downloading model)
- `HEADROOM_EMBEDDER_RUNTIME=pytorch_mps` — Apple GPU offload

## Docs

- [Proxy](https://headroom-docs.vercel.app/docs/proxy)
- [MCP tools](https://headroom-docs.vercel.app/docs/mcp)
- [Failure learning](https://headroom-docs.vercel.app/docs/failure-learning)
- [Architecture](https://headroom-docs.vercel.app/docs/architecture)
- [Configuration](https://headroom-docs.vercel.app/docs/configuration)
