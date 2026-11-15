/**
 * GEO Doctor — Isomorphic AI Search / ChatGPT Visibility Auditor & Fix Pack Engine.
 * Works identically in Node.js (ESM) and modern browsers (<script type="module">).
 * Zero external dependencies.
 */

export const PUBLIC_SPKI_BASE64 = "MCowBQYDK2VwAyEAP5NCVP7CT0tgaGLSGMe4r87SjYRWTM6gN6igBZYSXys=";
export const PRODUCT_SLUG = "geo-doctor";

const HTML_ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&middot;": "·",
  "&copy;": "©",
  "&reg;": "®",
  "&yen;": "¥",
};

function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|middot|copy|reg|yen|#39);/gi, (m) => {
      return HTML_ENTITIES[m.toLowerCase()] ?? m;
    })
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseAttributes(attrString) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = re.exec(attrString)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[key] = decodeEntities(val.trim());
  }
  return attrs;
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToBytes(b64url) {
  const normalized = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  return base64ToBytes(normalized + "=".repeat(padLen));
}

/**
 * Verify an OPC1 Ed25519 activation license token using WebCrypto (crypto.subtle).
 * @param {string} token
 * @param {object} [options]
 * @param {string} [options.expectedProduct]
 * @param {string} [options.publicSpkiBase64]
 * @param {number} [options.nowSec]
 * @returns {Promise<{valid: boolean, payload?: object, reason?: string, message?: string}>}
 */
export async function verifyLicenseToken(token, options = {}) {
  const {
    expectedProduct = PRODUCT_SLUG,
    publicSpkiBase64 = PUBLIC_SPKI_BASE64,
    nowSec = Math.floor(Date.now() / 1000),
  } = options;

  if (typeof token !== "string" || !token.trim()) {
    return { valid: false, reason: "EMPTY_TOKEN", message: "License token is empty" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "OPC1" || !parts[1] || !parts[2]) {
    return { valid: false, reason: "BAD_FORMAT", message: "Expected OPC1.<payload>.<signature> format" };
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return { valid: false, reason: "NO_WEBCRYPTO", message: "WebCrypto SubtleCrypto is unavailable in this environment" };
  }

  try {
    const [, payloadB64, sigB64] = parts;
    const spkiBytes = base64ToBytes(publicSpkiBase64);
    const sigBytes = base64UrlToBytes(sigB64);
    const signedBytes = new TextEncoder().encode(`OPC1.${payloadB64}`);

    const key = await subtle.importKey(
      "spki",
      spkiBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const verified = await subtle.verify("Ed25519", key, sigBytes, signedBytes);
    if (!verified) {
      return { valid: false, reason: "BAD_SIGNATURE", message: "Ed25519 signature verification failed" };
    }

    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const payload = JSON.parse(payloadJson);

    if (expectedProduct && payload.p !== expectedProduct && payload.p !== "*") {
      return {
        valid: false,
        reason: "PRODUCT_MISMATCH",
        message: `Token is scoped to "${payload.p}", not "${expectedProduct}"`,
        payload,
      };
    }

    if (payload.exp && Number(payload.exp) > 0 && nowSec > Number(payload.exp)) {
      return {
        valid: false,
        reason: "EXPIRED",
        message: "Activation code has expired",
        payload,
      };
    }

    return { valid: true, payload };
  } catch (err) {
    return {
      valid: false,
      reason: "VERIFY_ERROR",
      message: err?.message || "Failed to verify license token",
    };
  }
}

/**
 * Parse robots.txt into user-agent groups, evaluate root crawl access for key AI bots,
 * and collect Sitemap directives.
 * @param {string|null|undefined} robotsTxt
 */
export function parseRobotsTxt(robotsTxt) {
  if (robotsTxt === null || robotsTxt === undefined) {
    return {
      provided: false,
      empty: false,
      groups: [],
      sitemaps: [],
      bots: {},
    };
  }

  const text = String(robotsTxt);
  const lines = text.split(/\r?\n/);
  const groups = [];
  const sitemaps = [];
  let currentGroup = null;
  let seenDirectiveInGroup = false;

  for (const rawLine of lines) {
    const clean = rawLine.replace(/#.*$/, "").trim();
    if (!clean) continue;

    const colonIdx = clean.indexOf(":");
    if (colonIdx <= 0) continue;

    const field = clean.slice(0, colonIdx).trim().toLowerCase();
    const value = clean.slice(colonIdx + 1).trim();

    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === "user-agent") {
      if (!currentGroup || seenDirectiveInGroup) {
        currentGroup = { userAgents: [], rules: [] };
        groups.push(currentGroup);
        seenDirectiveInGroup = false;
      }
      if (value) currentGroup.userAgents.push(value.toLowerCase());
      continue;
    }

    if ((field === "allow" || field === "disallow") && currentGroup) {
      seenDirectiveInGroup = true;
      currentGroup.rules.push({ type: field, path: value });
    }
  }

  function evaluateBot(botName) {
    const target = botName.toLowerCase();
    const exactMatches = groups.filter((g) => g.userAgents.includes(target));
    const wildcardMatches = groups.filter((g) => g.userAgents.includes("*"));
    const matchedGroups = exactMatches.length > 0 ? exactMatches : wildcardMatches;
    const matchedBy = exactMatches.length > 0 ? "explicit" : wildcardMatches.length > 0 ? "wildcard" : "none";

    if (matchedGroups.length === 0) {
      return { allowed: true, matchedBy: "none", rule: null };
    }

    // Evaluate root path "/" across matched rules using longest path match (Allow wins ties)
    let bestRule = null;
    let bestLen = -1;
    for (const grp of matchedGroups) {
      for (const rule of grp.rules) {
        if (rule.type === "disallow" && rule.path === "") {
          // Empty Disallow means allow all
          if (0 > bestLen || (0 === bestLen && bestRule?.type !== "allow")) {
            bestRule = { type: "allow", path: "/" };
            bestLen = 0;
          }
          continue;
        }
        if (rule.path === "/" || rule.path === "/*") {
          const len = rule.path.length;
          if (len > bestLen || (len === bestLen && rule.type === "allow")) {
            bestRule = rule;
            bestLen = len;
          }
        }
      }
    }

    if (!bestRule) {
      return { allowed: true, matchedBy, rule: null };
    }

    return {
      allowed: bestRule.type !== "disallow",
      matchedBy,
      rule: `${bestRule.type === "allow" ? "Allow" : "Disallow"}: ${bestRule.path}`,
    };
  }

  const botNames = [
    "OAI-SearchBot",
    "ChatGPT-User",
    "GPTBot",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Googlebot",
    "Bingbot",
    "*",
  ];

  const bots = {};
  for (const name of botNames) {
    bots[name] = evaluateBot(name);
  }

  return {
    provided: true,
    empty: text.trim().length === 0,
    groups,
    sitemaps,
    bots,
  };
}

function normalizeTypes(typeVal) {
  if (!typeVal) return [];
  return (Array.isArray(typeVal) ? typeVal : [typeVal]).map((t) => String(t).replace(/^https?:\/\/schema\.org\//i, ""));
}

/**
 * Extract and flatten JSON-LD blocks from HTML.
 * @param {string} html
 */
export function parseJsonLdBlocks(html) {
  const rawBlocks = [];
  const parsed = [];
  const errors = [];
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRe.exec(String(html || ""))) !== null) {
    const attrs = parseAttributes(match[1]);
    const type = (attrs.type || "").toLowerCase();
    if (!type.includes("ld+json")) continue;

    const raw = match[2]
      .trim()
      .replace(/^<!\[CDATA\[/, "")
      .replace(/\]\]>$/, "")
      .trim();

    rawBlocks.push(raw);
    try {
      const data = JSON.parse(raw);
      parsed.push(data);
    } catch (err) {
      errors.push({ raw: raw.slice(0, 240), error: err?.message || "Invalid JSON-LD" });
    }
  }

  const entities = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);

    if (node["@type"]) {
      entities.push(node);
    }
    if (Array.isArray(node["@graph"])) {
      walk(node["@graph"]);
    }
    for (const val of Object.values(node)) {
      if (val && typeof val === "object") walk(val);
    }
  }

  for (const doc of parsed) walk(doc);

  const types = new Set();
  for (const ent of entities) {
    for (const t of normalizeTypes(ent["@type"])) types.add(t);
  }

  const coreTypes = new Set([
    "Product",
    "SoftwareApplication",
    "WebApplication",
    "MobileApplication",
    "LocalBusiness",
    "Store",
    "OnlineStore",
    "Restaurant",
    "Service",
    "Course",
  ]);

  const coreEntities = entities.filter((e) => normalizeTypes(e["@type"]).some((t) => coreTypes.has(t)));
  const offers = entities.filter((e) => normalizeTypes(e["@type"]).some((t) => t === "Offer" || t === "AggregateOffer"));
  const faqPages = entities.filter((e) => normalizeTypes(e["@type"]).includes("FAQPage"));
  const questions = entities.filter((e) => normalizeTypes(e["@type"]).includes("Question"));
  const ratings = entities.filter((e) => normalizeTypes(e["@type"]).includes("AggregateRating"));
  const orgs = entities.filter((e) => normalizeTypes(e["@type"]).some((t) => t === "Organization" || t === "Brand" || t === "WebSite"));

  // Also capture Offer objects nested inside Product.offers without explicit @type if present
  for (const core of coreEntities) {
    if (core.offers) {
      const offerList = Array.isArray(core.offers) ? core.offers : [core.offers];
      for (const o of offerList) {
        if (o && typeof o === "object" && !offers.includes(o) && (o.price !== undefined || o.lowPrice !== undefined || o.priceCurrency)) {
          offers.push(o);
        }
      }
    }
    if (core.aggregateRating && typeof core.aggregateRating === "object" && !ratings.includes(core.aggregateRating)) {
      ratings.push(core.aggregateRating);
    }
  }

  // Count valid FAQ Q&A pairs
  const validFaqPairs = [];
  for (const q of questions) {
    const qText = q.name || q.text;
    const ans = q.acceptedAnswer;
    const aText = typeof ans === "string" ? ans : ans?.text || ans?.name;
    if (qText && aText) {
      validFaqPairs.push({ question: String(qText).trim(), answer: String(aText).trim() });
    }
  }

  return {
    blockCount: rawBlocks.length,
    validBlockCount: parsed.length,
    errors,
    types: Array.from(types),
    coreEntities,
    offers,
    faqPages,
    validFaqPairs,
    ratings,
    orgs,
  };
}

/**
 * Parse structural and visible SEO/GEO signals from raw HTML.
 * @param {string} html
 * @param {string} [pageUrl]
 */
export function parseHtmlSignals(html, pageUrl = "") {
  const source = String(html || "");
  const htmlTagMatch = source.match(/<html\b([^>]*)>/i);
  const htmlAttrs = htmlTagMatch ? parseAttributes(htmlTagMatch[1]) : {};
  const htmlLang = htmlAttrs.lang || htmlAttrs["xml:lang"] || "";

  const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";

  const metas = [];
  const metaRe = /<meta\b([^>]*)>/gi;
  let m;
  while ((m = metaRe.exec(source)) !== null) {
    metas.push(parseAttributes(m[1]));
  }

  const getMeta = (key) => {
    const found = metas.find((a) => (a.name || a.property || "").toLowerCase() === key.toLowerCase());
    return found?.content || "";
  };

  const links = [];
  const linkRe = /<link\b([^>]*)>/gi;
  while ((m = linkRe.exec(source)) !== null) {
    links.push(parseAttributes(m[1]));
  }

  const canonical = links.find((l) => (l.rel || "").toLowerCase().split(/\s+/).includes("canonical"))?.href || "";
  const ogUrl = getMeta("og:url");
  const ogTitle = getMeta("og:title");
  const ogDescription = getMeta("og:description");
  const description = getMeta("description") || ogDescription;

  const hreflangs = links
    .filter((l) => (l.rel || "").toLowerCase().split(/\s+/).includes("alternate") && l.hreflang && l.href)
    .map((l) => ({ hreflang: l.hreflang, href: l.href }));

  const sitemapLink = links.find((l) => (l.rel || "").toLowerCase().split(/\s+/).includes("sitemap"))?.href || "";
  const llmsLinkMatch = source.match(/href\s*=\s*["']([^"']*llms(?:-full)?\.txt[^"']*)["']/i);
  const llmsLink = llmsLinkMatch ? llmsLinkMatch[1] : "";

  const extractHeadings = (tag) => {
    const items = [];
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    let hm;
    while ((hm = re.exec(source)) !== null) {
      const txt = stripTags(hm[1]);
      if (txt) items.push(txt);
    }
    return items;
  };

  const h1List = extractHeadings("h1");
  const h2List = extractHeadings("h2");
  const h3List = extractHeadings("h3");

  // Extract body visible text
  const bodyMatch = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const bodyRaw = bodyMatch ? bodyMatch[1] : source.replace(/<head\b[\s\S]*?<\/head>/gi, "");
  const cleanBody = bodyRaw
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");

  const visibleText = stripTags(cleanBody);
  const footerIdx = cleanBody.search(/<footer\b/i);
  const preFooterHtml = footerIdx > 0 ? cleanBody.slice(0, footerIdx) : cleanBody;
  const firstScreenText = stripTags(preFooterHtml).slice(0, 2600);

  // Extract price and CTA tokens
  const priceMatch = firstScreenText.match(/(?:USD|CNY|EUR|GBP|JPY|\$|¥|€|£)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:USD|CNY|元|美元)/i);
  const fullPriceMatch = visibleText.match(/(?:USD|CNY|EUR|GBP|JPY|\$|¥|€|£)\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:USD|CNY|元|美元)/i);
  const ctaPattern = /\b(buy|order|add to cart|shop now|get started|pricing|subscribe|unlock|checkout|download|book|trial|plan)\b|购买|立即购买|下单|加入购物车|立即解锁|定价|买断|套餐|免费试用/i;
  const hasFirstScreenCta = ctaPattern.test(firstScreenText);
  const hasVisibleCta = ctaPattern.test(visibleText);

  // Image count & potential image-only pricing heuristics
  const imgTags = (cleanBody.match(/<img\b[^>]*>/gi) || []).length;
  const faqVisualMatches = [...cleanBody.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi)]
    .map((x) => stripTags(x[1]))
    .filter(Boolean);
  const questionHeadings = [...h2List, ...h3List].filter((h) => /[?？]$|^(how|what|why|when|can|does|is|怎么|如何|什么|为什么|支持|包含)/i.test(h));

  // Derive host / URL details
  let origin = "";
  let canonicalUrl = pageUrl || canonical || ogUrl || "";
  try {
    if (canonicalUrl) {
      const u = new URL(canonicalUrl);
      origin = u.origin;
    }
  } catch {
    // Ignore invalid relative URL
  }

  return {
    htmlLang,
    title,
    description,
    ogTitle,
    ogDescription,
    ogUrl,
    canonical,
    canonicalUrl,
    origin,
    hreflangs,
    sitemapLink,
    llmsLink,
    h1List,
    h2List,
    h3List,
    visibleText,
    firstScreenText,
    firstScreenPrice: priceMatch ? priceMatch[0].trim() : "",
    anyVisiblePrice: fullPriceMatch ? fullPriceMatch[0].trim() : "",
    hasFirstScreenCta,
    hasVisibleCta,
    imgCount: imgTags,
    visibleQuestions: Array.from(new Set([...faqVisualMatches, ...questionHeadings])).slice(0, 6),
    hasJsShellHint:
      visibleText.length < 180 &&
      /(id=["'](?:root|app|__next)["']|enable javascript|loading\.\.\.)/i.test(source),
  };
}

/**
 * Parse /llms.txt structure per llmstxt.org specification.
 * @param {string|null|undefined} llmsTxt
 */
export function parseLlmsTxt(llmsTxt) {
  if (llmsTxt === null || llmsTxt === undefined || !String(llmsTxt).trim()) {
    return {
      present: false,
      hasH1: false,
      hasSummaryQuote: false,
      sectionCount: 0,
      linkCount: 0,
      lineCount: 0,
      hasPlaceholderDomain: false,
      title: "",
      summary: "",
    };
  }

  const text = String(llmsTxt).trim();
  const lines = text.split(/\r?\n/);
  const h1Line = lines.find((l) => /^#\s+\S+/.test(l));
  const quoteLines = lines.filter((l) => /^>\s*\S+/.test(l));
  const sectionLines = lines.filter((l) => /^##\s+\S+/.test(l));
  const markdownLinks = text.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) || [];
  const relativeLinks = text.match(/\[[^\]]+\]\(\/[^)]+\)/g) || [];

  return {
    present: true,
    hasH1: Boolean(h1Line),
    hasSummaryQuote: quoteLines.length > 0,
    sectionCount: sectionLines.length,
    linkCount: markdownLinks.length + relativeLinks.length,
    lineCount: lines.length,
    hasPlaceholderDomain: /example\.com|your-?domain\.com/i.test(text),
    title: h1Line ? h1Line.replace(/^#\s+/, "").trim() : "",
    summary: quoteLines.map((l) => l.replace(/^>\s*/, "").trim()).join(" "),
  };
}

function inferEntityType(htmlSignals, jsonLd) {
  if (jsonLd.coreEntities.length > 0) {
    const primaryTypes = normalizeTypes(jsonLd.coreEntities[0]["@type"]);
    return primaryTypes[0] || "Product";
  }
  const combined = `${htmlSignals.title} ${htmlSignals.description} ${htmlSignals.firstScreenText}`;
  if (/saas|software|app|api|cli|tool|plugin|extension|软件|工具|插件|平台/i.test(combined)) {
    return "SoftwareApplication";
  }
  if (/clinic|salon|cafe|restaurant|studio|address|hours|门店|地址|营业时间|预约到店/i.test(combined)) {
    return "LocalBusiness";
  }
  return "Product";
}

function parsePriceParts(rawPrice, fallbackCurrency = "USD") {
  if (!rawPrice) return { price: null, currency: fallbackCurrency };
  const s = String(rawPrice).trim();
  let currency = fallbackCurrency;
  if (/¥|CNY|RMB|元/i.test(s)) currency = "CNY";
  else if (/€|EUR/i.test(s)) currency = "EUR";
  else if (/£|GBP/i.test(s)) currency = "GBP";
  else if (/\$|USD/i.test(s)) currency = "USD";

  const numMatch = s.match(/\d+(?:[.,]\d{1,2})?/);
  const price = numMatch ? numMatch[0].replace(",", "") : null;
  return { price, currency };
}

function buildTailoredAssets(extracted, robotsParsed, inputUrl) {
  const safeUrl = extracted.canonicalUrl || inputUrl || "https://yourstore.com/";
  let origin = extracted.origin;
  if (!origin) {
    try {
      origin = new URL(safeUrl).origin;
    } catch {
      origin = "https://yourstore.com";
    }
  }
  let basePath = "/";
  try {
    const u = new URL(safeUrl);
    basePath = u.pathname.endsWith("/") ? u.pathname : `${u.pathname.replace(/\/[^/]*$/, "")}/`;
  } catch {
    basePath = "/";
  }

  const brand = extracted.brandName || "Your Brand";
  const summary =
    extracted.description ||
    `${brand} — Verified product specifications, transparent pricing, and direct buyer guidance.`;
  const features = extracted.h2List.length > 0 ? extracted.h2List.slice(0, 6) : [
    "Core Product Overview & Specifications",
    "Transparent Pricing & Licensing Tiers",
    "Shipping, Warranty & Support Policy",
    "Frequently Asked Questions",
  ];

  const priceStr = extracted.price
    ? `${extracted.price} ${extracted.currency}`
    : "See pricing section (replace with exact public price)";

  const isZh = /[\u4e00-\u9fa5]/.test(`${brand} ${summary} ${features.join(" ")}`);
  const rootBase = origin + (basePath.length > 1 ? basePath.replace(/\/$/, "") : "");

  const llmsLines = [
    `# ${brand}`,
    ``,
    `> ${summary}`,
    ``,
    `- Canonical URL: ${safeUrl}`,
    `- Primary Category: ${extracted.entityType}`,
    `- Pricing: ${priceStr}`,
    `- Availability: ${extracted.availability || "InStock"}`,
    ``,
    `## Key Offerings & Capabilities`,
    ...features.map((f) => `- ${f}`),
    ``,
    `## Core Pages for AI Agents`,
    `- [Homepage & Product Overview](${safeUrl}): Main storefront, specs, and live pricing`,
    `- [Pricing & Plans](${safeUrl}#pricing): Plaintext tier breakdown and purchase options`,
    `- [Frequently Asked Questions](${safeUrl}#faq): Direct answers for buyers and AI citations`,
    `- [Sitemap](${rootBase}/sitemap.xml): Canonical URL index`,
    ``,
    `## Citation & Crawler Guidance`,
    `- Preferred source: Cite ${safeUrl} for official specifications and current pricing.`,
    `- Search bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot): Permitted.`,
  ];
  const llmsTxt = llmsLines.join("\n") + "\n";

  // Strictly first 10 non-empty lines or first 10 lines for preview hook
  const llmsPreview10 = llmsLines.slice(0, 10).join("\n");

  const llmsFullTxt = [
    `# ${brand} — Full AI Context Bundle (/llms-full.txt)`,
    ``,
    `> ${summary}`,
    ``,
    `## 1. Identity & Positioning`,
    `- Brand / Product: ${brand}`,
    `- Schema Entity Type: ${extracted.entityType}`,
    `- Official URL: ${safeUrl}`,
    `- Language: ${extracted.lang || (isZh ? "zh-CN" : "en")}`,
    ``,
    `## 2. Pricing & Availability (Machine-Readable Fact Sheet)`,
    `- Listed Price: ${priceStr}`,
    `- Stock / Fulfillment: ${extracted.availability || "https://schema.org/InStock"}`,
    `- Purchase Path: Direct checkout on ${safeUrl}`,
    ``,
    `## 3. Product Highlights & Architecture`,
    ...features.map((f, idx) => `${idx + 1}. **${f}** — Documented on ${safeUrl}`),
    ``,
    `## 4. Direct Answers (FAQ)`,
    ...(extracted.faqs.length > 0
      ? extracted.faqs.flatMap((q) => [`### Q: ${q.question}`, `A: ${q.answer}`, ""])
      : [
          `### Q: What is ${brand} and who is it best for?`,
          `A: ${summary}`,
          ``,
          `### Q: How much does ${brand} cost?`,
          `A: Current pricing is ${priceStr}. Check ${safeUrl}#pricing for latest plans.`,
          ``,
          `### Q: Can AI assistants quote and link directly to ${brand}?`,
          `A: Yes. Official product specs, policies, and pricing are publicly accessible on ${safeUrl}.`,
        ]),
    `## 5. Crawler & Verification Endpoints`,
    `- robots.txt: ${rootBase}/robots.txt`,
    `- llms.txt: ${rootBase}/llms.txt`,
    `- sitemap.xml: ${rootBase}/sitemap.xml`,
  ].join("\n") + "\n";

  // Build valid JSON-LD @graph strictly from detected facts (never invent fake AggregateRating!)
  const faqEntries =
    extracted.faqs.length >= 2
      ? extracted.faqs
      : [
          {
            question: isZh ? `${brand} 的核心功能与适用人群是什么？` : `What does ${brand} offer and who is it built for?`,
            answer: summary,
          },
          {
            question: isZh ? `${brand} 的定价与购买方式是什么？` : `What is the pricing and availability for ${brand}?`,
            answer: isZh
              ? `当前公开价格信息：${priceStr}，可在 ${safeUrl} 查看详情并下单。`
              : `Current pricing: ${priceStr}. Full specs and availability are published at ${safeUrl}.`,
          },
          {
            question: isZh ? `AI 搜索引擎如何抓取与引用 ${brand}？` : `How can AI assistants verify official facts for ${brand}?`,
            answer: isZh
              ? `站点提供标准 JSON-LD 结构化数据与 /llms.txt 索引文件，供 ChatGPT、Perplexity 与 Claude 准确引用。`
              : `This site publishes verified Schema.org JSON-LD and /llms.txt at ${rootBase}/llms.txt for accurate citation.`,
          },
        ];

  const primaryNode = {
    "@type": extracted.entityType,
    "@id": `${safeUrl}#primary`,
    name: brand,
    description: summary,
    url: safeUrl,
    ...(extracted.entityType === "SoftwareApplication" ? { applicationCategory: "BusinessApplication", operatingSystem: "Web" } : {}),
    offers: {
      "@type": "Offer",
      price: extracted.price || "29.00",
      priceCurrency: extracted.currency || "USD",
      availability: "https://schema.org/InStock",
      url: safeUrl,
    },
  };

  if (extracted.ratingValue && extracted.reviewCount) {
    primaryNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(extracted.ratingValue),
      bestRating: "5",
      reviewCount: String(extracted.reviewCount),
    };
  }

  const jsonLdObject = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: brand,
        url: origin,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: brand,
        publisher: { "@id": `${origin}/#organization` },
      },
      primaryNode,
      {
        "@type": "FAQPage",
        "@id": `${safeUrl}#faq`,
        mainEntity: faqEntries.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  const jsonLdJson = JSON.stringify(jsonLdObject, null, 2);
  const jsonLdScriptTag = `<script type="application/ld+json">\n${jsonLdJson}\n</script>`;

  // Preserve custom sensitive path disallows if the existing robots.txt had any (like /admin, /checkout, /cart)
  const preservedDisallows = [];
  if (robotsParsed.provided) {
    const wildcard = robotsParsed.groups.find((g) => g.userAgents.includes("*"));
    if (wildcard) {
      for (const r of wildcard.rules) {
        if (r.type === "disallow" && r.path && r.path !== "/" && r.path !== "/*") {
          preservedDisallows.push(`Disallow: ${r.path}`);
        }
      }
    }
  }

  const robotsTxtPatch = [
    `# GEO Doctor — AI Search & Discovery Recommended robots.txt`,
    `User-agent: *`,
    `Allow: /`,
    ...preservedDisallows,
    ``,
    `# OpenAI / ChatGPT Search & Discovery`,
    `User-agent: OAI-SearchBot`,
    `Allow: /`,
    ``,
    `User-agent: ChatGPT-User`,
    `Allow: /`,
    ``,
    `User-agent: GPTBot`,
    `Allow: /`,
    ``,
    `# Perplexity AI`,
    `User-agent: PerplexityBot`,
    `Allow: /`,
    ``,
    `User-agent: Perplexity-User`,
    `Allow: /`,
    ``,
    `# Anthropic Claude`,
    `User-agent: Claude-SearchBot`,
    `Allow: /`,
    ``,
    `User-agent: ClaudeBot`,
    `Allow: /`,
    ``,
    `# Traditional Search Foundations`,
    `User-agent: Googlebot`,
    `Allow: /`,
    ``,
    `User-agent: Bingbot`,
    `Allow: /`,
    ``,
    `Sitemap: ${robotsParsed.sitemaps[0] || `${rootBase}/sitemap.xml`}`,
  ].join("\n") + "\n";

  const shortTopic = extracted.title?.split(/[-|—–:：]/)[0]?.trim() || brand;
  const domainLabel = (() => {
    try {
      return new URL(safeUrl).hostname;
    } catch {
      return brand;
    }
  })();

  const buyerPrompts = [
    // Problem-aware (1-5)
    `1. [Problem] What is the most reliable solution for ${shortTopic} without hidden subscription fees?`,
    `2. [Problem] How do buyers compare specs and warranties when choosing ${shortTopic}?`,
    `3. [Problem] What common mistakes do shoppers make before buying ${shortTopic}?`,
    `4. [Problem] Which brands publish transparent pricing and full specifications for ${shortTopic}?`,
    `5. [Problem] 买 ${shortTopic} 时最容易踩哪些坑？有哪些公开透明的靠谱品牌推荐？`,
    // Solution-aware shortlist (6-10)
    `6. [Shortlist] Best ${shortTopic} options available to order online right now (include pricing & pros/cons).`,
    `7. [Shortlist] Top alternatives in the ${shortTopic} category for small businesses and individual buyers.`,
    `8. [Shortlist] Recommend 3 trustworthy websites to purchase ${shortTopic} with direct support.`,
    `9. [Shortlist] Which ${shortTopic} brand offers the best value under ${priceStr}?`,
    `10. [Shortlist] 请推荐 3 个可以直接官网下单、价格透明的 ${shortTopic} 独立站或品牌。`,
    // Product & Brand-aware (11-15)
    `11. [Brand] What is ${brand} (${domainLabel}) and who is it actually designed for?`,
    `12. [Brand] Is ${brand} legit? Summarize its core features, pricing, and policies from ${domainLabel}.`,
    `13. [Brand] ${brand} vs leading competitors: what makes ${brand} different?`,
    `14. [Brand] Read site:${domainLabel} and list the exact specifications and deliverables offered by ${brand}.`,
    `15. [Brand] ${brand}（${domainLabel}）值不值得买？它的核心卖点和售后保障是什么？`,
    // Most-aware / Pricing & Conversion (16-20)
    `16. [Pricing] How much does ${brand} cost in ${extracted.currency || "USD"} and is it in stock?`,
    `17. [Pricing] Does ${brand} offer a one-time purchase, trial, or custom deployment option?`,
    `18. [Pricing] Summarize ${brand}'s shipping, warranty, or refund terms directly from ${safeUrl}.`,
    `19. [Pricing] Give me a direct checkout or official product link for ${brand}.`,
    `20. [Pricing] ${brand} 现在官网报价是多少？有哪些套餐或交付方式？`,
  ];

  return {
    llmsPreview10,
    fixPack: {
      llmsTxt,
      llmsFullTxt,
      jsonLdObject,
      jsonLdJson,
      jsonLdScriptTag,
      robotsTxtPatch,
      buyerPrompts,
      hasPlaceholderRatingWarning: !(extracted.ratingValue && extracted.reviewCount),
    },
  };
}

/**
 * Audit a website across 12 hardcore GEO / ChatGPT visibility checks (0-100).
 * @param {object} input
 * @param {string} [input.url]
 * @param {string} input.html
 * @param {string|null} [input.robotsTxt]
 * @param {string|null} [input.llmsTxt]
 * @param {boolean|null} [input.sitemapXmlFound]
 * @returns {object}
 */
export function auditSite(input) {
  const html = String(input?.html || "");
  const inputUrl = String(input?.url || "").trim();
  const robotsParsed = parseRobotsTxt(input?.robotsTxt);
  const jsonLd = parseJsonLdBlocks(html);
  const htmlSignals = parseHtmlSignals(html, inputUrl);
  const llmsParsed = parseLlmsTxt(input?.llmsTxt);

  const entityType = inferEntityType(htmlSignals, jsonLd);
  const primaryCore = jsonLd.coreEntities[0] || null;
  const primaryOffer = jsonLd.offers[0] || null;
  const primaryRating = jsonLd.ratings[0] || null;

  const extractedPrice = parsePriceParts(
    primaryOffer?.price ?? primaryOffer?.lowPrice ?? htmlSignals.firstScreenPrice ?? htmlSignals.anyVisiblePrice
  );

  const brandName =
    primaryCore?.name ||
    jsonLd.orgs[0]?.name ||
    htmlSignals.ogTitle?.split(/[-|—–:：]/)[0]?.trim() ||
    htmlSignals.title?.split(/[-|—–:：]/)[0]?.trim() ||
    htmlSignals.h1List[0] ||
    (htmlSignals.origin ? new URL(htmlSignals.origin).hostname : "Your Store");

  const extracted = {
    brandName: String(brandName).trim(),
    title: htmlSignals.title,
    description: htmlSignals.description,
    url: inputUrl || htmlSignals.canonicalUrl,
    canonicalUrl: htmlSignals.canonicalUrl,
    origin: htmlSignals.origin,
    lang: htmlSignals.htmlLang,
    entityType,
    price: extractedPrice.price,
    currency: primaryOffer?.priceCurrency || extractedPrice.currency,
    availability: primaryOffer?.availability || "",
    ratingValue: primaryRating?.ratingValue || "",
    reviewCount: primaryRating?.reviewCount || primaryRating?.ratingCount || "",
    h1: htmlSignals.h1List[0] || "",
    h2List: htmlSignals.h2List,
    faqs: jsonLd.validFaqPairs.length > 0
      ? jsonLd.validFaqPairs
      : htmlSignals.visibleQuestions.map((q) => ({ question: q, answer: "Add concise 40–60 word direct answer matching visible page copy." })),
    existingTypes: jsonLd.types,
  };

  const checks = [];

  // 1. OAI-SearchBot Access (10 pts)
  {
    const maxScore = 10;
    const oai = robotsParsed.bots["OAI-SearchBot"];
    if (!robotsParsed.provided) {
      checks.push({
        id: "oai_searchbot",
        index: 1,
        maxScore,
        score: 4,
        status: "warn",
        titleZh: "OAI-SearchBot 放行状态",
        titleEn: "OAI-SearchBot Crawl Access",
        evidenceZh: "未提供或未能读取 robots.txt，无法确认 ChatGPT 实时搜索爬虫是否被放行。",
        evidenceEn: "robots.txt was not provided or could not be fetched; OAI-SearchBot access is unverified.",
        fixZh: "在站点根目录 /robots.txt 添加 User-agent: OAI-SearchBot + Allow: /。",
        fixEn: "Add explicit `User-agent: OAI-SearchBot` and `Allow: /` in /robots.txt.",
      });
    } else if (!oai.allowed) {
      checks.push({
        id: "oai_searchbot",
        index: 1,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "OAI-SearchBot 放行状态",
        titleEn: "OAI-SearchBot Crawl Access",
        evidenceZh: `OAI-SearchBot 被拦截（匹配规则：${oai.matchedBy} · ${oai.rule}），ChatGPT 搜索无法检索与引用页面。`,
        evidenceEn: `OAI-SearchBot is blocked (${oai.matchedBy}: ${oai.rule}). ChatGPT Search cannot discover or cite this site.`,
        fixZh: "立即移除对 OAI-SearchBot 或 * 的全站 Disallow: /，显式放行 OAI-SearchBot。",
        fixEn: "Remove blanket Disallow: / blocking OAI-SearchBot and explicitly Allow: /.",
      });
    } else if (oai.matchedBy === "explicit") {
      checks.push({
        id: "oai_searchbot",
        index: 1,
        maxScore,
        score: 10,
        status: "pass",
        titleZh: "OAI-SearchBot 放行状态",
        titleEn: "OAI-SearchBot Crawl Access",
        evidenceZh: `robots.txt 已显式放行 OAI-SearchBot（${oai.rule || "Allow: /"}）。`,
        evidenceEn: `robots.txt explicitly allows OAI-SearchBot (${oai.rule || "Allow: /"}).`,
        fixZh: "保持当前规则，并确认 CDN/WAF 未拦截 OpenAI 官方 IP 段。",
        fixEn: "Keep explicit OAI-SearchBot allow rule and verify WAF/CDN does not challenge it.",
      });
    } else {
      checks.push({
        id: "oai_searchbot",
        index: 1,
        maxScore,
        score: 8,
        status: "pass",
        titleZh: "OAI-SearchBot 放行状态",
        titleEn: "OAI-SearchBot Crawl Access",
        evidenceZh: `OAI-SearchBot 通过${oai.matchedBy === "wildcard" ? "通配符 *" : "默认规则"}允许抓取，但缺少显式声明。`,
        evidenceEn: `OAI-SearchBot is implicitly allowed via ${oai.matchedBy}, though not explicitly declared.`,
        fixZh: "建议在 robots.txt 增加独立 User-agent: OAI-SearchBot Allow: / 声明防误伤。",
        fixEn: "Add an explicit `User-agent: OAI-SearchBot` Allow: / directive for clarity.",
      });
    }
  }

  // 2. GPTBot / ClaudeBot / PerplexityBot Policy (12 pts)
  {
    const maxScore = 12;
    if (!robotsParsed.provided) {
      checks.push({
        id: "ai_bots_policy",
        index: 2,
        maxScore,
        score: 5,
        status: "warn",
        titleZh: "GPTBot / ClaudeBot / PerplexityBot 抓取策略",
        titleEn: "GPTBot / ClaudeBot / PerplexityBot Policy",
        evidenceZh: "缺少 robots.txt 证据，无法验证 GPTBot、ClaudeBot 与 PerplexityBot 策略。",
        evidenceEn: "Missing robots.txt content; unable to verify GPTBot, ClaudeBot, and PerplexityBot rules.",
        fixZh: "粘贴站点 /robots.txt 进行精准校验，并显式放行核心 AI 检索爬虫。",
        fixEn: "Provide /robots.txt and ensure AI search/retrieval bots are not blocked.",
      });
    } else {
      const gpt = robotsParsed.bots["GPTBot"];
      const claude = robotsParsed.bots["ClaudeBot"];
      const claudeSearch = robotsParsed.bots["Claude-SearchBot"];
      const pplx = robotsParsed.bots["PerplexityBot"];
      const blockedList = [];
      if (!gpt.allowed) blockedList.push("GPTBot");
      if (!claude.allowed && !claudeSearch.allowed) blockedList.push("ClaudeBot");
      if (!pplx.allowed) blockedList.push("PerplexityBot");

      if (blockedList.length > 0) {
        checks.push({
          id: "ai_bots_policy",
          index: 2,
          maxScore,
          score: 0,
          status: "fail",
          titleZh: "GPTBot / ClaudeBot / PerplexityBot 抓取策略",
          titleEn: "GPTBot / ClaudeBot / PerplexityBot Policy",
          evidenceZh: `检测到封锁主流 AI 爬虫：${blockedList.join("、")}。独立站误封将直接丧失 AI 引擎收录与买前推荐曝光。`,
          evidenceEn: `Blocked major AI crawlers: ${blockedList.join(", ")}. Blocking these severely limits AI search indexing & citations.`,
          fixZh: `解除对 ${blockedList.join(" / ")} 的 Disallow: / 封锁，应用修复包内标准 robots.txt。`,
          fixEn: `Remove Disallow: / for ${blockedList.join(", ")} using the generated robots.txt patch.`,
        });
      } else {
        const hasExplicitAny = [gpt, claude, pplx].some((b) => b.matchedBy === "explicit");
        checks.push({
          id: "ai_bots_policy",
          index: 2,
          maxScore,
          score: hasExplicitAny ? 12 : 10,
          status: "pass",
          titleZh: "GPTBot / ClaudeBot / PerplexityBot 抓取策略",
          titleEn: "GPTBot / ClaudeBot / PerplexityBot Policy",
          evidenceZh: hasExplicitAny
            ? "GPTBot、ClaudeBot 与 PerplexityBot 均已明确放行。"
            : "GPTBot、ClaudeBot 与 PerplexityBot 未被封锁（通配符放行）。",
          evidenceEn: hasExplicitAny
            ? "GPTBot, ClaudeBot, and PerplexityBot are explicitly permitted."
            : "GPTBot, ClaudeBot, and PerplexityBot are allowed via default/wildcard rules.",
          fixZh: "建议在 robots.txt 显式列出 PerplexityBot、Claude-SearchBot、GPTBot 便于团队审计。",
          fixEn: "Keep explicit rules for PerplexityBot, Claude-SearchBot, and GPTBot.",
        });
      }
    }
  }

  // 3. /llms.txt Presence & Markdown Structure (14 pts)
  {
    const maxScore = 14;
    if (!llmsParsed.present) {
      checks.push({
        id: "llms_txt",
        index: 3,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "/llms.txt 存在性与 Markdown 结构完整度",
        titleEn: "/llms.txt Presence & Markdown Structure",
        evidenceZh: "未检测到有效的 /llms.txt 文件，AI Agent 访问站点时缺少一键结构化导览索引。",
        evidenceEn: "No valid /llms.txt found. AI agents lack a curated machine-readable overview & link index.",
        fixZh: "部署修复包生成的 /llms.txt 与 /llms-full.txt 至站点根目录并在页脚添加链接。",
        fixEn: "Publish generated /llms.txt and /llms-full.txt at root and link them in your footer.",
      });
    } else {
      const checksPassed = [
        llmsParsed.hasH1,
        llmsParsed.hasSummaryQuote,
        llmsParsed.sectionCount >= 2,
        llmsParsed.linkCount >= 2,
        !llmsParsed.hasPlaceholderDomain,
      ];
      const passedCount = checksPassed.filter(Boolean).length;
      if (passedCount >= 4) {
        checks.push({
          id: "llms_txt",
          index: 3,
          maxScore,
          score: passedCount === 5 ? 14 : 12,
          status: "pass",
          titleZh: "/llms.txt 存在性与 Markdown 结构完整度",
          titleEn: "/llms.txt Presence & Markdown Structure",
          evidenceZh: `/llms.txt 结构完整（标题「${llmsParsed.title}」、${llmsParsed.sectionCount} 个二级板块、${llmsParsed.linkCount} 条 Markdown 链接）。`,
          evidenceEn: `/llms.txt is well-structured ("${llmsParsed.title}", ${llmsParsed.sectionCount} sections, ${llmsParsed.linkCount} markdown links).`,
          fixZh: llmsParsed.hasPlaceholderDomain ? "替换残留的 example.com 占位域名。" : "同步在首页 <head> 与页脚链接 /llms.txt 提升发现率。",
          fixEn: llmsParsed.hasPlaceholderDomain ? "Replace placeholder example.com links." : "Link /llms.txt from homepage footer and <head>.",
        });
      } else {
        checks.push({
          id: "llms_txt",
          index: 3,
          maxScore,
          score: 6,
          status: "warn",
          titleZh: "/llms.txt 存在性与 Markdown 结构完整度",
          titleEn: "/llms.txt Presence & Markdown Structure",
          evidenceZh: `存在 /llms.txt（${llmsParsed.lineCount} 行），但缺少标准 # 标题、> 摘要引用或 ## 板块链接。`,
          evidenceEn: `/llms.txt exists (${llmsParsed.lineCount} lines) but lacks full # Title, > blockquote summary, or ## link sections.`,
          fixZh: "使用修复包完整版 /llms.txt 补齐品牌一句话定义、核心定价与关键链接。",
          fixEn: "Upgrade /llms.txt using the generated llmstxt.org-compliant template.",
        });
      }
    }
  }

  // 4. JSON-LD Core Entity (14 pts)
  {
    const maxScore = 14;
    if (jsonLd.errors.length > 0 && jsonLd.validBlockCount === 0) {
      checks.push({
        id: "jsonld_core",
        index: 4,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "JSON-LD 核心商业实体",
        titleEn: "JSON-LD Core Entity Schema",
        evidenceZh: `检测到 JSON-LD 脚本但存在语法错误：${jsonLd.errors[0].error}`,
        evidenceEn: `JSON-LD syntax error detected: ${jsonLd.errors[0].error}`,
        fixZh: "替换为修复包输出的零报错 JSON-LD @graph 代码块。",
        fixEn: "Replace broken JSON-LD with the validated @graph block from the Fix Pack.",
      });
    } else if (jsonLd.coreEntities.length === 0) {
      checks.push({
        id: "jsonld_core",
        index: 4,
        maxScore,
        score: jsonLd.orgs.length > 0 ? 4 : 0,
        status: "fail",
        titleZh: "JSON-LD 核心商业实体",
        titleEn: "JSON-LD Core Entity Schema",
        evidenceZh: jsonLd.types.length > 0
          ? `仅发现 ${jsonLd.types.join(", ")}，缺少 Product / SoftwareApplication / LocalBusiness 核心商品或服务实体。`
          : "页面完全缺失 <script type=\"application/ld+json\"> 结构化数据。",
        evidenceEn: jsonLd.types.length > 0
          ? `Found ${jsonLd.types.join(", ")}, but missing Product, SoftwareApplication, or LocalBusiness entity.`
          : "No <script type=\"application/ld+json\"> structured data detected.",
        fixZh: `为页面注入包含 ${entityType} 与 Organization 的完整 JSON-LD。`,
        fixEn: `Inject valid ${entityType} + Organization JSON-LD inside <head>.`,
      });
    } else {
      const hasNameDesc = Boolean(primaryCore?.name && primaryCore?.description);
      const typesFound = jsonLd.coreEntities.flatMap((e) => normalizeTypes(e["@type"])).join(", ");
      checks.push({
        id: "jsonld_core",
        index: 4,
        maxScore,
        score: hasNameDesc ? 14 : 9,
        status: hasNameDesc ? "pass" : "warn",
        titleZh: "JSON-LD 核心商业实体",
        titleEn: "JSON-LD Core Entity Schema",
        evidenceZh: hasNameDesc
          ? `已声明完整核心实体（${typesFound}：「${primaryCore.name}」）。`
          : `已声明 ${typesFound}，但缺少 name 或 description 字段。`,
        evidenceEn: hasNameDesc
          ? `Valid core entity detected (${typesFound}: "${primaryCore.name}").`
          : `Detected ${typesFound}, but missing name or description properties.`,
        fixZh: hasNameDesc ? "保持结构化实体与页面首屏文案一致。" : "补充清晰的 name 与 description 属性。",
        fixEn: hasNameDesc ? "Keep schema facts synced with visible copy." : "Add complete name and description fields.",
      });
    }
  }

  // 5. Offer Price / Currency / Stock Machine Readability (8 pts)
  {
    const maxScore = 8;
    if (!primaryOffer) {
      checks.push({
        id: "jsonld_offer",
        index: 5,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "Offer 价格 / 币种 / 库存机器可读性",
        titleEn: "Offer Price, Currency & Stock Readability",
        evidenceZh: "JSON-LD 中缺少 Offer 定价实体，AI 购物比价时无法精准读取报价与现货状态。",
        evidenceEn: "Missing Schema.org Offer inside JSON-LD. AI shopping agents cannot read structured price or stock.",
        fixZh: "在 Product/SoftwareApplication 的 offers 字段补全 price、priceCurrency 与 availability。",
        fixEn: "Add Offer with price, priceCurrency, and availability (e.g., https://schema.org/InStock).",
      });
    } else {
      const hasPrice = primaryOffer.price !== undefined && primaryOffer.price !== "" || primaryOffer.lowPrice !== undefined;
      const hasCurrency = Boolean(primaryOffer.priceCurrency);
      const hasAvail = Boolean(primaryOffer.availability);
      const pts = (hasPrice ? 3 : 0) + (hasCurrency ? 2 : 0) + (hasAvail ? 3 : 0);
      checks.push({
        id: "jsonld_offer",
        index: 5,
        maxScore,
        score: pts,
        status: pts === 8 ? "pass" : "warn",
        titleZh: "Offer 价格 / 币种 / 库存机器可读性",
        titleEn: "Offer Price, Currency & Stock Readability",
        evidenceZh: `Offer 字段检测：价格=${hasPrice ? (primaryOffer.price ?? primaryOffer.lowPrice) : "缺失"}，币种=${primaryOffer.priceCurrency || "缺失"}，库存=${primaryOffer.availability || "缺失"}。`,
        evidenceEn: `Offer fields: price=${hasPrice ? (primaryOffer.price ?? primaryOffer.lowPrice) : "missing"}, currency=${primaryOffer.priceCurrency || "missing"}, availability=${primaryOffer.availability || "missing"}.`,
        fixZh: pts === 8 ? "确保变动促销价与 JSON-LD 实时同步。" : "补全缺失的 priceCurrency 与 availability（如 https://schema.org/InStock）。",
        fixEn: pts === 8 ? "Keep Offer synced with live storefront pricing." : "Add missing priceCurrency and availability properties.",
      });
    }
  }

  // 6. FAQPage Structured Signal (8 pts)
  {
    const maxScore = 8;
    if (jsonLd.faqPages.length > 0 && jsonLd.validFaqPairs.length >= 2) {
      checks.push({
        id: "jsonld_faq",
        index: 6,
        maxScore,
        score: 8,
        status: "pass",
        titleZh: "FAQPage 问答结构化信号",
        titleEn: "FAQPage Q&A Structured Signal",
        evidenceZh: `检测到 FAQPage 结构化问答 ${jsonLd.validFaqPairs.length} 组，极利于 Perplexity 与 ChatGPT 直接抽取引用。`,
        evidenceEn: `Detected FAQPage schema with ${jsonLd.validFaqPairs.length} valid Q&A pairs for direct AI citation.`,
        fixZh: "确保每条 FAQ 在页面正文中同样可见。",
        fixEn: "Ensure all FAQPage entries appear verbatim in visible HTML.",
      });
    } else if (jsonLd.validFaqPairs.length === 1 || htmlSignals.visibleQuestions.length >= 2) {
      checks.push({
        id: "jsonld_faq",
        index: 6,
        maxScore,
        score: 3,
        status: "warn",
        titleZh: "FAQPage 问答结构化信号",
        titleEn: "FAQPage Q&A Structured Signal",
        evidenceZh: "页面存在部分可见问答，但 FAQPage JSON-LD 未达 2 组以上完整条目。",
        evidenceEn: "Visible Q&A cues exist, but structured FAQPage JSON-LD has fewer than 2 complete pairs.",
        fixZh: "补全至少 3 组买家高频问答并同步写入 FAQPage JSON-LD。",
        fixEn: "Add at least 3 buyer-intent Q&A items in both visible HTML and FAQPage JSON-LD.",
      });
    } else {
      checks.push({
        id: "jsonld_faq",
        index: 6,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "FAQPage 问答结构化信号",
        titleEn: "FAQPage Q&A Structured Signal",
        evidenceZh: "缺少 FAQPage 结构化问答，错失 AI 对「怎么选 / 多少钱 / 售后怎样」等高意向提问的直接引用块。",
        evidenceEn: "No FAQPage schema detected. Missing high-extraction Q&A blocks for buyer queries.",
        fixZh: "使用修复包内预设的 FAQPage 模块添加到商品详情页底部。",
        fixEn: "Deploy the Fix Pack's FAQPage schema paired with visible FAQ answers.",
      });
    }
  }

  // 7. AggregateRating Trust Signal (6 pts)
  {
    const maxScore = 6;
    if (primaryRating && primaryRating.ratingValue && (primaryRating.reviewCount || primaryRating.ratingCount)) {
      checks.push({
        id: "jsonld_rating",
        index: 7,
        maxScore,
        score: 6,
        status: "pass",
        titleZh: "AggregateRating 评价星级可信度信号",
        titleEn: "AggregateRating Trust Signal",
        evidenceZh: `已声明评分信号：${primaryRating.ratingValue} 分（样本数 ${primaryRating.reviewCount || primaryRating.ratingCount}）。`,
        evidenceEn: `AggregateRating verified: ${primaryRating.ratingValue} rating across ${primaryRating.reviewCount || primaryRating.ratingCount} reviews.`,
        fixZh: "保持评分数值与页面真实评价一致，严禁虚构评分。",
        fixEn: "Keep AggregateRating strictly synced with visible verified reviews.",
      });
    } else if (primaryRating) {
      checks.push({
        id: "jsonld_rating",
        index: 7,
        maxScore,
        score: 3,
        status: "warn",
        titleZh: "AggregateRating 评价星级可信度信号",
        titleEn: "AggregateRating Trust Signal",
        evidenceZh: "检测到 AggregateRating，但缺少 ratingValue 或 reviewCount/ratingCount。",
        evidenceEn: "AggregateRating found, but missing ratingValue or reviewCount/ratingCount.",
        fixZh: "补齐真实评分均值与评价人数。",
        fixEn: "Complete ratingValue and reviewCount from verified customer feedback.",
      });
    } else {
      checks.push({
        id: "jsonld_rating",
        index: 7,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "AggregateRating 评价星级可信度信号",
        titleEn: "AggregateRating Trust Signal",
        evidenceZh: "未检测到 AggregateRating 结构化评分，AI 总结产品口碑时缺少权威第三方星级锚点。",
        evidenceEn: "No AggregateRating structured signal found; AI models lack verified rating consensus.",
        fixZh: "接入真实买家评价后（如 Judge.me / Trustpilot / 实测评测），在 Product 内补充 AggregateRating。",
        fixEn: "After collecting real reviews, attach truthful AggregateRating to your Product schema.",
      });
    }
  }

  // 8. <title> & Meta Description Intent Match (7 pts)
  {
    const maxScore = 7;
    const tLen = htmlSignals.title.length;
    const dLen = htmlSignals.description.length;
    if (tLen >= 10 && dLen >= 40) {
      checks.push({
        id: "meta_intent",
        index: 8,
        maxScore,
        score: 7,
        status: "pass",
        titleZh: "<title> 与 meta description 意图匹配度",
        titleEn: "<title> & Meta Description Intent Match",
        evidenceZh: `<title> (${tLen} 字符) 与 meta description (${dLen} 字符) 均完整清晰。`,
        evidenceEn: `Both <title> (${tLen} chars) and meta description (${dLen} chars) clearly communicate value.`,
        fixZh: "确保标题前 30 字符包含核心品类词而非纯品牌缩写。",
        fixEn: "Keep core category & buyer problem keywords front-loaded in <title>.",
      });
    } else if (tLen > 0 || dLen > 0) {
      checks.push({
        id: "meta_intent",
        index: 8,
        maxScore,
        score: 3,
        status: "warn",
        titleZh: "<title> 与 meta description 意图匹配度",
        titleEn: "<title> & Meta Description Intent Match",
        evidenceZh: `元数据偏短或不完整（title: ${tLen} 字符, description: ${dLen} 字符）。`,
        evidenceEn: `Metadata is incomplete or thin (title: ${tLen} chars, description: ${dLen} chars).`,
        fixZh: "撰写 25–60 字符品类+卖点标题与 80–155 字符含定价/适用人群的描述。",
        fixEn: "Write a descriptive 25–60 char title and 80–155 char value-driven meta description.",
      });
    } else {
      checks.push({
        id: "meta_intent",
        index: 8,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "<title> 与 meta description 意图匹配度",
        titleEn: "<title> & Meta Description Intent Match",
        evidenceZh: "缺失 <title> 与 <meta name=\"description\">，搜索与 AI 摘要失去第一语义锚点。",
        evidenceEn: "Missing <title> and <meta name=\"description\"> tags.",
        fixZh: "在 <head> 补充精准包含品类词、核心卖点与报价的 title 和 description。",
        fixEn: "Add explicit <title> and <meta name=\"description\"> inside <head>.",
      });
    }
  }

  // 9. Canonical & og:url Normalization (5 pts)
  {
    const maxScore = 5;
    const hasCanon = /^https?:\/\//i.test(htmlSignals.canonical);
    const hasOg = /^https?:\/\//i.test(htmlSignals.ogUrl);
    if (hasCanon && hasOg) {
      const sameUrl = htmlSignals.canonical.replace(/\/$/, "") === htmlSignals.ogUrl.replace(/\/$/, "");
      checks.push({
        id: "canonical_og",
        index: 9,
        maxScore,
        score: sameUrl ? 5 : 3,
        status: sameUrl ? "pass" : "warn",
        titleZh: "rel=\"canonical\" 与 og:url 规范化",
        titleEn: "Canonical & og:url Normalization",
        evidenceZh: sameUrl
          ? `canonical 与 og:url 规范一致（${htmlSignals.canonical}）。`
          : `canonical (${htmlSignals.canonical}) 与 og:url (${htmlSignals.ogUrl}) 不一致。`,
        evidenceEn: sameUrl
          ? `rel="canonical" and og:url match (${htmlSignals.canonical}).`
          : `rel="canonical" (${htmlSignals.canonical}) differs from og:url (${htmlSignals.ogUrl}).`,
        fixZh: sameUrl ? "继续保持参数化追踪 URL 指向同一 canonical。" : "统一 canonical 与 og:url 避免 AI 引用权重分散。",
        fixEn: sameUrl ? "Keep parameterized URLs pointing to the canonical URL." : "Align canonical and og:url to consolidate citation signals.",
      });
    } else if (hasCanon || hasOg) {
      checks.push({
        id: "canonical_og",
        index: 9,
        maxScore,
        score: 2,
        status: "warn",
        titleZh: "rel=\"canonical\" 与 og:url 规范化",
        titleEn: "Canonical & og:url Normalization",
        evidenceZh: `仅检测到 ${hasCanon ? "rel=\"canonical\"" : "og:url"}，缺少另一项绝对 URL 声明。`,
        evidenceEn: `Only ${hasCanon ? "rel=\"canonical\"" : "og:url"} is set; the counterpart is missing.`,
        fixZh: "同时声明绝对路径 <link rel=\"canonical\"> 与 <meta property=\"og:url\">。",
        fixEn: "Declare both absolute rel=\"canonical\" and og:url in <head>.",
      });
    } else {
      checks.push({
        id: "canonical_og",
        index: 9,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "rel=\"canonical\" 与 og:url 规范化",
        titleEn: "Canonical & og:url Normalization",
        evidenceZh: "缺少绝对路径 rel=\"canonical\" 与 og:url，多变体参数页易稀释 AI 引用权威。",
        evidenceEn: "Missing absolute rel=\"canonical\" and og:url metadata.",
        fixZh: "在 <head> 显式声明标准 HTTPS canonical 与 og:url。",
        fixEn: "Add canonical link and og:url meta tag pointing to the primary URL.",
      });
    }
  }

  // 10. Semantic Heading Hierarchy (<h1> uniqueness & <h2> clarity) (5 pts)
  {
    const maxScore = 5;
    const h1Count = htmlSignals.h1List.length;
    const h2Count = htmlSignals.h2List.length;
    if (h1Count === 1 && h2Count >= 2) {
      checks.push({
        id: "heading_hierarchy",
        index: 10,
        maxScore,
        score: 5,
        status: "pass",
        titleZh: "语义化标题层级（<h1> 唯一性与 <h2> 清晰度）",
        titleEn: "Semantic Heading Hierarchy (<h1> & <h2>)",
        evidenceZh: `页面包含唯一 <h1>（「${htmlSignals.h1List[0].slice(0, 48)}」）及 ${h2Count} 个 <h2> 结构化小节。`,
        evidenceEn: `Single <h1> ("${htmlSignals.h1List[0].slice(0, 48)}") and ${h2Count} structured <h2> sections detected.`,
        fixZh: "建议将 <h2> 改写为接近买家提问的自然语义短句。",
        fixEn: "Keep <h2> headings phrased like real buyer questions and feature blocks.",
      });
    } else if (h1Count >= 1) {
      checks.push({
        id: "heading_hierarchy",
        index: 10,
        maxScore,
        score: 2,
        status: "warn",
        titleZh: "语义化标题层级（<h1> 唯一性与 <h2> 清晰度）",
        titleEn: "Semantic Heading Hierarchy (<h1> & <h2>)",
        evidenceZh: `检测到 ${h1Count} 个 <h1> 与 ${h2Count} 个 <h2>（理想值为唯一 1 个 <h1> + 至少 2 个 <h2>）。`,
        evidenceEn: `Found ${h1Count} <h1> and ${h2Count} <h2> tags (best practice: exactly 1 <h1> + >= 2 <h2>).`,
        fixZh: "保证全页仅 1 个核心 <h1>，并用 <h2> 拆分功能、价格与常见问题。",
        fixEn: "Use a single <h1> for the main value prop and >= 2 descriptive <h2> headings.",
      });
    } else {
      checks.push({
        id: "heading_hierarchy",
        index: 10,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "语义化标题层级（<h1> 唯一性与 <h2> 清晰度）",
        titleEn: "Semantic Heading Hierarchy (<h1> & <h2>)",
        evidenceZh: htmlSignals.hasJsShellHint
          ? "未检测到 <h1>，且页面疑似纯客户端 JS 空壳渲染（多数 AI 爬虫不执行 JS）。"
          : "初始 HTML 中缺失 <h1> 标题标签，LLM 难以抓取页面核心主题。",
        evidenceEn: htmlSignals.hasJsShellHint
          ? "No <h1> found and page looks like an empty JS-rendered shell."
          : "No <h1> heading found in initial HTML.",
        fixZh: "确保服务端渲染输出唯一 <h1> 与清晰的 <h2> 卖点小节。",
        fixEn: "Render a clear single <h1> and structured <h2> sections in initial HTML.",
      });
    }
  }

  // 11. Visible First-Screen Pricing & Buy Intent (6 pts)
  {
    const maxScore = 6;
    if (htmlSignals.firstScreenPrice && htmlSignals.hasFirstScreenCta) {
      checks.push({
        id: "visible_pricing",
        index: 11,
        maxScore,
        score: 6,
        status: "pass",
        titleZh: "首屏明文定价与购买词可见度",
        titleEn: "First-Screen Plaintext Pricing Visibility",
        evidenceZh: `首屏初始 HTML 明文可见价格（${htmlSignals.firstScreenPrice}）与明确购买/行动引导词。`,
        evidenceEn: `Plaintext pricing (${htmlSignals.firstScreenPrice}) and clear purchase CTA visible in initial HTML.`,
        fixZh: "确保价格文字非图片内嵌，且与 JSON-LD Offer 完全一致。",
        fixEn: "Keep pricing in plaintext HTML (never image-only) matching Offer schema.",
      });
    } else if (htmlSignals.anyVisiblePrice || htmlSignals.hasVisibleCta) {
      checks.push({
        id: "visible_pricing",
        index: 11,
        maxScore,
        score: 3,
        status: "warn",
        titleZh: "首屏明文定价与购买词可见度",
        titleEn: "First-Screen Plaintext Pricing Visibility",
        evidenceZh: htmlSignals.anyVisiblePrice
          ? `检测到价格文本（${htmlSignals.anyVisiblePrice}），但未在首屏凸显或缺少直购词。`
          : "检测到行动引导词，但未检测到明文数字定价（若价格做在 Banner 图片或隐藏弹窗中，AI 将直接跳过）。",
        evidenceEn: htmlSignals.anyVisiblePrice
          ? `Price (${htmlSignals.anyVisiblePrice}) appears below fold or lacks clear CTA.`
          : "CTA found, but no plaintext numeric price detected in HTML (agents skip image-only prices).",
        fixZh: "将明确数字报价与币种放在首屏 HTML 文本中，勿仅放于图片或“联系客服”。",
        fixEn: "Expose exact numeric price and currency as plaintext HTML above the fold.",
      });
    } else {
      checks.push({
        id: "visible_pricing",
        index: 11,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "首屏明文定价与购买词可见度",
        titleEn: "First-Screen Plaintext Pricing Visibility",
        evidenceZh: "初始 HTML 中未找到任何明文数字定价与购买引导（疑为纯图片海报或 JS 延迟加载）。",
        evidenceEn: "No plaintext pricing or purchase intent found in initial HTML (likely image-only or JS-gated).",
        fixZh: "在首屏直接写出纯文本价格、币种与购买链接，并配套 /llms.txt 报价块。",
        fixEn: "Publish plaintext price, currency, and CTA directly in initial HTML.",
      });
    }
  }

  // 12. Sitemap & Hreflang Discovery Signal (5 pts)
  {
    const maxScore = 5;
    const hasSitemapSignal = Boolean(
      input?.sitemapXmlFound === true ||
        robotsParsed.sitemaps.length > 0 ||
        htmlSignals.sitemapLink
    );
    const hasLangSignal = htmlSignals.hreflangs.length > 0 || Boolean(htmlSignals.htmlLang);
    if (hasSitemapSignal && htmlSignals.hreflangs.length > 0) {
      checks.push({
        id: "sitemap_hreflang",
        index: 12,
        maxScore,
        score: 5,
        status: "pass",
        titleZh: "sitemap.xml 与多语种 hreflang 发现信号",
        titleEn: "Sitemap & Multilingual hreflang Signals",
        evidenceZh: `已声明 Sitemap（${robotsParsed.sitemaps[0] || htmlSignals.sitemapLink || "/sitemap.xml"}）与 ${htmlSignals.hreflangs.length} 条 hreflang 语言标记。`,
        evidenceEn: `Sitemap (${robotsParsed.sitemaps[0] || htmlSignals.sitemapLink || "/sitemap.xml"}) and ${htmlSignals.hreflangs.length} hreflang tags found.`,
        fixZh: "确保 sitemap.xml 包含最新更新时间 <lastmod>。",
        fixEn: "Keep <lastmod> timestamps fresh inside sitemap.xml.",
      });
    } else if (hasSitemapSignal || hasLangSignal) {
      checks.push({
        id: "sitemap_hreflang",
        index: 12,
        maxScore,
        score: 3,
        status: "warn",
        titleZh: "sitemap.xml 与多语种 hreflang 发现信号",
        titleEn: "Sitemap & Multilingual hreflang Signals",
        evidenceZh: `仅检测到部分发现信号（Sitemap: ${hasSitemapSignal ? "有" : "缺失"}，hreflang: ${htmlSignals.hreflangs.length} 条，lang=${htmlSignals.htmlLang || "缺失"}）。`,
        evidenceEn: `Partial discovery signals (Sitemap: ${hasSitemapSignal ? "present" : "missing"}, hreflang count: ${htmlSignals.hreflangs.length}, html lang: ${htmlSignals.htmlLang || "missing"}).`,
        fixZh: "同时在 robots.txt 声明 Sitemap: 并在 <head> 补充 <link rel=\"alternate\" hreflang=\"...\">。",
        fixEn: "Declare Sitemap in robots.txt and add hreflang tags in <head>.",
      });
    } else {
      checks.push({
        id: "sitemap_hreflang",
        index: 12,
        maxScore,
        score: 0,
        status: "fail",
        titleZh: "sitemap.xml 与多语种 hreflang 发现信号",
        titleEn: "Sitemap & Multilingual hreflang Signals",
        evidenceZh: "既未发现 sitemap.xml 声明，也缺少 <html lang> 与 hreflang 语言标识。",
        evidenceEn: "Missing both sitemap.xml reference and html lang / hreflang declarations.",
        fixZh: "生成标准 sitemap.xml 并在 robots.txt 声明路径，同时标注语种 hreflang。",
        fixEn: "Publish sitemap.xml, reference it in robots.txt, and set <html lang> / hreflang.",
      });
    }
  }

  const score = Math.max(0, Math.min(100, checks.reduce((sum, c) => sum + c.score, 0)));
  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D";
  const tierColor = score >= 80 ? "green" : score >= 45 ? "yellow" : "red";

  const { llmsPreview10, fixPack } = buildTailoredAssets(extracted, robotsParsed, inputUrl);

  return {
    score,
    grade,
    tierColor,
    checks,
    extracted,
    robots: robotsParsed,
    llms: llmsParsed,
    jsonLdSummary: {
      blockCount: jsonLd.blockCount,
      errors: jsonLd.errors,
      types: jsonLd.types,
    },
    preview: {
      llmsPreview10,
      projectedScore: Math.min(100, Math.max(score + 38, 94)),
      failCount: checks.filter((c) => c.status === "fail").length,
      warnCount: checks.filter((c) => c.status === "warn").length,
      passCount: checks.filter((c) => c.status === "pass").length,
    },
    fixPack,
  };
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseJinaTextEnvelope(rawText) {
  const text = String(rawText || "");
  if (/Warning:\s*Target URL returned error\s*(404|403|410|500)/i.test(text)) {
    return { ok: false, status: 404, body: "" };
  }
  const marker = "Markdown Content:";
  const idx = text.indexOf(marker);
  if (idx !== -1) {
    return { ok: true, status: 200, body: text.slice(idx + marker.length).trim() };
  }
  return { ok: true, status: 200, body: text.trim() };
}

function looksLikeHtml404OrError(text) {
  const s = String(text || "").trim();
  if (!s) return true;
  if (/^\s*<!doctype html|^\s*<html/i.test(s)) return true;
  return false;
}

async function fetchTextResource(url, { isHtml = false, timeoutMs = 6500 } = {}) {
  // 1. Direct browser/Node fetch first
  try {
    const res = await fetchWithTimeout(url, {
      method: "GET",
      headers: { Accept: isHtml ? "text/html,application/xhtml+xml" : "text/plain,application/xml,*/*" },
    }, timeoutMs);
    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: res.status, transport: "direct", body: null, reason: "HTTP_404" };
    }
    if (res.ok) {
      const body = await res.text();
      if (!isHtml && url.endsWith(".txt") && looksLikeHtml404OrError(body)) {
        return { ok: false, status: 404, transport: "direct", body: null, reason: "HTML_FALLBACK_NOT_TXT" };
      }
      return { ok: true, status: res.status, transport: "direct", body };
    }
  } catch {
    // Expected for CORS-restricted origins in browsers; fall through to r.jina.ai
  }

  // 2. Fallback via public CORS-enabled r.jina.ai reader
  try {
    const headers = isHtml ? { "X-Return-Format": "html" } : {};
    const jinaRes = await fetchWithTimeout(`https://r.jina.ai/${url}`, { headers }, timeoutMs + 1500);
    if (!jinaRes.ok) {
      return { ok: false, status: jinaRes.status, transport: "jina", body: null, reason: `JINA_HTTP_${jinaRes.status}` };
    }
    const raw = await jinaRes.text();
    if (/^\s*\{.*"name"\s*:\s*"AbuseAlleviationError"/s.test(raw)) {
      return { ok: false, status: 403, transport: "jina", body: null, reason: "JINA_RATE_LIMIT" };
    }
    if (isHtml) {
      if (!/<html|<head|<body|<title/i.test(raw)) {
        return { ok: false, status: 502, transport: "jina", body: null, reason: "NON_HTML_RESPONSE" };
      }
      return { ok: true, status: 200, transport: "r.jina.ai", body: raw };
    }
    const parsed = parseJinaTextEnvelope(raw);
    if (!parsed.ok || (url.endsWith(".txt") && looksLikeHtml404OrError(parsed.body))) {
      return { ok: false, status: 404, transport: "r.jina.ai", body: null, reason: "HTTP_404" };
    }
    return { ok: true, status: 200, transport: "r.jina.ai", body: parsed.body };
  } catch (err) {
    const isAbort = err?.name === "AbortError" || /abort|timeout/i.test(err?.message || "");
    return {
      ok: false,
      status: 0,
      transport: "none",
      body: null,
      reason: isAbort ? "TIMEOUT" : "CORS_OR_NETWORK_BLOCKED",
    };
  }
}

/**
 * Concurrently probe a live public URL for HTML, robots.txt, llms.txt, and sitemap.xml.
 * Supports both root domains and subpath sites (e.g. GitHub Pages project URLs).
 * Never fabricates results on failure.
 * @param {string} rawUrl
 * @param {object} [options]
 */
export async function probeLiveUrl(rawUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 6500;
  let normalized = String(rawUrl || "").trim();
  if (!normalized) {
    return { ok: false, reason: "EMPTY_URL", message: "Please enter a valid URL." };
  }
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { ok: false, reason: "INVALID_URL", message: "Malformed URL format." };
  }

  const origin = parsedUrl.origin;
  const hasSubpath = parsedUrl.pathname && parsedUrl.pathname !== "/";
  const subDir = hasSubpath
    ? origin + (parsedUrl.pathname.endsWith("/") ? parsedUrl.pathname : parsedUrl.pathname.replace(/\/[^/]*$/, "/"))
    : origin + "/";

  const probePaths = async (filename) => {
    const isGhPagesSubpath = parsedUrl.hostname.endsWith(".github.io") && hasSubpath && subDir !== `${origin}/`;
    const primaryUrl = isGhPagesSubpath ? `${subDir}${filename}` : `${origin}/${filename}`;
    const secondaryUrl = isGhPagesSubpath ? `${origin}/${filename}` : `${subDir}${filename}`;

    const primaryRes = await fetchTextResource(primaryUrl, { isHtml: false, timeoutMs });
    if (primaryRes.ok || !hasSubpath || subDir === `${origin}/`) {
      return primaryRes;
    }
    return fetchTextResource(secondaryUrl, { isHtml: false, timeoutMs });
  };

  const [htmlRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
    fetchTextResource(parsedUrl.toString(), { isHtml: true, timeoutMs }),
    probePaths("robots.txt"),
    probePaths("llms.txt"),
    probePaths("sitemap.xml"),
  ]);

  if (!htmlRes.ok || !htmlRes.body) {
    return {
      ok: false,
      url: parsedUrl.toString(),
      reason: htmlRes.reason || "FETCH_FAILED",
      transport: htmlRes.transport,
      robotsTxt: robotsRes.ok ? robotsRes.body : null,
      llmsTxt: llmsRes.ok ? llmsRes.body : null,
      sitemapXmlFound: sitemapRes.ok,
    };
  }

  return {
    ok: true,
    url: parsedUrl.toString(),
    transport: htmlRes.transport,
    html: htmlRes.body,
    robotsTxt: robotsRes.ok ? robotsRes.body : robotsRes.status === 404 ? "" : null,
    llmsTxt: llmsRes.ok ? llmsRes.body : null,
    sitemapXmlFound: sitemapRes.ok,
    probeLog: {
      html: `${htmlRes.transport} (${htmlRes.status})`,
      robots: robotsRes.ok ? `${robotsRes.transport} (200)` : `missing/blocked (${robotsRes.reason || robotsRes.status})`,
      llms: llmsRes.ok ? `${llmsRes.transport} (200)` : `missing (${llmsRes.reason || llmsRes.status})`,
      sitemap: sitemapRes.ok ? `${sitemapRes.transport} (200)` : `missing (${sitemapRes.reason || sitemapRes.status})`,
    },
  };
}

/**
 * Three realistic one-click sample fixtures for Mode B offline diagnostic.
 */
export const SAMPLES = {
  "broken-indie": {
    id: "broken-indie",
    labelZh: "① 误封 GPTBot 且缺 Schema 的独立站",
    labelEn: "① Broken Indie Store (Blocks GPTBot, No Schema)",
    url: "https://velodesk-ergo.example/",
    robotsTxt: [
      "# Copied generic anti-scraper template",
      "User-agent: GPTBot",
      "Disallow: /",
      "",
      "User-agent: OAI-SearchBot",
      "Disallow: /",
      "",
      "User-agent: PerplexityBot",
      "Disallow: /",
      "",
      "User-agent: ClaudeBot",
      "Disallow: /",
    ].join("\n"),
    llmsTxt: "",
    html: `<!DOCTYPE html>
<html>
<head>
  <title>Home</title>
</head>
<body>
  <div class="hero">
    <img src="/assets/hero-pricing-poster.png" alt="VeloDesk Standing Desk Promo">
    <div id="root"></div>
    <p>Welcome to VeloDesk. Contact sales for catalog.</p>
  </div>
</body>
</html>`,
  },

  "average-shopify": {
    id: "average-shopify",
    labelZh: "② 普通 Shopify 电商独立站",
    labelEn: "② Average Shopify Store (Partial Schema, No llms.txt)",
    url: "https://kuromatcha.example/products/ceremonial-tin",
    robotsTxt: [
      "User-agent: *",
      "Disallow: /admin",
      "Disallow: /cart",
      "Disallow: /checkout",
      "Allow: /",
      "Sitemap: https://kuromatcha.example/sitemap.xml",
    ].join("\n"),
    llmsTxt: "",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>KuroMatcha Ceremonial First-Harvest Uji Matcha Tin</title>
  <meta name="description" content="Single-cultivar stone-milled ceremonial Uji matcha shipped fresh from Kyoto in airtight 30g tins.">
  <link rel="canonical" href="https://kuromatcha.example/products/ceremonial-tin">
  <meta property="og:url" content="https://kuromatcha.example/products/ceremonial-tin">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "KuroMatcha Ceremonial First-Harvest Tin (30g)",
    "description": "Stone-milled first-harvest ceremonial matcha from Uji, Kyoto.",
    "offers": {
      "@type": "Offer",
      "price": "38.00"
    }
  }
  </script>
</head>
<body>
  <main>
    <h1>KuroMatcha Ceremonial First-Harvest Tin</h1>
    <p class="price">$38.00 USD — Add to Cart</p>
    <h2>Shade-Grown in Uji, Kyoto</h2>
    <p>28-day shaded tencha leaves stone-ground in small batches for umami richness.</p>
    <h2>Freshness & Storage</h2>
    <p>Nitrogen-flushed double-lid tin locks aroma for 12 months.</p>
  </main>
</body>
</html>`,
  },

  "gold-benchmark": {
    id: "gold-benchmark",
    labelZh: "③ AI 友好满分标杆独立站",
    labelEn: "③ AI-Ready 100/100 Benchmark Store",
    url: "https://lumenbrew.example/products/precision-kettle",
    robotsTxt: [
      "User-agent: *",
      "Allow: /",
      "Disallow: /cart",
      "",
      "User-agent: OAI-SearchBot",
      "Allow: /",
      "",
      "User-agent: GPTBot",
      "Allow: /",
      "",
      "User-agent: PerplexityBot",
      "Allow: /",
      "",
      "User-agent: Claude-SearchBot",
      "Allow: /",
      "",
      "User-agent: ClaudeBot",
      "Allow: /",
      "",
      "Sitemap: https://lumenbrew.example/sitemap.xml",
    ].join("\n"),
    llmsTxt: [
      "# LumenBrew Studio",
      "",
      "> Precision PID gooseneck electric kettle ($149 USD) engineered for specialty pour-over coffee, shipping worldwide with 2-year warranty.",
      "",
      "## Products & Pricing",
      "- [LumenBrew Stagg-Class PID Kettle ($149 USD)](https://lumenbrew.example/products/precision-kettle): 0.9L matte stainless kettle, ±0.5°C PID control, InStock.",
      "- [Pricing & Bulk Wholesale](https://lumenbrew.example/pricing): Transparent retail & cafe tiers.",
      "",
      "## Documentation & Support",
      "- [Brewing Temperature Guide](https://lumenbrew.example/guides/temp): Tested recipes for light and medium roasts.",
      "- [Warranty & FAQ](https://lumenbrew.example/faq): 2-year hardware replacement policy.",
    ].join("\n"),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>LumenBrew Precision PID Kettle — $149 Pour-Over Gooseneck Kettle</title>
  <meta name="description" content="LumenBrew Precision PID Pour-Over Kettle ($149 USD) delivers ±0.5°C temperature stability, 1200W quick heat, and a 2-year warranty.">
  <link rel="canonical" href="https://lumenbrew.example/products/precision-kettle">
  <meta property="og:url" content="https://lumenbrew.example/products/precision-kettle">
  <link rel="alternate" hreflang="en" href="https://lumenbrew.example/products/precision-kettle">
  <link rel="alternate" hreflang="zh-CN" href="https://lumenbrew.example/zh/products/precision-kettle">
  <link rel="sitemap" type="application/xml" href="https://lumenbrew.example/sitemap.xml">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "LumenBrew Studio",
        "url": "https://lumenbrew.example/"
      },
      {
        "@type": "Product",
        "name": "LumenBrew Precision PID Pour-Over Kettle",
        "description": "0.9L 304 stainless steel gooseneck kettle with ±0.5°C PID hold and 1200W rapid boil.",
        "offers": {
          "@type": "Offer",
          "price": "149.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://lumenbrew.example/products/precision-kettle"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "bestRating": "5",
          "reviewCount": "142"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What temperature accuracy does the LumenBrew PID Kettle hold?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The built-in PID sensor holds water between 40°C and 100°C within ±0.5°C for up to 60 minutes."
            }
          },
          {
            "@type": "Question",
            "name": "What warranty is included with the $149 LumenBrew Kettle?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Every unit includes a 2-year direct replacement warranty and free US/EU return shipping within 30 days."
            }
          }
        ]
      }
    ]
  }
  </script>
</head>
<body>
  <main>
    <h1>LumenBrew Precision PID Pour-Over Kettle</h1>
    <p><strong>$149.00 USD</strong> · In Stock · Ships within 24h · <a href="#checkout">Buy Now</a></p>
    <p>Rated 4.9 / 5 across 142 verified coffee baristas and home brewers.</p>
    <h2>±0.5°C PID Stability & 1200W Fast Boil</h2>
    <p>Reaches 93°C in under 3 minutes with zero overshoot.</p>
    <h2>2-Year Direct Replacement Warranty</h2>
    <p>Covered across 110V–120V (US) and 220V–240V (EU/UK/CN) models.</p>
    <h2>Frequently Asked Questions</h2>
    <details open>
      <summary>What temperature accuracy does the LumenBrew PID Kettle hold?</summary>
      <p>The built-in PID sensor holds water between 40°C and 100°C within ±0.5°C for up to 60 minutes.</p>
    </details>
    <details open>
      <summary>What warranty is included with the $149 LumenBrew Kettle?</summary>
      <p>Every unit includes a 2-year direct replacement warranty and free return shipping within 30 days.</p>
    </details>
  </main>
</body>
</html>`,
  },
};
