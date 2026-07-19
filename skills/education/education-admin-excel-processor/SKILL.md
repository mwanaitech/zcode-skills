---
name: education-admin-excel-processor
category: education
description: >
  Processeur automatisé de listes d'élèves scolaires au format Excel.
  Lit un fichier source de liste de classe (admis, passants, redoublants, exclus),
  extrait les données par élève, et génère un classeur Excel multi-feuilles
  trié par classe d'affectation finale (4eme, 5eme, etc.).
triggers:
  - User sends an Excel file named like "LISTES DES CLASSES ... ADMIS EN ..." or any school class-roster spreadsheet.
  - User mentions processing a class list (classe admis en Xeme).
  - User says "tiens" and attaches a .xlsx with class data (context-dependent, verify content).
pitfalls:
  - Python may lack openpyxl/pandas on the host. Always have a fallback via LibreOffice headless CSV conversion or manual XML parsing of the .xlsx ZIP.
  - Column positions in source files can shift; verify headers dynamically rather than hard-coding indices.
  - Some cells contain merged labels or stray header rows (e.g. "4EME" as a standalone title row); skip non-data rows by checking presence of the student name column.
  - Text encoding issues appear in shared strings (e.g. "Mediocre" corrupted); validate appreciation strings against expected values.
  - The "Affectation" column can contain values like A, B, C, D, RED A, RED B, EXCLU, or be empty. Always normalize whitespace and handle empty as "Non affecte".
  - LibreOffice CSV conversion output filename matches the input filename base with .csv extension, but spaces and dots in the filename can cause surprises; always verify the generated CSV name.
workflow:
  - Save the attached .xlsx locally if received via chat.
  - Attempt to read with openpyxl. If unavailable, install it via uv venv + uv pip install openpyxl, OR fallback to libreoffice --headless --convert-to csv.
  - Identify the correct worksheet (e.g. "5D", "6C") by listing sheet names.
  - Extract rows, skipping pure header/title rows. Expected data columns are fixed but verify them dynamically.
  - Normalize each row into a dict. Strip whitespace from Affectation. Replace empty affectation with "NON AFFECTE".
  - Group students by Affectation. Expected values include A-D, RED variants, EXCLU.
  - For each group, create a worksheet in a new Workbook following the title and formatting conventions documented in the body.
references:
  - references/libreoffice-csv-fallback.md
  - references/xlsx-xml-manual-parse.md
  - templates/student_list_template.py
---

# Education Admin Excel Processor

## Purpose
Transform a single source Excel file containing a class roster (e.g., "5D Admis en 4eme") into a clean, multi-sheet workbook where each sheet corresponds to a target class assignment (A, B, C, D, RED, EXCLU).

## Prerequisites
- Python with `openpyxl` installed (fallback to LibreOffice headless if missing).
- Source file must contain at minimum: student names and an Affectation column.

## Step-by-step

### 1. Environment Bootstrap
If `openpyxl` is missing, create an isolated venv with `uv` rather than polluting the system Python:
```bash
uv venv /tmp/.venv-xlsx
source /tmp/.venv-xlsx/bin/activate
uv pip install openpyxl
```

### 2. Read the Source
Use `pd.ExcelFile` or `openpyxl.load_workbook` to inspect sheet names. Pick the sheet matching the source class (e.g., "5D"). If libraries are unavailable, convert the target sheet with LibreOffice:
```bash
libreoffice --headless --convert-to csv:"Text - txt - csv (StarCalc)":44,34,76,1 source.xlsx
```

### 3. Parse Rows
Skip title/header rows. Map each data row to:
```python
{
  "num": "",      # row number / ID
  "nom": "",      # full name
  "orig": "",     # source class
  "sexe": "",     # Masculin/Feminin
  "statut": "",   # [T] or [R]
  "moy": "",      # average grade
  "app": "",      # appreciation
  "aff": ""       # target class assignment
}
```

### 4. Group & Sort
Group by `aff`. Sort groups in this order:
- Passants: A, B, C, D
- Redoublants: RED A, RED B, RED C
- Others: EXCLU, (empty -> NON AFFECTE)

### 5. Build Output Workbook
For each group, create a worksheet with:
- **Row 1**: merged title (`LISTES DES CLASSES ANNEE SCOLAIRE 2026-2027`)
- **Row 2**: merged subtitle (`CLASSE DE {source} -> {target}`)
- **Row 4**: headers with blue fill (#3366CC), white bold text, thin borders
- **Rows 5+**: student data, alternating none (or keep plain)
- **Column widths** as specified in workflow

The exact column mapping in the source is:
| Source Col | Meaning | Output Col |
|------------|---------|------------|
| 1 | Numero | A |
| 2 | Nom et Prenoms | B |
| 3 | Classe origine | C |
| 4 | Sexe | D |
| 5 | Statut [T]/[R] | E |
| 6 | Moyenne | F |
| 7 | Appreciation | G |
| 8 | Affectation | H |

### 6. Deliver
Save to the user's home directory and return a summary table + MEDIA path.

## Expected Output Shapes
| Target Class | Sheet Title | Typical Count |
|--------------|-------------|---------------|
| A, B, C, D   | 4A, 4B, ... | ~10           |
| RED A/B/C    | RED A, etc. | 1-3           |
| EXCLU        | EXCLU       | Variable      |

## Troubleshooting
- **Unicode corruption in appreciation**: sharedStrings.xml stores rich text with `<t>` per fragment; concatenate all `<t>` nodes when manually parsing.
- **Missing openpyxl**: use the `uv` venv bootstrap above; do not rely on system pip if PEP 668 is active.
- **LibreOffice CSV name mismatch**: the output file replaces the original extension with `.csv`; special characters in the base name may be preserved differently - always `ls /tmp/*.csv` after conversion.
- **Degree symbol in YAML**: the degree symbol (e.g. "4eme") can corrupt YAML parsers. Use plain ASCII in frontmatter and only the symbol in the markdown body.