---
name: html-poster-design
description: >-
  Design print-quality posters (A2, A3, etc.) using HTML/CSS with absolute mm
  positioning. Covers risograph/sérigraphie handcrafted aesthetics, grain
  textures, stamp effects, and iterative refinement via browser preview +
  vision analysis feedback loop. Output is HTML viewable in any browser and
  printable/exportable to PDF at exact paper size without the "AI-generated"
  look.
triggers:
  - User asks for a poster, flyer, or large-format print design
  - User says they don't want it to look "AI-generated" or "too clean/generic"
  - User provides a visual reference (poster, ad) and you need to reproduce its
    style in HTML/CSS for print
  - User wants a handcrafted, screen-print, risograph, or sérigraphie aesthetic
  - User asks for a corporate business poster, company services flyer, or
    promotional print with logo and service listing
---

# HTML Poster Design

## Overview

This skill creates print-quality posters as standalone HTML files. The approach
gives pixel-perfect control over typography, layout, colors, textures, and
positioning — similar to what InDesign or Illustrator would provide — but
fully expressed in a single .html file that anyone can open in a browser and
save/print as PDF.

**Core philosophy**: Deliver a finished print artifact, not a "generated"
image. The techniques below intentionally avoid the polished, flat, sterile
look of AI-generated designs by embracing analogue print aesthetics (grain,
ink bleed, limited palette, stamped elements, intentional composition).

## Workflow

### 1. Define Canvas & Format

```css
.poster {
  width: 594mm;   /* A2 width */
  height: 841mm;  /* A2 height */
  position: relative;
  overflow: hidden;
  background: #f4a640; /* base color */
}
```

Common sizes:
- A0: 841 × 1189 mm
- A1: 594 × 841 mm
- A2: 420 × 594 mm
- A3: 297 × 420 mm
- A4: 210 × 297 mm

Always use `mm` units for the poster container and for absolute positioning.
Use `rem` or `mm` for font sizes (mm keeps typography proportional to the
physical print size).

### 2. Establish the Color Palette

Limit to 2–4 colors for an authentic screen-print / risograph feel:

| Role | Example Colors |
|------|---------------|
| Background | Orange (#f2a54a), cream (#f5e6c8), beige |
| Primary text | Near-black (#0d0d0d) |
| Accent | Red (#e63946), gold, blue |
| Highlight | White (#fff) for reverse text on dark |

**Rule**: Max 4 total colors including black and white. Fewer is better.
The limited palette is a key differentiator from AI-generated designs.

### 3. Build the Layout with Absolute Positioning

```css
.hero {
  position: absolute;
  top: 55mm;
  left: 16mm;
  z-index: 12;
}
.manifesto {
  position: absolute;
  bottom: 35mm;
  left: 16mm;
  z-index: 13;
  max-width: 280mm;
}
.stats-block {
  position: absolute;
  bottom: 240mm;
  right: 16mm;
  z-index: 13;
  text-align: right;
}
.bottom-stripe {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 24mm;
  z-index: 10;
}
```

Key principles:
- Use `position: absolute` + `z-index` for a multi-layer composition
- Space elements generously — avoid overlap by keeping clear `bottom` gaps
- Place the most important visual element (hero/title) at the highest z-index
- Bottom stripe anchors the design and creates a clear footer zone

### 4. Add Handcrafted Elements

| Technique | CSS Approach |
|-----------|-------------|
| **Grain texture** | SVG `<filter>` with `feTurbulence` + `feColorMatrix` overlaid via `mix-blend-mode: multiply; opacity: 0.2` |
| **Stamp** | Rotated `border: 2mm solid` + `transform: rotate(12deg)` + semi-transparent color + `opacity: 0.6` |
| **Oblique/construction lines** | Thin rotated `div` elements at low opacity (0.06–0.1) |
| **Geometric shapes** | Circles, triangles, bars with `border-radius: 50%` or `clip-path: polygon()` |
| **Underline decoration** | `repeating-linear-gradient` for dashed/bar underline |
| **Reverse text** | White text on dark background block with `padding` |

### 5. Iterative Refinement Loop

This is the core differentiator — iterate like a screen printer:

1. `write_file` → create/update the HTML poster
2. `browser_navigate` → load the HTML in the browser
3. `browser_vision` → ask specific questions about overlap, truncation, readability
4. `patch` → fix positioning, sizing, colors based on feedback
5. Repeat until the composition is clean

**Pro tip**: Always ask browser_vision about these specific failure modes:
- "Est-ce que le texte déborde ou est tronqué ?"
- "Est-ce que deux blocs se chevauchent ?"
- "La hiérarchie visuelle est-elle claire ?"

### 6. Font Selection

For a print-foundry / screen-print aesthetic:

| Use | Font | Weight |
|-----|------|--------|
| Hero letters (large) | Bebas Neue | Bold |
| Flowing title | Playfair Display | 900 italic |
| Body/manifesto | Teko | 300 |
| Tags/subtitles | Teko | 700 |

Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playfair+Display:ital,wght@0,400;0,900;1,900&family=Teko:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 7. PDF Export

The user can export via their browser:
- Ctrl+P (Cmd+P on Mac)
- Choose "Save as PDF"
- Set paper size matching the poster dimensions
- Scale: 100% (not "Fit to page")
- Margins: None

Alternatively, for automated export:
```bash
google-chrome --headless --no-sandbox --disable-gpu \
  --print-to-pdf=/path/to/output.pdf \
  --print-to-pdf-no-header \
  file:///path/to/poster.html
```

### 8. Alternative Mode: Corporate / Business Poster

Not all posters need a risograph aesthetic. For business services, company
pitches, or modern brand posters, use a **dark-theme gradient design** with
CSS Grid for layout — no absolute mm positioning needed.

| Aspect | Handcrafted (Risograph) | Corporate / Business |
|--------|------------------------|---------------------|
| Background | Solid color (cream/beige) | Dark gradient (#0d0d14 → #1a1a2e) |
| Layout | Absolute mm positioning | CSS Grid / Flexbox, `position: relative` |
| Typography | Playfair Display, Bebas Neue, Teko | Space Grotesk + Inter (Google Fonts) |
| Accents | Grain, stamp, oblique lines | Gradient highlights, glassmorphism, subtle glow |
| Colors | 2–4 max muted | Full palette; dark base + gradient accent |
| Logo | Rarely needed | Always include from company website URL |
| Polish | Intentional imperfection + grain | Pixel-perfect, clean, modern |

#### Corporate Poster Workflow

1. **Extract services list** from the company profile / website.
2. **Get the logo URL** — inspect the company website for `<img>` elements.
   Reference it directly: `<img src="https://example.com/img/logo.webp">`.
   WebP renders fine in HTML — no conversion needed.
3. **Build with CSS Grid** — `grid-template-columns: repeat(3, 1fr)` for a
   6-service layout. Use glassmorphism cards (`background: rgba(255,255,255,0.03)`,
   `border: 1px solid rgba(255,255,255,0.06)`).
4. **Dark theme**: deep background (`#0d0d14` → `#1a1a2e`), white text,
   gradient accents via `linear-gradient(135deg, #818cf8, #34d399)`.
5. **French typography (critical)**: Never let an AI image model write French
   text. Models like FLUX 2 Klein hallucinate illegible glyphs and wrong words
   ("Afiaque", "Souverainfté", etc.). All French text must be real HTML text
   with proper Unicode accented characters (é, è, ê, à, ù, ç, ô, î, ï, ü, ë).
   Do a dedicated accent-review pass after writing.
6. **Omit prices** for promotional / discovery posters. Describe services by
   what they do, not what they cost.
7. **Convert to PNG** using Playwright for a full-page capture (see reference
   `french-business-poster-workflow.md`).

#### Playwright screenshot template
```javascript
const { chromium } = require('playwright');
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
const poster = await page.locator('.poster');
const box = await poster.boundingBox();
await page.screenshot({ path: 'output.png', clip: { x: box.x, y: box.y, width: Math.min(box.width, 1200), height: Math.min(box.height, 2000) } });
```
Install: `npm install playwright && npx playwright install chromium`.

## Pitfalls

1. **Overlapping elements**: When blocks use `bottom: Nmm` positioning, calculate
   the full height of each block (font-size × line-height + padding) and ensure
   a gap of at least 10mm between the top of the lower block and the bottom
   of the upper block. **Do not guess** — calculate.

2. **Text truncated in browser preview**: The browser viewport is often smaller
   than the poster. Text that appears "cut off" at the edges is likely within
   the poster bounds. Verify by checking `left` values + element widths against
   poster width. If uncertain, run browser_vision and ask specifically.

3. **Grain texture too heavy**: Start at `opacity: 0.15` for the noise overlay.
   Adjust up or down. Too much grain makes text unreadable; too little makes
   it look flat-digital.

4. **Wrong aspect ratio**: Remember A2 portrait = 420×594 mm, not 594×841 mm
   (which is A1). Verify dimensions before building.

5. **Font flash / FOUT**: Google Fonts may take a moment to load. Acceptable
   for print (the fonts are in the PDF after rendering), but the browser
   preview will flash unstyled text.

6. **Too many colors**: The poster will look like a standard digital design,
   which defeats the purpose. Enforce a 4-color max rule. When in doubt,
   remove a color.

7. **White text on light background**: Ensure the background behind white text
   is truly dark. Test with browser_vision for readability.

## References

- `references/session-lessons-affiche-ia-afrique.md` — Full iteration log from
  the "IA en Afrique" poster session: what went wrong in v1/v2/v3 and how each
  issue was fixed.
