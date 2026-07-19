# Kiro-Hermes Bridge Requirements Analysis

This document summarizes the engineering requirements gathered from the Kiro official documentation to build a reliable-bridge between Kiro Desktop and Hermes Agent.

## 🎯 Goal
Create a local HTTP server that exposes an OpenAI-compatible API to allow Hermes Agent to use Kiro's LLM models via the official, documented headless mode of the Kiro CLI.

## 🛠️ Technical Specifications

### 1. API Endpoints
- `POST /v1/chat/completions`: Standard OpenAI chat completion.
- `GET /v1/models`: Returns a list of supported Model Aliases.

### 2. Core Logic & Constraints
- **CLI Command**: Must use `kiro-cli chat --no-interactive`.
- **Concurrency Control**: A **Request Queue** is mandatory. The Bridge must serialize all `kiro-cli` invocations (including model selection) using a single-process lock to prevent session corruption.
- **Model Selection**: Before each chat, the Bridge must execute `kiro-cli settings chat.defaultModel <Model_Alias>`.
- **Supported Aliases**: `claude-opus-4.6`, `claude-sonnet-4.6`, `claude-haiku-4.5`, `deepseek-3.2`, `minimax-m2.5`, `minimax-m2.1`, `glm-5`, `qwen3-coder-next`, `auto`.
- **Simulated Streaming**: When `stream: true` is requested, the Bridge must return the full response as a single Server-Sent-Event (SSE) chunk to comply with the OpenAI contract.

### 3. Authentication
- Requires a `Shared_Secret` passed via the `Authorization: Bearer <token>` header.

### 4. Error Mapping
- **400**: Invalid JSON, missing messages, or unsupported model.
- **401**: Authentication failure.
- **502**: Kiro CLI execution error (captured from `stderr`).
- **504**: Subprocess timeout.
