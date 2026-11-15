# GEO Doctor — AI Search & ChatGPT Visibility Diagnostic Workbench

**Live Studio:** https://a3152557994-ship-it.github.io/geo-doctor/

**GEO Doctor** diagnoses why e-commerce stores, Shopify brands, and SaaS websites get skipped by **ChatGPT Search, Perplexity, Claude, and Google AI Overviews** — and generates a tailored, zero-error **`llms.txt` + `llms-full.txt` + Schema.org `JSON-LD` + `robots.txt` Fix Pack** in seconds.

> Zero external npm dependencies · Pure client-side HTML parsing · Offline WebCrypto Ed25519 license verification (`OPC1.`).

---

## Why Stores Fail AI Recommendations

1. **Accidental Bot Blocks**: Copying generic anti-scraper `robots.txt` rules that block `OAI-SearchBot`, `GPTBot`, or `PerplexityBot`.
2. **Missing `/llms.txt`**: No curated Markdown summary or link index at site root for autonomous agents.
3. **Broken or Missing `JSON-LD`**: No `Product` / `SoftwareApplication` / `LocalBusiness` entity, missing `Offer` (`price`, `priceCurrency`, `availability`), or missing `FAQPage` Q&A blocks.
4. **Invisible Pricing**: Hiding prices inside hero banner images or client-side JS toggles that crawlers skip.

---

## 12-Point Diagnostic Engine (0–100)

| # | Check | Weight | What It Verifies |
|---|-------|--------|------------------|
| 01 | `OAI-SearchBot` Crawl Access | 10 | Explicit/wildcard allow status for ChatGPT real-time search |
| 02 | AI Crawlers Policy | 12 | `GPTBot`, `ClaudeBot`, `PerplexityBot` access policy |
| 03 | `/llms.txt` Structure | 14 | Presence, `# H1`, `> Summary`, `## Sections`, and Markdown links |
| 04 | Core `JSON-LD` Entity | 14 | Valid `Product` / `SoftwareApplication` / `LocalBusiness` |
| 05 | `Offer` Machine Readability | 8 | `price`, `priceCurrency`, and `availability` |
| 06 | `FAQPage` Structured Signal | 8 | Extractable `Question` + `acceptedAnswer` pairs (`>= 2`) |
| 07 | `AggregateRating` Trust Signal | 6 | Verifiable `ratingValue` and `reviewCount` / `ratingCount` |
| 08 | `<title>` & Meta Intent Match | 7 | Clear category + value positioning in metadata |
| 09 | `rel="canonical"` & `og:url` | 5 | Absolute canonical alignment |
| 10 | Semantic Heading Hierarchy | 5 | Unique `<h1>` and descriptive `<h2>` structure |
| 11 | First-Screen Plaintext Pricing | 6 | Numeric price, currency, and purchase CTA in initial HTML |
| 12 | `sitemap.xml` & `hreflang` | 5 | Sitemap declaration and multilingual discovery tags |

---

## Dual-Mode Workflow

- **Mode A (Live URL Probe)**: Concurrently probes HTML, `/robots.txt`, `/llms.txt`, and `/sitemap.xml` (direct fetch first, CORS-enabled `r.jina.ai` fallback when blocked, never fabricates results).
- **Mode B (100% Offline Source Audit)**: Paste raw HTML + `robots.txt` + optional `llms.txt` to bypass strict Shopify/Cloudflare WAF blocks. Includes **3 one-click sample fixtures**:
  1. Broken indie store (blocks `GPTBot`, missing Schema & `llms.txt`)
  2. Average Shopify store (partial `Product` JSON-LD, no `llms.txt` or `FAQPage`)
  3. AI-ready 100/100 benchmark store

---

## Pricing & Conversion Model

- **Free Diagnostic + Sunk-Cost Preview ($0)**: Full 0–100 score, all 12 diagnostic items, and the **first 10 lines of your custom-generated `/llms.txt`**.
- **Single-Site One-Click Fix Pack ($29 USD / ¥99 CNY, one-time)**:
  - Unlocks full `/llms.txt` and `/llms-full.txt`
  - Unlocks valid `<head>` `JSON-LD` `@graph` (`Organization`, `WebSite`, `Product`/`SoftwareApplication`, `Offer`, `FAQPage`)
  - Unlocks AI-friendly `robots.txt` patch (preserving private `/admin` / `/cart` rules)
  - Unlocks **20 tailored buyer-intent prompts** to track your brand across ChatGPT & Perplexity
- **Shopify / WordPress Done-For-You ($199 USD / ¥499 CNY)**:
  - Full Fix Pack + manual `theme.liquid` / WordPress injection + Rich Results verification + 2 post-delivery revisions.

---

## Local Development & Tests

Requires Node.js >= 20 (tested on Node 24) with **zero external packages**:

```bash
npm test
```

Serve `docs/` locally with any static server:

```bash
npx serve docs
```

### Repository Layout

- `src/auditor.mjs` & `docs/auditor.js` — Isomorphic 12-check GEO diagnostic engine, asset generator, and WebCrypto Ed25519 verifier
- `docs/index.html`, `docs/app.js`, `docs/style.css` — Bilingual (`中文` / `EN`) Editorial Diagnostic Studio (itself a 100/100 self-audited benchmark)
- `docs/llms.txt`, `docs/robots.txt`, `docs/sitemap.xml` — Machine-readable discovery files
- `tests/geo-doctor.test.mjs` — Unit tests for scoring, JSON-LD parsing, `robots.txt` group precedence, Ed25519 verification (`node:crypto` + `crypto.subtle`), and 100/100 self-benchmark
- `release/LAUNCH_KIT.md` — Launch copy templates for Product Hunt, Reddit, and Xiaohongshu
