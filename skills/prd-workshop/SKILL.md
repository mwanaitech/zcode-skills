---
name: prd-workshop
description: "Guide product managers through requirement confirmation workshops. Reads input (Feishu docs, web URLs, local files, or natural language), confirms each module interactively, and generates dual PRD documents (product-readable + AI-engineering structured). Pushes confirmed documents back to remote repository."
---

# PRD Workshop — Product Requirement Workshop

Guide product managers from their initial draft to a confirmed, structured PRD through modular interactive confirmation.

<HARD-GATE>
Do NOT generate any PRD output until all 5 modules have been confirmed one by one. Each module must be individually confirmed before proceeding to the next. This applies to EVERY session.
</HARD-GATE>

## Overview

The product manager has already written an initial draft (on Feishu, Yuque, Axhub, or local files). This skill:
1. Reads and parses the input
2. Generates an information matrix (what's there vs what's missing)
3. Walks through 5 modules one by one for confirmation
4. Generates two PRD documents (product-readable + AI-engineering)
5. Pushes documents back to the remote repository

## Checklist

You MUST complete these steps in order:

1. **Receive input** — accept link, file, or natural language description
2. **Parse & analyze** — read content, extract information, generate information matrix
3. **Module A: Product Overview** — confirm/supplement background, goals, users, competitors
4. **Module B: User Stories** — confirm/supplement user stories with priority
5. **Module C: Acceptance Criteria** — confirm/supplement Given/When/Then criteria
6. **Module D: Non-Functional Requirements** — confirm/supplement performance, security, compatibility
7. **Module E: Prioritization & Planning** — confirm/supplement priority order, iteration plan, risks
8. **Generate dual PRD documents** — product-readable + AI-engineering versions
9. **Push to remote** — via MCP (Feishu) or save locally with naming convention

## Step 1: Receive Input

Ask the user for the input source. Accept:

- **Feishu document link** — use Feishu MCP to read remotely
- **Web URL** (Yuque, Axhub, etc.) — use WebFetch or browser tools to scrape
- **Local file** (.md, .txt, .doc, .docx, .wps) — use Read tool or Python to parse
- **Natural language** — the user describes directly

Present the information matrix:

```markdown
✅ Identified:
  - Business goal: ...
  - Features: ...
  - Target users: ...
  - Constraints mentioned: ...

❓ Need confirmation/supplement:
  - Module A: [ ] Background [ ] Metrics [ ] User personas
  - Module B: [ ] User stories [ ] Priority
  - Module C: [ ] Acceptance criteria [ ] Edge cases
  - Module D: [ ] Performance [ ] Security
  - Module E: [ ] Iteration plan [ ] Risks
```

Ask user to confirm the matrix before proceeding.

## Step 2-6: Modular Workshop

**Rule: Complete one module, get explicit confirmation, then move to the next.**

For each module, Read the corresponding guide:
- Module A: `modules/product-overview.md`
- Module B: `modules/user-stories.md`
- Module C: `modules/acceptance-criteria.md`
- Module D: `modules/non-functional.md`
- Module E: `modules/prioritization.md`

Follow the guide's questions and checklist. Record confirmed content.

## Step 7: Generate Dual PRD

After all 5 modules are confirmed, generate two documents:

**Document A: Product-Readable PRD**
- Use `templates/prd-product.md` as the template
- Fill with confirmed content
- Save to: `{original-name}-产品版.md` (current directory)

**Document B: AI-Engineering PRD**
- Use `templates/prd-ai-engineering.md` as the template
- Fill with confirmed content
- Save to: `{original-name}（AI版本）.md` (current directory)

## Step 8: Push to Remote

If the original document came from Feishu MCP:
- Push both documents back via Feishu MCP
- Naming: original name + suffix `（AI版本）` for the engineering version
- Naming: original name + suffix `-产品版` for the product version

If the original document came from a local file or natural language:
- Save both documents locally in the specified paths
- Suggest commit and push

## Error Handling

| Scenario | Response |
|----------|----------|
| Feishu link inaccessible | Ask user to check permissions, offer manual paste fallback |
| Web page unreachable | Retry with WebFetch, ask user to download locally |
| Unsupported file format | Ask to convert to .docx or .txt |
| User exits mid-workshop | Save confirmed modules to temp file, offer resume next session |

## Key Principles

- **One module at a time** — never skip ahead
- **Confirm explicitly** — each module requires user confirmation before proceeding
- **Content from confirmed workshop only** — do not invent requirements
- **Dual output** — always generate both versions, never just one
- **Preserve original naming** — AI version suffix matches original document name
