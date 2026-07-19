# Office-Word MCP Server

Pure Python MCP server for creating, reading, and manipulating .docx files. Uses `python-docx` — no LibreOffice, OnlyOffice, or Microsoft Word needed.

## Quick Reference

| Item | Value |
|------|-------|
| PyPI package | `office-word-mcp-server` |
| CLI binary | `word_mcp_server` |
| Latest version | 1.1.11 (2025-12-31, repo archived) |
| GitHub | `GongRzhe/Office-Word-MCP-Server` (archived, read-only) |
| Language | Python (python-docx) |
| License | MIT |

## Installation

```bash
pipx install office-word-mcp-server
```

PEP 668 (Debian/Ubuntu) blocks system pip — pipx is the correct workaround.

## Hermes Config

```bash
hermes config set mcp_servers.office-word.command word_mcp_server
hermes config set mcp_servers.office-word.enabled true
```

If `word_mcp_server` isn't found in PATH, use the absolute path:

```bash
hermes config set mcp_servers.office-word.command "/home/gibson/.local/bin/word_mcp_server"
```

## Tools Provided

| Tool | Description |
|------|-------------|
| `create_document` | New .docx with optional metadata (title, author) |
| `add_paragraph` | Paragraph with font/size/bold/italic/color/style |
| `add_heading` | Heading level 1-9 with font formatting |
| `add_table` | Table with rows/cols/data |
| `add_picture` | Insert image with proportional scaling |
| `add_page_break` | Page break |
| `format_text` | Bold/italic/underline/color/font on text range |
| `format_table` | Borders, shading, column widths |
| `highlight_table_header` | Header row with custom colors |
| `apply_table_alternating_rows` | Alternating row colors |
| `search_and_replace` | Find and replace text |
| `convert_to_pdf` | .docx → PDF conversion |
| `add_footnote` / `add_endnote` | Footnotes and endnotes |
| `protect_document` | Password protection |
| `get_document_text` | Full text extraction |
| `get_document_outline` | Structure/headings |
| `merge_table_cells` | Horizontal/vertical/rectangular merge |
| `set_table_column_width` | Column width in points/percentage |

## Platform Compatibility

| OS | Status |
|---|--------|
| Linux (any distro, incl. Mint/Ubuntu) | ✅ Works (pure Python) |
| macOS | ✅ Works |
| Windows | ✅ Works (no MS Word needed) |
| Docker | ✅ Dockerfile provided in repo |

## Limitations

- The repo is **archived** (no further development). The v1.1.11 release is stable.
- Cannot open or manipulate **open** documents (no LibreOffice/MS Word interop) — works on .docx files at rest.
- PDF conversion uses python-docx's internal PDF export (basic quality).
