# Office-Word MCP Server

**Source:** https://github.com/GongRzhe/Office-Word-MCP-Server (archived Mar 2026)
**Package:** `office-word-mcp-server` on PyPI
**Runtime:** Python (python-docx)

## What it does

Creates, reads, and manipulates Microsoft Word (.docx) documents programmatically without any office suite. Pure Python — no MS Word, LibreOffice, or OnlyOffice needed.

## Capabilities

- Create documents with metadata (title, author)
- Add paragraphs, headings, tables, images, page breaks
- Format text (bold, italic, underline, color, font)
- Table operations (merge cells, column widths, shading, borders)
- Footnotes and endnotes
- Search and replace
- Convert to PDF
- Document protection (password)
- Comment extraction
- Lists (bulleted, numbered)
- Custom styles

## Installation

```bash
pipx install office-word-mcp-server
```

The binary `word_mcp_server` is now available in PATH.

## Hermes Configuration

```yaml
mcp_servers:
  office-word:
    command: word_mcp_server
    enabled: true
```

No API keys needed — works entirely offline.

## Verification

```bash
# Test the binary
word_mcp_server --help
# Should show FastMCP banner with "Word Document Server"

# Check Hermes integration
hermes mcp list | grep office-word
# Expected: office-word   word_mcp_server   all   ✓ enabled
```

## Notes

- **Repo archived**: The GitHub repo is read-only since March 2026. The PyPI package (v1.1.11) still works. No active development expected.
- **No file watching**: Creates/modifies files only when you call a tool. Does NOT auto-save or watch directories.
- **Compatibility**: Works on any platform with Python 3.8+. Tested on Linux Mint, Ubuntu, macOS, Windows.
- **Output files**: Documents are saved to the path you specify. Use absolute paths to avoid ambiguity.
