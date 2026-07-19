---
name: cv-document-creation
version: 1.0.0
description: Redact, improve and format professional CVs/Resumes as .docx files, targeting specific job profiles with proper structure, zero emojis, and polished typography using python-docx. Also covers general python-docx document creation (reports, TPs, academic papers) — see references/advanced-docx-formatting.md for table styling, cover pages, and multi-part document patterns.
triggers:
  - improve cv
  - create resume
  - cv professional
  - rediger cv
  - ameliorer cv
  - curriculum vitae
  - job application document
  - cv html
  - cv pdf
  - cv css
  - word document
  - docx
  - rapport
  - travaux pratiques
  - tp
  - academic paper
  - document word
  - generer document
---

# CV Document Creation

Produce high-quality, tailored CVs in **HTML/CSS** (preferred, for A4-ready print-to-PDF) or **.docx** format. Zero emojis, zero Unicode artefacts. Professional typography and clear hierarchy. User strongly prefers HTML/CSS output for browser preview + PDF export.

## Absolute Rules

1. **No emojis anywhere** in the document — titles, contact info, sections, or hobbies.
2. Deliver as **HTML/CSS** unless user explicitly asks for .docx.
3. File named: `CV_<FirstName>_<TargetRole>.html` (e.g., `CV_HansAxel_ProfesseurInformatique.html`). PDF suffix accepted if user explicitly requests PDF output (generate HTML first, then Chrome headless → PDF).
4. For MWANAITECH clients, always confirm file saved to accessible path and deliver via MEDIA/Telegram.

## Prerequisites

- For **HTML/CSS** generation: no extra deps. Chrome/Chromium for PDF export if needed.
  ```bash
  google-chrome --headless --no-sandbox --disable-gpu --print-to-pdf=output.pdf input.html
  ```
- **ImageMagick & PIL**: for circular photo cropping and gold-ring compositing.
  ```bash
  # PIL approach (preferred — no external deps)
  python3 -c "
  from PIL import Image, ImageDraw
  size = 354  # ~30mm @ 300dpi
  img = Image.open('photo.jpg')
  # Square crop + resize
  # Then circular mask + save PNG with alpha
  ...
  ```
- For **.docx** generation: `python-docx` available. Install via uv if missing:
  ```bash
  cd /tmp && uv venv cv_env && source cv_env/bin/activate && uv pip install python-docx
  ```
- Source CV (PDF/image/text) extracted via `pdftotext` or PyMuPDF (`fitz`) if available.

## Workflow

### 1. Extract Source CV Content
Use `pdftotext` (most reliable) or python extraction to get full text:
```bash
pdftotext source.pdf /tmp/cv_raw.txt
```

### 2. Ask Target Role
Before restructuring, confirm with user:
- **Target job title** (e.g., "professeur d'informatique", "technicien reseau", "devops engineer")
- Any missing info: academic degrees, missing experiences, language levels.
- User preference for output format (default HTML/CSS; user may ask for .docx or PDF directly).

### 3. Choose Output Path

#### HTML/CSS (Default — Preferred)
- Write a self-contained A4 HTML file with all CSS inline.
- **Structure**: 2-column (sidebar ~1/3 + content 2/3), dark sidebar (`#0B1021`), gold accent (`#C9A227`).
- **Photo integration** (when user provides a photo):
  1. Crop photo to 1:1 ratio, resize to ~354×354px (30mm @ 300dpi).
  2. Create circular mask (transparent corners) with PIL.
  3. Save as PNG with alpha channel: `cv_photo_round.png`.
  4. In HTML: replace placeholder `<div class="photo">` with `<img class="photo" src="cv_photo_round.png">`.
  5. CSS `.photo` must use `display: block; object-fit: cover; object-position: center top;` (NOT flexbox).
  6. For PDF export: copy photo to same temp dir as HTML, or use `file:///` absolute path.
- **PDF export**: Chrome headless. Photo must be accessible at render time:
  ```bash
  # Method A: copy photo to same dir as HTML
  cp cv_photo_round.png /tmp/
  cp CV_*.html /tmp/
  google-chrome --headless --no-sandbox --disable-gpu \
    --print-to-pdf=/tmp/output.pdf file:///tmp/CV_*.html
  
  # Method B: file:/// absolute path in src
  # <img src="file:///home/user/cv_photo_round.png">
  ```
- See `templates/a4_cv_template.html` for a general starter.
- See `templates/a4_singlepage_cv.html` for a compact single-page CV optimized for tight A4 fitting (used when content is dense and must stay on one page). This template replaces bullet lists with inline descriptions and uses 7pt body text as a baseline.
- Save to user's working dir: `CV_<FirstName>_<Role>.html`
- Deliver PDF via Telegram (sendDocument API).
- If user needs .docx: generate HTML first, then use `pandoc` or manual python-docx conversion.

#### For "Professeur d'Informatique" / IT Trainer
Priority sections:
1. **Contact** — Name, phones, email, city, LinkedIn. Single line, no emojis.
2. **Profil** — 3-4 lines mixing pedagogical identity + technical credibility.
3. **Formation** — Academic path first (priorité métier enseignant).
4. **Expérience Pédagogique** — Teaching roles first, chronologically. Detail: modules taught, class sizes, remediation, evaluation.
5. **Expérience Professionnelle Complémentaire** — Non-teaching IT roles kept but secondary.
6. **Certifications** — Isolated block, bold year.
7. **Compétences** — Table with columns: Domaine | Détails. Include both pedagogical and technical.
8. **Langues & Qualités** — Operational level descriptions.
9. **Informations Complémentaires** — PNPE, mobility, license.

#### Other Roles (Technicien, Dev, etc.)
See `templates/a4_cv_template.html` for a starter template with placeholder variables.

### 5. Typography & Layout

#### HTML/CSS
- Font: Segoe UI, Roboto, Helvetica Neue, Arial sans-serif.
- A4 fixed dimensions: `.page { width: 210mm; height: 297mm; }`
- Dark sidebar: `#0B1021` (near-black blue), accent gold: `#C9A227`
- `-webkit-print-color-adjust: exact; print-color-adjust: exact;` required so colours survive PDF export.
- Section titles: uppercase, left gold border on content titles, bottom gold border on sidebar titles.
- Justified text for body, left-aligned for lists.

#### .docx (Legacy)
- **Font**: Calibri throughout. Headings bold + uppercase with bottom border in dark blue (`#1A236E`).
- **Size hierarchy**: Name 22pt, Role 12pt, Body 10.5pt, Headings 13pt.
- **Tables**: Use for Competences. Shaded header cells with light blue (`#E8EAF6`).
- **Spacing**: Line spacing 1.15, paragraphs tight (space after 2-4pt).
- **Page margins**: 2cm left/right, 1.5cm top/bottom.
- **Alignment**: Left-aligned (never justified, avoids ugly spacing in French).

### 6. Generate Script
Use python-docx with cell shading via OxmlElement and careful rFont setting for non-ASCII characters (French accents).

See `templates/cv_docx_generator.py` for a starter script.

## User-Specific References

For user-specific CV layout preferences confirmed through iteration, see:

- `references/hans-axel-cv-preferences.md` — Hans Axel Mbina Mabicka's validated layout, content, and formatting rules (contact layout, skills content, school names, photo handling, section separation). Load this reference when updating his CV.

## Pitfalls

- **Name/title duplication**: When the CV uses a sidebar + main layout, the name and title must appear ONLY in the sidebar. The main content area starts directly with the profile section. The user will reject a duplicate — confirmed: « mon nom et le titre sont répétés deux fois, ce n'est pas bon ».
- **Contact layout**: Use compact format — label and value on the same line (`<span class="label">Tél :</span> +241 XX XX XX XX`). Do NOT use `<br>` to stack label above value. For two phone numbers, use two separate lines with the same label.
- **Langues / Atouts separation**: These are TWO distinct sections, not one combined « Langues & Atouts » section. The user explicitly requested separation.
- **Photo embed for PDF export**: Base64 data-URI in the HTML is the most reliable approach. File-path methods can fail depending on Chrome headless's working directory. Use base64 for guaranteed rendering.
- **Verify page count after every iteration**: Run `pdfinfo output.pdf | grep Pages` immediately after each Chrome headless export. Do NOT assume the HTML "looks" like one page — A4 overflow is invisible in HTML preview. Stop only when `Pages: 1`.
- **Surgical edits only when requested**: When the user explicitly says "add X but don't change anything else" / "ne changer rien d'autres", make the **absolute minimum edit** to the existing file. Do NOT alter layout, spacing, fonts, colours, structure, or any other content. Paste the exact HTML received, inject only the requested addition, and regenerate PDF. Any redesign or reformatting in this context is a direct violation of the user's instruction.
- **Source certification gaps**: When the source CV lists certifications without issuer or year (e.g., bare course names like "Sensibilisation au numerique"), ask the user to confirm the **issuing organization** and **year** before formatting. Do not leave certifications orphaned without an issuer block.
- **Photo in PDF export fails to render**: Chrome headless cannot load `file:///` paths from outside the same directory or without the `--allow-file-access-from-files` flag. Always copy the photo to the same temp dir as the HTML before PDF export, OR use a data-URI base64 embed (heavy but guaranteed).
  ```bash
  cp cv_photo_round.png /tmp/
  cp CV_*.html /tmp/
  sed -i 's|file:///home/.*/cv_photo_round.png|cv_photo_round.png|g' /tmp/CV_*.html
  google-chrome --headless --no-sandbox --disable-gpu \
    --print-to-pdf=/tmp/output.pdf file:///tmp/CV_*.html
  ```
- **Emojis in source PDF**: Strip all during text extraction. Do NOT copy them into output.
- **Single-page constraint**: The CV MUST fit on exactly one A4 page. NEVER deliver a 2-page CV. If content overflows, compact iteratively using the recipe below.
  - **Iterative compaction recipe** (in order of impact):
    1. Replace bullet lists with inline comma-separated descriptions (saves ~30% vertical space per block).
    2. Replace skill-tag grids / pills with plain text lines or comma-separated lists.
    3. Reduce body font to 7pt (floor), descriptions to 7pt, headings to 8.5pt, sidebar text to 7pt.
    4. Tighten padding: sidebar 6mm/3mm, main 5mm/4mm, section gaps down to 1.5–2mm.
    5. Remove decorative blocks (colored backgrounds on certifications) and keep only border-left accent.
    6. Flatten multi-line formation entries into single lines separated by `<br>`.
  - Only if all above fail: consider removing the least relevant experience entry or merging two short ones.
- **Title (headline) visibility**: The role title below the name must be nearly as prominent as the name itself. Minimum 18px, bold 900, uppercase, letter-spacing. This is non-negotiable — the user will reject a small subtitle.
- **Name formatting consistency**: **NO hyphens** in names unless user explicitly requests them. "Hans Axel Mbina Mabicka" not "Hans-Axel Mbina-Mabicka". Confirm with user before finalizing. This rejection is immediate and strict.
- **Language register**: User demands **formal/sustained French** (français soutenu). Explicitly **forbidden**: "ça" (use "cela"), "il y a" (use "depuis" / "au cours de"), "mise en place" (use "élaboration" / "conception" / "développement"), "pilotage" (use "supervision" / "direction" / "encadrement"), "garantie" (use "veille à" / "assure"), "contribution à" (use "participation à"), "gestion" (use "administration" / "supervision"), "création et pilotage" (use "conception et direction"), "mise en place de supports" (use "élaboration de supports"). Review every sentence for register before delivering. See `references/formal-french-register.md` for the full checklist.
- **pdftotext**: Some characters render as emojis or Unicode art. Always sanitize extracted text before processing.
- **python-docx install**: System pip may be blocked by PEP 668. Use `uv venv` and activate before install.
- **Font fallback for accents**: If accents show as boxes, the rFonts element must specify 'Calibri' for w:hAnsi and w:cs.
- **Image composite side note**: If the CV includes a photo or company logo, see `brand-visual-creation` skill for GraphicsMagick compositing process.
- **MCP Word tools are too slow for bulk content**: When adding >10 paragraphs/headings, building the .docx via individual MCP `mcp_office_word_add_paragraph` / `mcp_office_word_add_heading` calls is pathologically slow (one RPC per paragraph). **Fallback to python-docx instead**: write a single Python script that imports `docx`, builds the full document in one pass, saves it, then convert with LibreOffice headless (`libreoffice --headless --convert-to pdf`). This is 50-100x faster for multi-section reports. See `templates/bulk_docx_generator.py` for a generic reusable script.

## Output Verification
- `file output.docx` must confirm "Microsoft Word 2007+"
- Size between 30-100KB for a text-only CV is normal.

## Related References

- `references/advanced-docx-formatting.md` — Covers general-purpose python-docx patterns beyond CVs: professional cover pages, styled tables with colored headers/alternating rows, mixed-formatting paragraphs, color-coded section headers, callout boxes, A4 page setup, page breaks, bullet lists, and a multi-part document architecture. Use this reference when generating non-CV documents (reports, TPs, academic papers) with python-docx.
