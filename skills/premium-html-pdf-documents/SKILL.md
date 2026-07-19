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

- **Round crop the photo** with Python PIL/Pillow (circle mask, border):
  ```python
  from PIL import Image, ImageDraw
  img = Image.open("photo.jpg").convert("RGBA")
  mask = Image.new("L", size, 0)
  ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
  # Add gold border by compositing a larger circle underneath
  ```
- **Reference local images** in the HTML with an absolute `file:///` URL so
  headless Chrome can resolve them:
  ```html
  <img src="file:///home/user/cv_photo_round.png">
  ```
- **Copy the image into `/tmp/` alongside the HTML** when rendering, and
  replace the `file:///` path with a relative `./cv_photo_round.png` in
  the temp copy to avoid cross-origin issues:
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
  file:///tmp/document.html
```

- Use `--no-sandbox` in container/VM environments.
- No additional flags needed for UTF-8 as long as the HTML file is
  genuinely UTF-8 encoded.

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
2. **Photo not showing in PDF** → Chrome headless blocks `file:///` URLs
   unless the image is in the same directory as the HTML, or the path is
   absolute. Fix: copy both to `/tmp/` or use absolute `file:///home/...`.
3. **PDF overflows to 2 pages** → Did not compact enough. Reduce padding
   and font sizes further, or trim content.
4. **Name hyphenation** → If the user says "tirets inutiles", remove them
   immediately from the HTML title and all headings.

## Templates

- `templates/cv-a4-two-column.html` — Starter CV with dark sidebar + gold
  accents, ready for user content injection.
- `templates/letter-a4-gradient.html` — Starter cover letter with gradient
  background and dark top/bottom bars, matching school recruitment poster
  style.

## Scripts

- `scripts/crop-photo-round.py` — Crop a portrait photo into a circle with
  a configurable colored border, output PNG.
