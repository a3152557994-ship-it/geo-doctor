# GEO Doctor — Launch Kit (Product Hunt · Reddit · 小红书)

> Live URL: `https://a3152557994-ship-it.github.io/geo-doctor/`
> Pricing: **$29 / ¥99** Single-Site Fix Pack · **$199 / ¥499** Shopify/WordPress Done-For-You Deployment

---

## 1. Product Hunt — Tagline, Description & Maker First Comment

**Tagline (<= 60 chars):**
`See why ChatGPT skips your store + fix llms.txt & JSON-LD`

**Short Description:**
`A browser-local 12-point GEO diagnostic workbench for Shopify, indie stores, and SaaS. Audit OAI-SearchBot, /llms.txt, Product/Offer/FAQPage JSON-LD, and plaintext pricing—then unlock your tailored Fix Pack ($29) with zero monthly subscription.`

**Maker First Comment:**
```markdown
Hey Product Hunt! 👋

Over the last few months, we audited dozens of Shopify and indie SaaS landing pages to see why competitors were getting recommended in ChatGPT Search and Perplexity while better products were completely invisible.

Almost every low-scoring store had the exact same 4 invisible bugs:
1. They copied a boilerplate `robots.txt` blocking `OAI-SearchBot` or `GPTBot`.
2. They had no `/llms.txt` index for AI agents to scan products and pricing quickly.
3. Their `JSON-LD` was missing `Offer` (`priceCurrency`, `availability`) or `FAQPage` Q&A blocks.
4. Their pricing lived inside hero banner images or JS-only toggles.

Existing GEO platforms charge $99–$299/month just to show dashboards. So we built **GEO Doctor** — a zero-dependency, browser-local diagnostic workbench:
- **Free forever**: Run the 12-point audit (Live URL or Paste Source to bypass Cloudflare/Shopify CORS) + get the first 10 lines of a custom `/llms.txt` generated for your store.
- **$29 one-time Fix Pack** (verified offline via Ed25519): Unlocks your full `/llms.txt`, `/llms-full.txt`, validated `<head>` `JSON-LD`, `robots.txt` patch, and 20 buyer-intent prompts to test your store in ChatGPT & Perplexity.
- **$199 Done-For-You**: For merchants who want us to inject it directly into `theme.liquid` or WordPress.

Try clicking **"Self-Audit This Page (100/100)"** or one of the 3 sample fixtures in Mode B—I'd love your honest feedback on the 12 checks!
```

---

## 2. Reddit (`r/shopify` / `r/entrepreneur`) — Value-First Diagnostic Post

**Title (`r/shopify`):**
`PSA: Check if your Shopify robots.txt or missing JSON-LD is making ChatGPT Search skip your store (free 12-point checklist + browser checker)`

**Body:**
```markdown
More shoppers are asking ChatGPT and Perplexity things like *"best [niche product] under $150 with 2-year warranty"* before ever clicking Google ads.

When I checked why some solid Shopify stores never show up in AI citations, it usually came down to 4 technical gaps rather than brand size:

1. **Blocking `OAI-SearchBot` or `GPTBot`** via an old anti-scraper app or robots template.
2. **No `/llms.txt` summary** (plain Markdown overview of what you sell, exact pricing, and canonical links).
3. **Incomplete `Product` JSON-LD** — Shopify themes often output `Product` name + price, but omit `availability` (`InStock`) and have zero `FAQPage` Q&A schema (Perplexity & ChatGPT extract FAQ blocks heavily).
4. **Price trapped in hero banners or JS widgets** — crawlers that don't execute heavy JS won't quote your price accurately.

I built a free, client-side checker (**GEO Doctor**: https://a3152557994-ship-it.github.io/geo-doctor/) to score all 12 signals out of 100.

*Tip for Shopify stores*: Because Cloudflare/Shopify often blocks cross-origin browser fetches, switch to **Mode B (Paste Source)** and run `view-source:` (or `curl -sL`) on your product page + `/robots.txt` for an instant offline audit without uploading anything to a server.

Happy to audit anyone's store URL or source setup in the comments and point out the top 2 fixes for free!
```

---

## 3. 小红书跨境独立站对比图文案模板（老板手动发布用）

### 封面大字建议（3:4 竖图对比）
- **主标题**：`独立站投流贵？先查 ChatGPT 能不能搜到你`
- **视觉对比**：左侧红灯 `24/100（GPTBot 被封 + 缺 JSON-LD）` vs 右侧绿灯 `100/100（llms.txt + FAQPage 就绪）`

### 正文文案模板
```text
标题：独立站爆单新入口！为什么老外问 ChatGPT 只推荐同行不推你？🔍

做 Shopify / 独立站的姐妹们，现在很多欧美买家买东西前，直接让 ChatGPT 或 Perplexity 推荐“Best XX under $100”！

但我们实测了好多出单不错的独立站，一查后台得分不到 30 分，根本进不了 AI 推荐池，90% 踩了这 4 个隐形坑：
❌ 1. robots.txt 误抄防爬虫模板，把 OAI-SearchBot / GPTBot 全封了
❌ 2. 根目录没有 /llms.txt，AI 找不到你的核心商品与价格清单
❌ 3. 商品页缺 JSON-LD 的 Offer（币种/现货状态）和 FAQPage 问答结构
❌ 4. 价格只做在首屏海报图片里，AI 爬虫不识图直接跳过

花 10 秒用这个纯本地体检台测一下你的站（不用注册登录、不传源码）：
👉 https://a3152557994-ship-it.github.io/geo-doctor/

✅ 免费直接看 12 项红黄绿灯诊断 + 自动生成你站点的 /llms.txt 前 10 行预览！
✅ 如需完整修复包（llms.txt + llms-full.txt + 可直接贴进 theme.liquid 的零报错 JSON-LD + 20 个买家模拟提问清单），单站 ¥99 一次性买断（省去海外软件每月 $99 订阅费）；不会改代码的老板也支持 ¥499 人工代部署包验收。

💬 评论区留下你的类目（如家居/宠物/户外/SaaS），抽 5 个独立站免费做深度痛点拆解！

#独立站运营 #Shopify干货 #跨境电商 #AI搜索优化 #GEO #ChatGPT营销 #独立站SEO
```
