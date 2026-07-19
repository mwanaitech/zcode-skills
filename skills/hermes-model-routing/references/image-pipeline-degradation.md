# Image Analysis Pipeline — Degraded Fallbacks

When the principal model does not support `vision_analyze`, use this cascade instead of asking the user to describe the image.

## When This Applies

| Symptom | Cause |
|---------|-------|
| `vision_analyze` returns error code 401 or "Model not supported" | Principal model lacks native vision capability (e.g. `@cf/moonshotai/kimi-k2.6`) |
| `delegate_task` with `vision_analyze` returns error 413 | Context overflow even in subagent session |

Do **not** ask the user to describe the image unless all three fallbacks below fail.

---

## Fallback 1: Delegate to Vision-Capable Subagent

The most reliable path: spawn a leaf subagent with a model that supports vision.

```yaml
delegation:
  provider: bedrock
  model: global.anthropic.claude-sonnet-4-6
```

Prompt the subagent to extract text + context + action items. The subagent result re-enters the parent conversation automatically.

**Pitfall:** If the parent context is already large (Telegram gateway, long session), the subagent may also hit **413 Request payload too large** because the injected context exceeds gateway limits.

---

## Fallback 2: Use Local OCR (tesseract)

When delegation fails with 413, extract text directly with `tesseract`.

### Prerequisites

```bash
tesseract --version  # verify installed
```

If absent, install:
```bash
# Debian/Ubuntu
sudo apt-get install tesseract-ocr tesseract-ocr-fra

# macOS
brew install tesseract
```

### Command

```bash
# Extract French text from an image
tesseract /path/to/image.jpg stdout -l fra 2>/dev/null
```

For mixed-language documents, try `-l fra+eng`.

### Typical Output Quality

- Clean screenshots / printed posters: **excellent** (90%+ accuracy)
- Handwritten notes / low-contrast photos: **poor** — still useful for keywords and structure
- Mixed formatting (tables, columns): **moderate** — structure is lost, text is linearized

### Practical Workflow

1. Run tesseract
2. Parse the output for key entities: names, dates, numbers, addresses, job titles
3. Use the extracted text to prepare an email, document, or response
4. If critical details are ambiguous, ask the user to confirm **specific points only**, not a full description

---

## Fallback 3 (Last Resort): Ask for Confirmation Only

If OCR output is garbled or nonsensical, ask the user a **single targeted question**:

> "L'OCR du document est flou sur le [point précis]. Confirme-moi [détail]."

Never ask: "Décris-moi l'image" after two automated attempts have failed.

---

## Reference: Common Image Paths in Hermes

Images uploaded via Telegram/CLI are cached under:

```
~/.hermes/cache/images/
```

The path is always reported in the user message or tool output. Use it directly without guessing.
