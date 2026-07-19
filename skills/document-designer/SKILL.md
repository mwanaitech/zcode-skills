---
name: document-designer
description: High-fidelity document generation (CV, Pitch Decks, Reports) following visual models.
triggers: ["refais mon CV", "fais moi une présentation", "suis ce modèle", "crée un doc", "make a pitch deck"]
---
# SKILL.md

## Overview
**Document Designer** is a high-fidelity document generation skill for creating professional-grade documents (CVs, Pitch Decks, Reports, etc.) that strictly adhere to user-provided visual models. It moves beyond simple text generation by using programmatic libraries (`python-docx`, `python-pptx`) and AI-generated assets to replicate complex layouts, typography, and branding.

## Triggers
- "refais mon CV" / "improve my CV"
- "fais moi une présentation" / "create a presentation"
- "suis ce modèle" / "follow this model"
- "crée un doc" / "create a document"
- "make a pitch deck"

## Workflow
1. **Model Analysis**:
   - If a visual model (image) is provided, prioritize `vision_analyze`.
   - **CRITICAL FALLBACK**: If vision fails or is unavailable, use `tesseract` via `terminal` to perform OCR. Analyze the spatial arrangement (columns, headers, indentations) from the text structure.
2. **Layout Extraction**:
   - Define the document architecture: Number of columns, margins, header/footer presence, and font hierarchy (H1, H2, Body).
   - Identify the color palette (Primary, Secondary, Accent).
3. **Asset Generation**:
   - If the document requires a professional aesthetic (e.g., Pitch Deck), use `image_generate` to create high-end, cinematic backgrounds.
   - Use `image_generate` for brand-aligned textures or icons if needed.
4. **Programmatic Construction**:
   - **For Documents (.docx)**: Use `python-docx`. Implement tables for complex layouts (like CV skill grids) and custom paragraph styles for headers/lines.
   - **For Presentations (.pptx)**: Use `python-pptx`. Implement background image overlays, text boxes with transparency, and professional transitions/layouts.
5. **Verification**:
   - Ensure the final file is downloadable and matches the requested format.

## Règles Strictes pour MWANAITECH
- **Pas d'emojis/Unicode** : Aucun emoji ou caractère Unicode décoratif (ex : ✅, ⚠️, 🚀) dans les documents.
- **Livraison directe** : Les fichiers générés (`.docx`, `.pptx`, `.pdf`) doivent être envoyés **directement dans Telegram** (pas de lien, pas de description supplémentaire).
- **Pas de duplication** : Ne jamais envoyer deux fois le même contenu (ex : texte + MEDIA du même fichier).

## Pitfalls
- **Text-Only Fallback**: Never just output Markdown for a document task. The deliverable must be a real file (`.docx`, `.pptx`, `.pdf`).
- **Ignoring Layout**: When a user says "follow this model", they mean the *structure*. Don't just copy the text; copy the *look*.
- **Font/Emoji Clashes**: Avoid using emojis in professional documents (CVs/Reports) unless explicitly requested. Use clean typography instead.
- **Scale/Margin Issues**: Always set explicit margins and column widths to prevent the "wall of text" effect.

## References
- `references/layout-extraction-workflow.md`: Detailed guide on using OCR to reconstruct layouts.
