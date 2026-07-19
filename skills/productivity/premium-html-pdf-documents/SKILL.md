---
name: premium-html-pdf-documents
description: >
  Generate professional CVs, cover letters, and corporate documents as HTML/CSS
  with premium custom design, converted to PDF via headless Chrome. Handles
  French UTF-8 accents, local photo embedding, single-page A4 compaction, and
  visual-reference matching (posters, branding, school graphics).
triggers:
  - User asks for a CV, resume, cover letter, motivation letter, or professional document
  - User provides a visual reference (poster, ad, screenshot) and asks to match its design
  - User wants a PDF document with custom color scheme, layout, or branding
  - User needs a document in French with full accents and formal register
---

# Premium HTML→PDF Document Pipeline

## Overview

This skill generates polished, print-ready documents by authoring HTML/CSS
optimized for `@media print`, then converting to PDF with Google Chrome
headless. The approach gives pixel-perfect control over layout, colors,
fonts, and branding — far beyond what `.docx` generators typically allow.

## Workflow

### 1. Design Phase

- **Ask the user for content** (or extract from an existing file).
- **Request a visual reference** if they have one (poster, ad, brand kit,
  screenshot). Load it with `vision_analyze` to extract color palette,
  typography style, and layout patterns.
- **Define the A4 canvas**:
  ```css
  .page { width: 210mm; min-height: 297mm; }
  @page { size: A4; margin: 0; }
  @media print { .page { box-shadow: none; margin: 0; } }
  ```
- **Use CSS Grid or Flexbox** for two-column CV layouts. Avoid floats.

### 2. French Language Hygiene

- **Use full UTF-8 charset** in the HTML `<meta charset="utf-8">`.
- **Write all accents explicitly**: `Compétences`, `Numérique`, `Pédagogie`,
  `Élaboration`, `À propos`.
- **Never use ASCII fallback** (e.g., "Ca" instead of "Ça", "e" instead
  of "é"). Headless Chrome renders UTF-8 correctly when the source file
  is saved as UTF-8.
- **Prefer formal/sustained French** over colloquial register:
  - "En vue de l'acquisition de compétences" → not "vers l'autonomie sur des compétences"
  - "Veille à la continuité" → not "Garantie de la continuité"
  - "Élaboration de supports" → not "Mise en place de supports"
  - "Participation à l'amélioration" → not "Contribution à la fiabilité"
- **Remove unnecessary hyphens** in names if the user requests it.

### 3. Photo Embedding

Two reliable approaches. Prefer **method A (base64)** — it has zero path
resolution issues and works even when Chrome's sandbox blocks file:///.

#### Method A — Base64 Data URI (preferred)

- **Round crop the photo** with Python PIL/Pillow (circle mask, 180×180 px
  for CV sidebar, 354×354 for larger placement):
  ```python
  from PIL import Image, ImageDraw
  import io, base64

  img = Image.open("photo.jpg").convert("RGBA")
  size = min(img.size)
  left = (img.width - size) // 2
  top = (img.height - size) // 2
  img_sq = img.crop((left, top, left + size, top + size))

  mask = Image.new("L", (size, size), 0)
  ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
  result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
  result.paste(img_sq, (0, 0), mask)
  result = result.resize((180, 180), Image.LANCZOS)

  buf = io.BytesIO()
  result.save(buf, format="PNG")
  b64 = base64.b64encode(buf.getvalue()).decode()
  ```
- **Embed directly in HTML** as a data URI (no file paths needed):
  ```html
  <img src="data:image/png;base64,B64_STRING" alt="Photo">
  ```
- **For border styling**, use CSS on the img element instead of compositing:
  ```css
  .photo-container img {
    border-radius: 50%;
    border: 2.5px solid #C9A227;
    object-fit: cover;
  }
  ```
- **Inject the base64 string** into the HTML after writing it:
  ```python
  html = open("cv.html").read().replace("B64_PLACEHOLDER", b64)
  open("cv.html", "w").write(html)
  ```

#### Method B — file:/// URL (fallback if base64 is too large)

- **Copy the image into `/tmp/` alongside the HTML** when rendering, then
  use a relative path in a temp copy to avoid cross-origin issues:
  ```bash
  cp /home/user/photo.png /tmp/photo.png
  sed -i 's|file:///home/user/photo.png|photo.png|g' /tmp/cv.html
  google-chrome --headless --print-to-pdf=out.pdf file:///tmp/cv.html
  ```

### 4. Single-Page A4 Compaction

If the PDF spills onto a second page, compact systematically in this order:

| Element | Start | Compact to |
|---|---|---|
| Page padding (`.main`, `.sidebar`) | 13 mm / 9 mm | 8 mm / 6 mm → 5 mm / 4 mm |
| Photo | 35 mm | 28 mm |
| Section margins | 6 mm | 3 mm |
| Timeline / job gaps | 4.3 mm | 2.5 mm |
| Paragraph margins | 4.5 mm | 2.5 mm |
| Font size body | 11 px | 10 px → 9 px |
| Font size headlines | 22 px | 18 px |
| Font size titles | 13 px | 11 px |
| Footer margin | 5 mm | 2 mm |

- **Always verify with `pdfinfo`** after generation:
  ```bash
  pdfinfo output.pdf | grep Pages
  ```
- **Target = 1 page** for CVs. **Target = 1–2 pages** for cover letters,
  but default to 1 page if the user specifies it.

### 5. PDF Generation Command

```bash
google-chrome --headless --no-sandbox --disable-gpu \
  --print-to-pdf=/path/to/output.pdf \
  /absolute/path/to/document.html
```

- Use `--no-sandbox` in container/VM environments.
- Use an absolute path for the input HTML (relative paths may confuse
  headless Chrome).
- No additional flags needed for UTF-8 as long as the HTML file is
  genuinely UTF-8 encoded.
- **Always verify after generation**:
  ```bash
  pdfinfo /path/to/output.pdf | grep -E "Pages|Page size|File size"
  ```

### 6. Visual Reference Matching

When the user attaches a poster / ad / screenshot:
- **Extract palette**: dominant background color, accent color (gold/yellow,
  blue, etc.), text colors.
- **Extract layout**: dark bars at top/bottom? gradient background? sidebar?
- **Mirror in CSS**: recreate the feel, not a pixel-perfect clone.
- **Use CSS gradients** for backgrounds:
  ```css
  background: linear-gradient(180deg, #2d7a52 0%, #1a3d2e 40%, #0f2a1e 100%);
  ```

## Common Pitfalls

1. **Accents missing in PDF** → The HTML file was not saved as UTF-8, or
   the accents were typed as bare ASCII in the source. Fix: write the file
   with `write_file` (handles UTF-8 natively) and verify with `read_file`.
2. **Photo not showing in PDF with file:///** → Chrome headless blocks
   `file:///` cross-origin image loads. Fix: use base64 data URI instead,
   or copy the image next to the HTML in `/tmp/` and use a relative path.
3. **PDF overflows to 2 pages** → Did not compact enough. Reduce padding
   and font sizes further, or trim content.
4. **Name hyphenation** → If the user says "tirets inutiles", remove them
   immediately from the HTML title and all headings.
5. **ImageMagick `convert` fails with "Unrecognized option (-alpha)"** →
   Do not use ImageMagick for photo processing. Use Python Pillow directly
   via `execute_code` — it handles alpha channels and circular masks
   correctly.
6. **Python script times out (exit code 124)** → When processing large
   photos (>500 KB), use `execute_code` with inline Pillow code instead of
   shelling out to a standalone script. Inline code runs faster and avoids
   subprocess overhead.
7. **Session interruption mid-stream** → Save the HTML file BEFORE
   attempting PDF conversion. The HTML is the source of truth; if
   interrupted, you can resume by regenerating the PDF from the saved HTML
   + photo base64.
8. **Base64 string too large for HTML** → For large source photos (>200 KB),
   reduce the circular output resolution to 120-150 px before encoding.
   Display size on A4 is ~32 mm (~120 px at 96 DPI).

## Templates

- `templates/cv-a4-two-column.html` — Starter CV with dark sidebar + gold
  accents, ready for user content injection.
- `templates/letter-a4-gradient.html` — Starter cover letter with gradient
  background and dark top/bottom bars, matching school recruitment poster
  style.

## Scripts

- `scripts/crop-photo-round.py` — Crop a portrait photo into a circle with
  a configurable colored border, output PNG.
