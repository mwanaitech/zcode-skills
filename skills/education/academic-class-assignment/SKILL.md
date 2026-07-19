---
name: academic-class-assignment
description: Extract, classify, and generate student class assignment spreadsheets from multi-sheet Excel workbooks for school administrative workflows.
title: Academic Class Assignment Processor
trigger:
  - Process school class lists from Excel
  - Generate student assignment files
  - Extract passants redoublants exclus
  - School class assignment Excel
  - AFFECTATION classes
  - LISTES DES CLASSES
  - Sort students by target class
maintainers: [agent]
---

# Academic Class Assignment Processor

Skill for extracting, classifying, and generating student class assignment spreadsheets from multi-sheet Excel workbooks. Common in Gabonese/Central African school administrative workflows.

## Trigger Conditions

Load this skill when the user asks to:
- Process `LISTES DES CLASSES` or `AFFECTATION` Excel files
- Extract students from multiple class sheets (6A, 6B, 5A, 5B, etc.)
- Classify students as **passants** (promoted), **redoublants** (repeating), or **exclus** (excluded)
- Generate a sorted assignment workbook by target class
- Combine data from feeder classes (e.g., 6ème → 5ème) with current-class redoublants

## Key Domain Concepts

| Term | Meaning |
|------|---------|
| **Passant** | Student with sufficient grade → promoted to next level |
| **Redoublant** | Student with failing grade → repeats same class |
| **Exclu** | Student excluded from progression |
| **Opinion** | Final evaluation: *Très Bien*, *Bien*, *Assez Bien*, *Passable*, *Insuffisant*, *Médiocre* |
| **Affectation** | Target class assignment (A, B, C, D or RED A/B/C/D, EXCLU) |
| **Classe d'origine** | Source class (e.g., 6A, 5B) |
| **Nouvelle classe** | Target class (e.g., 5A, 4B) |

## Standard Sheet Layout (openpyxl)

Most source workbooks follow this pattern per sheet:
- Column B (index 1): `Nom et Prénoms`
- Column C (index 2): `Classe d'origine`
- Column G (index 6): `Opinion`
- Column H (index 7): `Affectation` (A/B/C/D, RED A/B/C/D, or EXCLU)

> Always verify indices by printing the first few rows of each sheet before bulk processing.

## Workflow

### 1. Discover Sheets
List all sheets and identify which are in scope:
```python
wb = openpyxl.load_workbook(path, data_only=True)
print(wb.sheetnames)
```

Typical naming:
- Feeder classes: `6EA`, `6EB`, `6EC` → students entering target level
- Current classes: `5A`, `5B`, `5C`, `5D` → students already at target level
- RED/EXCLU sheets may exist as standalone sheets or be inline in class sheets

### 2. Extraction Logic

For **feeder sheets** (e.g., 6ème → 5ème):
- Iterate rows
- Skip empty/short names
- `affect` in `('A','B','C','D')` → passant, map to target level (e.g., `5{affect}`)
- `affect` contains `RED` → redoublant at feeder level (ignore for target-level file)
- `affect` contains `EXCLU` → excluded (ignore unless explicitly requested)

For **current-level sheets** (e.g., 5A–5D):
- `affect` in `('A','B','C','D')` → passant to next level (e.g., `4{affect}`) — **ignore for target-level file unless explicitly requested**
- `affect` contains `RED` → redoublant, stays in same class (`5{sheet_name[-1]}`)
- `affect` contains `EXCLU` → excluded

> **CRITICAL**: Clarify with the user whether the output file should include:
> - (a) Only students *entering* the target level (passants from below + redoublants at target level)
> - (b) Students *leaving* the target level (passants to next level)
> - (c) Both

### 3. Normalisation
- Strip extra whitespace: `' '.join(nom.split())`
- Clean affectation: `affect.upper().replace(' ', '')`
- Handle encoding artifacts (�) gracefully — do not crash, preserve the name as-is

### 4. Sorting
Sort first by target class, then alphabetically by name:
```python
order_map = {'5A': 0, '5B': 1, '5C': 2, '5D': 3}
records.sort(key=lambda x: (order_map.get(x['target'], 99), x['name']))
```

### 5. Output Workbook
- Single sheet named `AFFECTATION {NIVEAU}`
- Columns: `Nom et Prénoms`, `Opinion`, `Classe d'origine`, `Nouvelle classe d'affectation`
- Save with explicit absolute path

## Pitfalls

1. **Affectation values have spaces**: `' RED A'` or `' RED B'` → always `.strip().upper().replace(' ', '')`
2. **Missing origin class**: Some rows have `None` in the origin column → default to the sheet name
3. **Mixed encodings**: Names may contain `ï¿½` artifacts from Latin-1/UTF-8 mismatches → openpyxl handles this, just preserve
4. **Scope confusion**: The same workbook contains data for multiple levels (6ème, 5ème, 4ème) — be precise about which level the user wants
5. **Empty rows after data**: Sheets often have blank rows at the end; filter by `len(nom) < 5` or similar

## Verification Checklist

After generating the file:
- [ ] Total row count matches expected (sum of passants + redoublants)
- [ ] No duplicates in names (print `len(set(names)) == len(names)`)
- [ ] Distribution across target classes is balanced-ish
- [ ] File size > 0 and `openpyxl` can reload it
- [ ] Redoublants are explicitly listed for the user if requested

## Dependencies
- `openpyxl` (Python)