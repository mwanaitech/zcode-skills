---
name: finance
description: Track stocks, ETFs, indices, crypto (where available), and FX pairs with caching + provider fallbacks.

tags:
  - finance
  - stocks
  - trading
  - investing
  - cryptocurrency
  - forex

metadata:
  hermes:
    triggers:
      - finance
      - stock
      - action boursiere
      - stock market
      - marche boursier
      - trading
      - investissement
      - investment
      - portfolio
      - portefeuille
      - etf
      - crypto
      - forex
      - fx
      - indices
      - market data
      - donnees marche
      - stock price
      - cours action
      - bourse
      - financial data
      - donnees financieres
---

# Market Tracker Skill

This skill helps you fetch **latest quotes** and **historical series** for:
- Stocks / ETFs / Indices (e.g., AAPL, MSFT, ^GSPC, VOO)
- FX pairs (e.g., USD/ZAR, EURUSD, GBP-JPY)
- Crypto tickers supported by the chosen provider (best-effort)

It is optimized for:
- fast "what's the price now?" queries
- lightweight tracking with a local watchlist
- caching to avoid rate-limits

## When to use
Use this skill when the user asks:
- "What's the latest price of ___?"
- "Track ___ and ___ and show me daily changes."
- "Give me a 30-day series for ___."
- "Convert USD to ZAR (or track USD/ZAR)."
- "Maintain a watchlist and summarize performance."

## Provider strategy (important)
- **Stocks/ETFs/indices** default: Yahoo Finance via `yfinance` (no key, broad coverage), but it is unofficial and can rate-limit.
- **FX** default: ExchangeRate-API Open Access endpoint (no key, daily update).
- If the user needs high-frequency or many symbols, recommend adding a paid provider later.

See `providers.md` for details and symbol formats.

---

# Quick start (how you run it)
These scripts are intended to be run from a terminal. The agent should:
1) ensure dependencies installed
2) run the scripts
3) summarize results cleanly

Install:
- `python -m venv .venv && source .venv/bin/activate` (or Windows equivalent)
- `pip install -r requirements.txt`

## Commands

### 1) Latest quote (stock/ETF/index)
Examples:
- `python scripts/market_quote.py AAPL`
- `python scripts/market_quote.py ^GSPC`
- `python scripts/market_quote.py VOO`

### 2) Latest FX rate
Examples:
- `python scripts/market_quote.py USD/ZAR`
- `python scripts/market_quote.py EURUSD`
- `python scripts/market_quote.py GBP-JPY`

### 3) Historical series (CSV to stdout)
Examples:
- `python scripts/market_series.py AAPL --days 30`
- `python scripts/market_series.py USD/ZAR --days 30`

### 4) Watchlist summary (local file)
- Add tickers: `python scripts/market_watchlist.py add AAPL MSFT USD/ZAR`
- Remove: `python scripts/market_watchlist.py remove MSFT`
- Show summary: `python scripts/market_watchlist.py summary`

---

# Output expectations (what you should return to the user)
- For quotes: price, change %, timestamp/source, and any caveats (like "FX updates daily").
- For series: confirm date range, number of points, and show a small preview (first/last few rows).
- If rate-limited: explain what happened and retry with backoff OR advise to reduce frequency.

---

# Safety / correctness
- Never claim "real-time" unless the provider is truly real-time. FX open access updates daily.
- Always cache responses and throttle repeated calls.
- If Yahoo blocks requests, propose a paid provider or increase cache TTL.

## Detect Level, Adapt Everything
- Context reveals level: vocabulary, instrument knowledge, professional framing
- When unclear, ask about their role before giving specific advice
- Never provide personalized investment advice; never guarantee returns

## For Regular People: Understanding Without Jargon
- Explain interest rates with real dollar examples — "15% APR on $5,000 means $750/year in interest, $63/month just to stand still"
- Demystify credit scores — explain 5 factors with weights; correct myths (checking score doesn't hurt it, closing old cards can lower it)
- Frame debt decisions as math, not morals — avalanche vs snowball valid for different personalities; compare debt rate to expected return
- Translate tax jargon — "Being in 22% bracket doesn't mean 22% on everything"; show marginal vs effective with examples
- Start investing conversations with "why" before "how" — time-in-market, compound growth, then vehicles
- Provide one immediate action under 10 minutes — not "create a budget" but "track purchases for 2 weeks in notes app"
- Address emotional barriers — acknowledge financial shame; suggest scheduled "money dates" instead of constant anxiety
- Clarify rule vs guideline — "50/30/20 is framework, not law"; "1 month emergency fund beats 0"

## For Students: Foundations and Rigor
- Teach time value of money before anything else — present value, future value, discounting; show formula AND intuition
- Distinguish CAPM assumptions from market reality — model assumes frictionless markets; real markets have taxes, transaction costs
- Connect DCF to valuation practice — walk through building models, choosing discount rate, terminal value pitfalls
- Require explicit assumptions in all calculations — growth rate, discount rate, horizon; flag sensitivity of output to inputs
- Explain efficient market hypothesis levels — weak, semi-strong, strong; evidence for and against each
- Show how textbook models fail — CAPM predicts linear risk-return; actual low-volatility anomaly contradicts this
- Use case method for application — real company, real numbers, real decisions; theory without application is incomplete
- Flag exam-relevant vs practice-relevant — some topics are heavily tested but rarely used; some essentials are undertested

## For Professionals: Decision Support, Not Directives
- Match valuation method to context — DCF for stable cash flows, comps for public transactions, precedent for M&A, asset-based for liquidation
- Always disclose assumptions — discount rate, growth rate, terminal value methodology, comparable selection criteria; state bull/base/bear
- Never guarantee returns — use "historical performance," "projected range," "subject to market conditions"; include risk disclaimers
- Maintain suitability awareness — consider risk tolerance, time horizon, liquidity needs, tax situation before any recommendation
- Reference authoritative sources with dates — SEC filings, Bloomberg data, Fed releases; stale data must be flagged
- Apply appropriate regulatory framework — SEC, FINRA, state regulations; distinguish broker suitability from RIA fiduciary standard
- Use standardized metrics with definitions — P/E trailing vs forward; EBITDA with or without SBC; ensure cross-company comparability
- Present risk-adjusted returns — Sharpe, Sortino, max drawdown alongside raw returns; compare to appropriate benchmark

## For Researchers: Rigor and Evidence
- Classify evidence quality — RCT vs natural experiment vs cross-sectional; address endogeneity explicitly
- Be statistically precise — distinguish statistical from economic significance; report standard errors, confidence intervals
- Acknowledge data mining concerns — out-of-sample testing, multiple hypothesis correction, publication bias
- Cite seminal papers by name — Fama-French three-factor, Carhart four-factor, Jegadeesh-Titman momentum
- Distinguish established findings from contested — value premium debated post-2010; momentum robust across markets
- Use proper event study methodology — market model, CAR vs BHAR, clustering of events
- Address reproducibility — share data sources, code, exact sample construction; replication is foundational
- Maintain epistemic humility — finance theory evolves; be clear on current consensus vs emerging debate

## For Educators: Pedagogy and Progression
- Assess literacy level before explaining — ask if familiar with term; adjust vocabulary accordingly
- Use age-appropriate examples — allowance for young; student loans for college; mortgage for adults
- Provide concrete numbers — "If you invest $1,000 at 7% for 30 years, you'd have $7,612"
- Offer mental models — "snowball" for compound interest, "buckets" for budgeting categories
- Present multiple approaches without advocating — index funds AND individual stocks AND target-date with pros/cons
- Establish foundations before advanced — verify emergency fund and stock understanding before discussing options
- Connect new to understood — bonds as "lending money"; ETFs as "basket of stocks in one purchase"
- Pair benefits with trade-offs — never present any approach as universally optimal

## For Individual Investors: Risk and Discipline
- Ask portfolio size and risk tolerance before position sizing — default to conservative 1-5% per position
- Calculate and communicate downside — "If this goes to zero, you lose $X which is Y% of portfolio"
- Enforce stop-loss discipline — ask "what's your exit plan?" and help define concrete price levels
- Match vehicle complexity to experience — probe derivatives knowledge before discussing options strategies
- Challenge FOMO signals — when "everyone is buying," ask for thesis beyond momentum
- Surface loss aversion bias — "If you had cash now, would you buy this at today's price?"
- Flag wash sale violations — ask about 30-day window purchases before/after loss realization
- Consider tax-lot optimization — acquisition date, cost basis, short-term vs long-term rates

## Always
- Never provide specific investment recommendations for individual situations
- Flag when information may be outdated for rapidly changing markets
- Cite reputable sources; acknowledge uncertainty when data is limited
- Distinguish between legal/regulatory requirements and common practice
