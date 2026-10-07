---
name: prototype
description: "Build interactive HTML prototypes. Use when creating clickable mockups, adding animations, linking pages, or exporting HTML."
version: "3.4.0"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
tags:
  - prototype
  - html
  - ui
  - animation
  - interaction
  - design
---

# Prototype

Create interactive HTML prototypes with components, animations, and navigation.

## Commands

### create

Create a new interactive prototype HTML page with specified sections and style.

```bash
bash scripts/script.sh create --name "app-proto" --sections "nav,hero,features,footer" --theme light --output proto/
```

### component

Generate a standalone UI component (button, modal, card, form, navbar, etc).

```bash
bash scripts/script.sh component --type modal --title "Confirm" --body "Are you sure?" --actions "cancel,confirm" --output components/
```

### animate

Add CSS animation to an element in an existing prototype HTML file.

```bash
bash scripts/script.sh animate --input proto/index.html --selector ".hero" --animation fadeIn --duration 0.5s --output proto/index.html
```

### link

Add click-based page navigation between prototype pages.

```bash
bash scripts/script.sh link --from proto/index.html --selector ".nav-about" --to proto/about.html
```

### preview

Generate a preview summary of a prototype: page list, component count, linked routes.

```bash
bash scripts/script.sh preview --input proto/
```

### export

Bundle a multi-page prototype into a single self-contained HTML file with all assets inlined.

```bash
bash scripts/script.sh export --input proto/ --output prototype-bundle.html
```

## Output

- `create`: HTML file(s) in the output directory with inline CSS and JS
- `component`: HTML snippet file for the specified component
- `animate`: Updated HTML file with injected CSS keyframes and class
- `link`: Updated HTML file with onclick navigation wired
- `preview`: Summary printed to stdout (pages, components, links)
- `export`: Single HTML file with all pages, styles, and scripts inlined


## Requirements
- bash 4+

## Feedback

https://bytesagain.com/feedback/

---

Powered by BytesAgain | bytesagain.com

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered — from the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a tiny interactive terminal app that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts — getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious — but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **One command to run.** Whatever the project's existing task runner supports — `pnpm <name>`, `python <path>`, `bun <path>`, etc. The user must be able to start it without thinking.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE — wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast and then delete it.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** When the prototype has answered its question, either delete it or fold the validated decision into the real code — don't leave it rotting in the repo.

## When done

The _answer_ is the only thing worth keeping from a prototype. Capture it somewhere durable (commit message, ADR, issue, or a `NOTES.md` next to the prototype) along with the question it was answering. If the user is around, that capture is a quick conversation; if not, leave the placeholder so they (or you, on the next pass) can fill in the verdict before deleting the prototype.
