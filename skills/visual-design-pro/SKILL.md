---
name: visual-design-pro
description: Expert in high-end visual asset creation (Presentations, CVs, Branding, Banners).
---
# Visual Design Pro
Expert in high-end visual asset creation (Presentations, CVs, Branding, Banners).

## Core Principles
- **Split Layout Principle**: For presentations, use a 50/50 or 60/40 split between a high-quality image and a text block. Avoid "all-dark" or "all-text" slides.
- **The "Anti-Void" Rule**: Avoid monotone dark backgrounds that lack depth. Use cinematic lighting, gradients, and light-leak elements.
- **Professional Logo Integration**: Never just "paste" a logo. Use blending, shadows, or glow effects to make it feel part of the scene.
- **Typography Hierarchy**: Use clear font-size scaling (Title > Subtitle > Body) and professional sans-serif fonts (Calibri, Arial, Inter).

## Workflows
### Presentation Design (PPTX)
1. Generate high-quality, context-aware background images using AI (FLUX/FAL).
2. Create a split-layout template (Image | Text) using `python-pptx`.
3. Apply a semi-transparent dark overlay to the image side for text legibility.
4. Integrate branding (logo) with a subtle glow or shadow.

### Document Design (CV/Reports)
1. Prioritize a single-page, high-density, clean layout.
2. Use professional typography (no emojis, no weird Unicode).
3. Structure with clear headers and horizontal separators.

## Pitfalls
- **The "Amateur Paste"**: Placing a logo with a visible white background. Fix: Remove background or use `gm composite` with transparency/blending.
- **The "Black Void"**: Too much dark space without texture. Fix: Add "particles", "bokeh", or "gradients".
- **The "Text Clash"**: Text on top of busy images. Fix: Use overlays or split layouts.
- **Python-PPTX Syntax Error**: Ensure `add_run()` is called on a paragraph object with exactly one string argument.
