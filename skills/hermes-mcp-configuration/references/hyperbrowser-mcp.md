# Hyperbrowser MCP Server

**Source:** https://github.com/hyperbrowserai/mcp
**Package:** `hyperbrowser-mcp` on npm
**Runtime:** Node.js (TypeScript)

## What it does

Cloud-based browser automation for web scraping, structured data extraction, and crawling. Handles JavaScript-rendered pages, CAPTCHAs, proxies, and stealth mode.

## Tools Exposed

| Tool | Purpose |
|------|---------|
| `scrape_webpage` | Get content from a URL (markdown, html, links, screenshot) |
| `extract_structured_data` | Extract data from URLs with a prompt and optional JSON schema |
| `crawl_webpages` | Navigate multiple pages, optionally following links |

## Session Options

All tools accept these optional settings:
- `useStealth: bool` — evade bot detection
- `useProxy: bool` — route through proxies
- `solveCaptchas: bool` — auto-solve CAPTCHAs
- `acceptCookies: bool` — handle cookie consent popups

## Installation

Requires Node.js v14+. No local install needed — runs via npx.

## Hermes Configuration

```yaml
mcp_servers:
  hyperbrowser:
    command: npx
    args: ["-y", "hyperbrowser-mcp"]
    enabled: true
```

## API Key

Must be set in `~/.hermes/.env`:

```
HYPERBROWSER_API_KEY=hb_your_key_here
```

Get a key from https://app.hyperbrowser.ai/ — free tier available.

## Verification

```bash
hermes mcp list | grep hyperbrowser
# Expected: hyperbrowser   npx   all   ✓ enabled
```

## Notes

- **Paid service**: Requires a Hyperbrowser account with credits. The MCP tool talks to their cloud API.
- **Replaces web_extract**: For complex JS pages that `web_extract` can't handle, hyperbrowser with `useStealth: true` and `solveCaptchas: true` is more reliable.
- **Crawling limits**: Default max 10 pages per crawl. Adjust with `maxPages` parameter.
