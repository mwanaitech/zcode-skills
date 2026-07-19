# Hyperbrowser MCP Server

Cloud-based browser automation MCP server. Provides scraping, structured data extraction, and crawling via managed browsers with proxy/CAPTCHA/stealth support.

## Quick Reference

| Item | Value |
|------|-------|
| Package | `@hyperbrowserai/mcp` (npm) |
| Run command | `npx -y hyperbrowser-mcp` |
| API key env var | `HYPERBROWSER_API_KEY` |
| GitHub | `hyperbrowserai/mcp` |
| Language | TypeScript |
| Website | https://hyperbrowser.ai |
| Cost | Paid service (free tier available) |

## Installation

No explicit install needed — `npx` downloads and caches. The API key is the only setup requirement.

## Hermes Config

```bash
hermes config set mcp_servers.hyperbrowser.command npx
hermes config set mcp_servers.hyperbrowser.args '["-y","hyperbrowser-mcp"]'
hermes config set mcp_servers.hyperbrowser.enabled true
```

## Credential Setup

Add API key to `~/.hermes/.env`:

```bash
echo "HYPERBROWSER_API_KEY=hb_xxxxxxxxxxxxxxxxxxxx" >> ~/.hermes/.env
```

Get API key from https://app.hyperbrowser.ai/ → API Keys section.

## Tools Provided

| Tool | Description |
|------|-------------|
| `scrape_webpage` | Retrieve content from a URL (markdown, html, links, screenshot) |
| `extract_structured_data` | Extract data from URLs by prompt + optional JSON schema |
| `crawl_webpages` | Crawl a site following links, with pagination limits |

### Session Options (common to all tools)

| Option | Type | Description |
|--------|------|-------------|
| `useStealth` | boolean | Make browser detection harder |
| `useProxy` | boolean | Route through proxies |
| `solveCaptchas` | boolean | Auto-solve CAPTCHAs |
| `acceptCookies` | boolean | Auto-handle cookie popups |

### Example: Extract product data

```json
{
  "urls": ["https://example.com/products/*"],
  "prompt": "Extract product name, price, and description",
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "price": { "type": "number" },
      "description": { "type": "string" }
    }
  },
  "sessionOptions": { "useStealth": true }
}
```

## Platform Compatibility

| OS | Status |
|---|--------|
| Linux | ✅ Works (Node.js required) |
| macOS | ✅ Works |
| Windows | ✅ Works |

**Prerequisites:** Node.js v14+ and npm.

## Pricing

Hyperbrowser is a paid service. Check https://hyperbrowser.ai/pricing for current tiers. Free tier typically includes limited credits/month.

## Pitfalls

| Problem | Cause | Solution |
|---------|-------|----------|
| `HYPERBROWSER_API_KEY not set` | API key not in .env | Add key to `~/.hermes/.env` |
| `npx: command not found` | Node.js not installed | `sudo apt install nodejs npm` |
| Quota exceeded | Free tier exhausted | Upgrade plan or wait for reset |
| CAPTCHA still triggered | `solveCaptchas` not set | Add `"sessionOptions": {"solveCaptchas": true}` |
