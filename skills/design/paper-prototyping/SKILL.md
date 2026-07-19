---
name: paper-prototyping
description: "Build interactive UI prototypes using Paper.design and its MCP server. Covers artboard creation, HTML section writing, screenshot capture, and headless fallback rendering when browser tools are unavailable."
version: "1.0.0"
tags:
  - design
  - prototyping
  - paper
  - mcp
---

# Paper.design Prototyping

## When to use

- User asks to build a mockup, landing page, or UI prototype in Paper.
- User mentions "Paper" or "paper.design" in a design or prototyping context.
- You need to produce a visual artifact via Paper's MCP server.

## Prerequisites

1. **Paper Desktop must be running**. The MCP server only works when the Paper app is active.
2. **MCP endpoint**: `http://127.0.0.1:29979/mcp` (default local Paper MCP).
3. Auth is session-based; cookies are handled by Paper Desktop automatically.

## MCP Protocol details

Paper MCP uses **JSON-RPC 2.0 over Server-Sent Events (SSE)**.

### Parsing responses
- Responses are SSE lines prefixed with `data: ` (e.g. `data: {"jsonrpc":"2.0", ...}`).
- Strip `data: ` prefix before parsing JSON.
- `tools/list` reveals available tools dynamically.

### Key tools

#### `create_artboard`
Creates a new top-level artboard.

Arguments:
- `name` (string) — artboard title
- `width` (number) — e.g. `1440`
- `height` (number) — e.g. `3200`
- `styles` (object, optional) — can be empty `{}`

Returns: node with `id` in `"1-0"`, `"2-0"`, etc. format.

#### `write_html`
Appends an HTML block as a child node.

Arguments:
- `html` (string) — raw HTML. **Embed directly; do NOT base64-encode.**
- `node` (string) — parent node ID (e.g. `"1-0"` for artboard)
- `styles` (object, optional) — e.g. `{ "position": "absolute" }`

> Lesson: `write_html` takes `node` (not `nodeId`) as the parent. The original attempt to pass `nodeId` was wrong.

#### `get_screenshot`
Captures a node as image.

Arguments:
- `nodeId` (string, required)
- `scale` (number, optional) — `1` for layout, `2` for detail
- `transparent` (boolean, optional) — `false` = JPEG, `true` = PNG
- `fileId` (string, optional) — target file if multiple are open

Returns: image inside `result.content[]` as `{ type: "image", source: { data: "data:image/png;base64,..." } }`.

> Pitfall: `get_screenshot` does NOT accept `width`/`height`.
> Pitfall: For the artboard root node (`1-0`), screenshots may return empty content. Capture child sections individually for more reliable results.

#### `list_files`
Returns team files with IDs.

#### `open_file`
Opens a file by ID so subsequent calls target it.

## User context preferences

The user this skill serves prefers **direct action over upfront explanations**. When they say phrases like *"vas-y"*, *"fais-le"*, *"go ahead"*, or *"do it"*, start building immediately using the default design system above. Provide verification (screenshots, file paths, real outputs) after the action, not before.

## Workflow

1. **Verify connectivity** — `curl` the MCP endpoint to ensure Paper Desktop is alive.
2. **List / open files** — use `list_files` then `open_file` to set the working file.
3. **Create artboard** — `create_artboard` with desired dimensions.
4. **Build incrementally** — call `write_html` for each section (Header, Hero, Features, etc.), passing the artboard ID as `node`.
5. **Capture screenshots** — `get_screenshot` on individual section nodes if the root node fails.
6. **Verify visually** — if Paper screenshot fails, fall back to headless Chrome.

## Design system reference

When building prototypes in Paper, use this default palette (earth-tone) unless the user requests otherwise:

| Token | Hex | Usage |
|---|---|---|
| Ground | `#FAFAF7` | Page background |
| Primary | `#2D5A3D` | Headings, CTAs, accent |
| Secondary | `#8FBC8F` | Success states, highlights |
| TextPrimary | `#1A1A1A` | Body text |
| TextSecondary | `#6B6B6B` | Labels, captions |
| DarkSurface | `#1E3A2B` | Dark sections (hero/footer) |
| AccentWarm | `#F5F0E8` | Light info blocks |

Typography:
- Display: Space Grotesk, 700, tight tracking
- Body: Inter, 400–600

## Fallback screenshot technique

If the `browser_navigate`/`browser_vision` tools fail (e.g. missing Chromium, Playwright not installed, `agent-browser` timeout), use headless Chrome directly:

```bash
google-chrome --headless --disable-gpu \
  --screenshot=/tmp/preview.png \
  --window-size=1500,3400 \
  file:///tmp/prototype.html
```

Then reference `MEDIA:/tmp/preview.png` in your reply.

## Pitfalls

- **Do NOT base64-encode HTML for `write_html`.** Pass the raw HTML string.
- **Do NOT pass `nodeId` to `write_html`.** Use `node`.
- **Do NOT pass `width`/`height` to `get_screenshot`.** Use `scale` instead.
- **Paper Desktop must be open.** The MCP server does not start without it.
- **Artboard root screenshots may be empty.** Capture child node sections individually.
