---
name: brand-visual-creation
version: 1.0.0
description: Create professional brand visual assets (banners, logos on AI backgrounds, social media visuals) by combining FAL.ai image generation with GraphicsMagick compositing.
triggers:
  - brand visual
  - logo banner
  - social media image
  - create visual
  - banner
  - composite logo
  - brand asset
  - visuel marque
  - affiche
  - flyere
  - couverture
  - header
  - story
---

# Brand Visual Creation

Produce polished brand visuals for MWANAITECH or other clients by mixing **AI image generation** (FAL.ai FLUX 2 Klein) and **GraphicsMagick** post-processing.

## Absolute Rules

1. **NEVER create, generate or send anything without explicit user instruction.** Wait for direct confirmation before executing.
2. **Zero emojis** in filenames, prompts overlays, or delivered files unless explicitly requested.
3. Send all deliverables as **MEDIA:<path>** directly in the chat.

## Prerequisites

- `image_generate` tool active (FAL.ai FLUX 2 Klein via Nous subscription)
- GraphicsMagick (`gm`) installed locally (`gm version` to check)
- User logo file path known (e.g., from memory or user message)

## Workflow

### 1. Gather Requirements
Ask the user **before generating**:
- Ratio: `square` (1:1), `landscape` (16:9/websites), or `portrait` (9:16/stories)?
- Style brief: colours, mood (e.g. "African tech futuristic", "corporate minimal", "academic").
- Logo placement: bottom-left, bottom-right, top-centre, centred?
- Text overlay needed? (If yes, prefer GM text or generate text-free and add later.)

### 2. Generate Base Image
Use `image_generate` with a rich prompt including:
- Brand palette (e.g. midnight blue, gold `#D4AF37`, teal `#008080`).
- 3D style descriptors: wireframe, holographic, glass-morphism, cinematic lighting, volumetric god rays.
- No watermark, no text, ultra-clean, octane quality.

Save output URL to a temporary PNG (`/tmp/base_<name>.png`).

### 3. Prepare Logo
1. Identify the logo file (commonly `logo-mwanaitech.jpg` or cache image).
2. Clean: remove white/pale background for transparent compositing:
   ```bash
   gm convert logo.jpg -fuzz 15% -transparent white logo_clean.png
   ```
3. Resize with high-quality anti-aliasing:
   ```bash
   gm convert logo_clean.png -resize 320x320 -filter Lanczos logo_320.png
   ```

### 4. Enhance Logo (Glow Badge)
Create a subtle glow behind the logo so it pops on dark AI-generated backgrounds:
```bash
gm convert -size 360x360 xc:none \
  -fill "rgba(212,175,55,0.12)" -draw "circle 180,180 180,0" \
  -blur 0x20 glow_badge.png
```

### 5. Composite
```bash
gm composite -compose Over -gravity SouthWest -geometry +60+60 glow_badge.png base.png tmp.png
gm composite -compose Over -gravity SouthWest -geometry +80+80 logo_320.png tmp.png final.png
```
Gravity options: `North`, `SouthWest`, `SouthEast`.
Deliver final file to user as MEDIA.

## Pitfalls & Constraints

- **FAL.ai image-to-image / reference images** require a local `FAL_KEY`; the Nous-managed FAL proxy does **not** support `reference_image_urls` or editing. Always generate base with text-to-image, then composite with GM.
- Do **not** use `-composite` inside a `gm convert` command; it is a separate `gm composite` binary operation.
- White backgrounds on logos look "null et grave null" on dark AI backgrounds. Always remove white first.
- If `gm convert` fails with "Unrecognized option", that option is not available in GraphicsMagick (e.g., `-unique-colors`, `-composite`). Use alternative pipelines.
- Cache directory `/tmp` is fine for intermediates. Final deliverables should land in `/home/gibson/` or `/opt/data/` as appropriate.

## Verification
After compositing, run `gm identify final.png` to confirm dimensions and colour depth before delivery.
