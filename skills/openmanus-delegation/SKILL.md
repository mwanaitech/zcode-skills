---
name: openmanus-delegation
description: Delegate complex multi-step tasks to the OpenManus autonomous agent. OpenManus plans, executes, and delivers results independently. Use for tasks requiring autonomous web browsing, code writing, research, or multi-step reasoning that exceeds quick tool calls.
tags:
  - openmanus
  - delegation
  - autonomous
  - agent
  - multi-step
  - research
metadata:
  hermes:
    triggers:
      - openmanus
      - delegation openmanus
      - agent autonome
      - tache complexe
---

# OpenManus Delegation Skill

## Overview

### Recent learnings (session updates)
- **Dependency handling**: `browser-use` requires `click>=8.4.0`. The session installed it using `pip install --no-deps` to avoid version conflicts. When a conflict arises, either upgrade `click` (`pip install -U click>=8.4.0`) **or** install with `--no-deps` and accept potential missing optional features.
- **Playwright browsers**: After installing `browser-use`, run `playwright install` inside the OpenManus venv to download required browsers.
- **Optional heavy deps**: Full OpenManus functionality (e.g., `litellm`, `torch`, `crawl4ai`) can be installed later via `pip install -r requirements.txt` in the background. They are not required for basic delegation.
- **Config adjustments**: Added a minimal `[daytona]` section with placeholder API key to bypass required fields.
- **Script behavior**: The delegation script now injects the OpenCode Zen API key from `~/.hermes/.env` and substitutes the placeholder in `config.toml` before launching.

These points are added as **pitfalls** and **setup notes** for future runs.

## Pitfalls
- **Context too large (413 Payload Too Large)**: If the goal + context exceeds ~4KB, the delegation API fails with "Request payload too large (413)". Keep task descriptions concise and summarize long file contents before delegating.
- **Click version conflict**: If installing `browser-use` fails due to an older `click`, use `pip install -U click>=8.4.0` **or** install with `--no-deps` as done here.
- **Playwright not installed**: Forgetting to run `playwright install` will cause runtime errors when the agent tries to use the browser tool.
- **Missing `daytona_api_key`**: The config now includes a dummy key; ensure any production deployment supplies a valid one.

## References
- `references/installation_notes.md` – detailed step‑by‑step guide for setting up OpenManus within Hermes.

OpenManus is an open-source autonomous AI agent (similar to Manus) that can:
- Browse the web autonomously
- Write and execute code
- Perform multi-step research
- Use tools (bash, browser, file editor)
- Produce complete work products

This skill provides Hermes with the ability to delegate complex tasks to OpenManus.

## When to Use
Delegate to OpenManus when the user asks for:
- "recherche approfondie sur..." / "deep research about..."
- "va sur ce site et..." / "go to this site and..."
- "analyse ce projet..." / "analyze this project..."
- "cree un rapport complet sur..." / "create a full report about..."
- Any multi-step task with browsing, coding, or research

## How to Delegate
Run the delegation script:
```bash
~/.hermes/scripts/openmanus-delegate.sh "your detailed task description"
```

The script:
1. Reads the OpenCode Zen API key from ~/.hermes/.env
2. Injects it into config.toml
3. Activates the OpenManus venv
4. Runs `python main.py --prompt "..."` 
5. Captures all output

## Task Prompting Tips
- Be specific and detailed in the task description
- Include desired output format (e.g., "deliver a markdown report", "create files in /tmp/results/")
- Specify constraints (time, budget, sources)
- One task per delegation - OpenManus runs sequentially

## Installation Paths
- Repo: ~/OpenManus
- Venv: ~/OpenManus/.venv (uv, Python 3.12)
- Config: ~/OpenManus/config/config.toml (uses OpenCode Zen API)
- Script: ~/.hermes/scripts/openmanus-delegate.sh

## Known Limitations
- Depends on OpenCode Zen (free tier model) - complex tasks may hit rate limits
- browser-use requires Playwright (install with `playwright install` in the venv)
- Long-running tasks should be run as background processes
- No streaming output - waits for completion

## Installation

```bash
cd ~ && git clone https://github.com/FoundationAgents/OpenManus.git
cd OpenManus && uv venv --python 3.12 && uv pip install pip setuptools wheel
.venv/bin/pip install -r requirements.txt
```

**Pitfall:** The full requirements.txt installs 207+ packages including PyTorch (507 MiB). Expect 10-30 minutes on a standard connection. May time out in foreground mode — use `background=true` with `notify_on_complete=true`.

**Pitfall:** PEP 668 on some Linux distros blocks `pip install` even inside venvs. Use `uv pip install` or explicitly invoke `.venv/bin/pip` (not the system pip). Make sure pip is seeded in the uv venv first: `uv pip install pip`.

## Lightweight Alternative

If you only need the core agent (no browser-use/crawl4ai), install only the essentials:

```bash
.venv/bin/pip install openai pydantic pyyaml loguru structlog numpy tiktoken \
  html2text pillow fastapi uvicorn docker playwright
```

This skips PyTorch, crawl4ai, browser-use gym, and their heavy dependencies (~1.5 GB saved).
