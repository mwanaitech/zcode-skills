---
name: academic-presentation-templates
description: Generate academic defense (soutenance) PowerPoint templates with projector-safe, low-saturation color palettes using python-pptx.
trigger: |
  When the user needs to create, generate, or design PowerPoint templates for
  academic presentations, thesis defenses (soutenance de mémoire / thèse),
  dissertation defenses, or any scholarly presentation. Also triggered when the
  user asks for projector-friendly slides, muted color palettes, low-saturation
  slide designs, or academic defense layouts.
goals:
  - Generate professional academic presentation templates programmatically.
  - Apply projector-safe, low-saturation color palettes.
  - Structure slide decks following standard French academic defense flow.
---

# Academic Presentation Templates

## 1. Context & Constraints

Academic defenses (soutenances) are projected in lecture halls where bright or
highly saturated colors appear washed out, glare, or strain the eye. The primary
constraint is **visibility on a projector**, not screen beauty.

### Color Rules for Projector Safety
- **Avoid**: bright reds, neon greens, electric blues, pure black-on-white at
  full contrast, glossy gradients.
- **Prefer**: deep desaturated tones (navy, forest, charcoal, bordeaux, petrol),
  off-whites / ivories for backgrounds, and muted complementary accents.
- **Contrast**: dark text on light background OR light text on dark background.
  Mid-tone-on-mid-tone is fatal in a bright room.
- **Saturation**: keep RGB channels close to each other within a hue family;
  e.g. forest `#2D4A3D` rather than `#007F00`.

## 2. Proven Palettes (Low Saturation)

| Name | Primary | Secondary | Accent | Background |
|------|---------|-----------|--------|------------|
| Bleu Marine | `#1B2A4A` | `#C0C5CE` | `#3D5A80` | white / `#F8F9FA` |
| Vert Forêt | `#2D4A3D` | `#E8E4E1` | `#6B8E7B` | `#FAF8F5` |
| Anthracite | `#2C2C2C` | `#D4D4D4` | `#7A7A7A` | `#F5F5F5` |
| Bordeaux | `#4A1C2C` | `#F0E6D8` | `#8B5A5A` | `#FAF6F1` |
| Bleu Pétrole | `#1F3A3D` | `#F5F0E6` | `#3C6E71` | `#FAF8F5` |

## 3. Standard Slide Structure (20 slides)

A complete soutenance deck should follow this flow:

1. **Titre** — title slide with candidate name, director, academic year.
2. **Sommaire** — plan / agenda.
3. **Introduction** — opening statement.
4. **Contexte** — problem background.
5. **Problématique** — research question.
6. **Objectifs** — goals.
7. **Méthodologie** — methods adopted.
8. **Cadre théorique** — theoretical framework.
9-11. **Résultats** — 3 result slides.
12-13. **Graphiques** — chart placeholders.
14. **Tableau** — recap table.
15. **Discussion** — interpretation.
16. **Synthèse** — summary.
17. **Limites** — study limitations.
18. **Perspectives** — future work.
19. **Conclusion** — closing.
20. **Remerciements / Questions** — end slide.

## 4. Implementation via python-pptx

### Setup
```bash
python3 -m venv ~/.pptx_venv
~/.pptx_venv/bin/pip install python-pptx
```

### Key Patterns
- Always set slide dimensions explicitly to widescreen:
  ```python
  prs.slide_width = Inches(13.333)
  prs.slide_height = Inches(7.5)
  ```
- Use `RGBColor(0xRR, 0xGG, 0xBB)` for exact palette control.
- For projector safety, avoid transparency effects; use solid fills.
- Use `MSO_SHAPE.RECTANGLE`, `OVAL`, `ISOSCELES_TRIANGLE` for subtle geometric
decoration — no photos or complex textures that may pixelate.

### Title Slide Recipe
- Dark background with light text **OR** light background with dark accent band.
- Minimal geometric decoration (one shape maximum).
- Footer line with candidate name, director, year.

### Content Slide Recipe
- Persistent thin header bar or side bar in primary color.
- Title in primary color or white-on-primary.
- Slide number in a discreet location.
- Content zone with generous margins (≥0.6 inch).
- Footer bar or text with defense label and year.

## 5. Pitfalls

1. **Bright accents**: Users may ask for "professional but colorful". Re-explain
   that projector rooms crush saturation; propose muted tones instead.
2. **Python-pptx not installed**: System Python may be PEP 668 restricted. Always
   use a venv or `uv`.
3. **Shape ordering**: Decorative background shapes must be sent to the back
   (`slide.shapes._spTree.insert(2, shape._element)`) or they overlay text.
4. **Font availability**: Stick to Calibri / Calibri Light — preinstalled on all
   recent Windows and most Linux systems via `fonts-croscore`.

## 6. Programmatic Generation Scripts

The five palette scripts generated in this session can be found in the skill
`templates/` directory as `modele_2_bleu_marine.py`, `modele_3_vert_foret.py`,
`modele_4_anthracite.py`, `modele_5_bordeaux.py`, and `modele_6_petrole.py`.
They generate 20-slide decks following the structure above.

## 7. References

- `templates/modele_2_bleu_marine.py` — Navy & Silver palette generator
- `templates/modele_3_vert_foret.py` — Forest & Pearl palette generator
- `templates/modele_4_anthracite.py` — Charcoal & White palette generator
- `templates/modele_5_bordeaux.py` — Bordeaux & Beige palette generator
- `templates/modele_6_petrole.py` — Petrol & Ivory palette generator
