import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PUBLIC_SPKI_BASE64,
  PRODUCT_SLUG,
  SAMPLES,
  auditSite,
  parseRobotsTxt,
  parseJsonLdBlocks,
  verifyLicenseToken,
} from "../src/auditor.mjs";
import * as browserAuditor from "../docs/auditor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function toBase64Url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function signTestToken(payloadObj, privateKey) {
  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(payloadObj), "utf8"));
  const sig = crypto.sign(null, Buffer.from(`OPC1.${payloadB64}`, "utf8"), privateKey);
  return `OPC1.${payloadB64}.${toBase64Url(sig)}`;
}

test("src/auditor.mjs and docs/auditor.js stay byte-identical", () => {
  const srcBytes = fs.readFileSync(path.join(ROOT, "src", "auditor.mjs"), "utf8");
  const docsBytes = fs.readFileSync(path.join(ROOT, "docs", "auditor.js"), "utf8");
  assert.equal(srcBytes, docsBytes);
  assert.equal(browserAuditor.PUBLIC_SPKI_BASE64, PUBLIC_SPKI_BASE64);
});

test("Broken site blocking GPTBot without JSON-LD and llms.txt scores well below 40 with red diagnostics", () => {
  const brokenSample = SAMPLES["broken-indie"];
  const report = auditSite({
    url: brokenSample.url,
    html: brokenSample.html,
    robotsTxt: brokenSample.robotsTxt,
    llmsTxt: brokenSample.llmsTxt,
  });

  assert.equal(report.checks.length, 12);
  assert.ok(report.score < 40, `Expected broken site score < 40, got ${report.score}`);
  assert.equal(report.tierColor, "red");

  const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
  assert.equal(byId.oai_searchbot.status, "fail");
  assert.equal(byId.ai_bots_policy.status, "fail");
  assert.equal(byId.llms_txt.status, "fail");
  assert.equal(byId.jsonld_core.status, "fail");
  assert.equal(byId.jsonld_offer.status, "fail");
  assert.equal(byId.jsonld_faq.status, "fail");

  // Even a site with otherwise good HTML metadata/headings/pricing MUST stay < 40
  // when GPTBot is blocked, JSON-LD is missing, and llms.txt is missing.
  const decentHtmlBrokenGeo = auditSite({
    url: "https://decent-html-broken-geo.example/",
    robotsTxt: "User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: https://decent-html-broken-geo.example/sitemap.xml",
    llmsTxt: "",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Acme Ergonomic Standing Desk Converter Pro</title>
  <meta name="description" content="Acme Ergonomic Standing Desk Converter adjusts smoothly for home offices at $189 USD.">
  <link rel="canonical" href="https://decent-html-broken-geo.example/">
  <meta property="og:url" content="https://decent-html-broken-geo.example/">
  <link rel="alternate" hreflang="en" href="https://decent-html-broken-geo.example/">
</head>
<body>
  <main>
    <h1>Acme Ergonomic Standing Desk</h1>
    <p>$189.00 USD — Buy Now</p>
    <h2>Gas-Spring Height Adjustment</h2>
    <h2>Dual-Monitor Carbon Surface</h2>
  </main>
</body>
</html>`,
  });

  assert.ok(
    decentHtmlBrokenGeo.score < 40,
    `Expected site with GPTBot blocked + no JSON-LD + no llms.txt < 40, got ${decentHtmlBrokenGeo.score}`
  );
  const decentChecks = Object.fromEntries(decentHtmlBrokenGeo.checks.map((c) => [c.id, c]));
  assert.equal(decentChecks.ai_bots_policy.status, "fail");
  assert.equal(decentChecks.llms_txt.status, "fail");
  assert.equal(decentChecks.jsonld_core.status, "fail");
});

test("Average Shopify sample scores in yellow band (45-79)", () => {
  const sample = SAMPLES["average-shopify"];
  const report = auditSite({
    url: sample.url,
    html: sample.html,
    robotsTxt: sample.robotsTxt,
    llmsTxt: sample.llmsTxt,
  });
  assert.ok(report.score >= 45 && report.score < 80, `Expected 45..79, got ${report.score}`);
  assert.equal(report.tierColor, "yellow");
});

test("Gold benchmark site HTML + robots.txt + llms.txt scores >= 85 (100/100)", () => {
  const gold = SAMPLES["gold-benchmark"];
  const report = auditSite({
    url: gold.url,
    html: gold.html,
    robotsTxt: gold.robotsTxt,
    llmsTxt: gold.llmsTxt,
    sitemapXmlFound: true,
  });

  assert.ok(report.score >= 85, `Expected benchmark score >= 85, got ${report.score}`);
  assert.equal(report.score, 100);
  assert.equal(report.tierColor, "green");
  assert.equal(report.checks.every((c) => c.status === "pass"), true);
});

test("Generated JSON-LD parses cleanly with JSON.parse and contains @context https://schema.org", () => {
  for (const sample of Object.values(SAMPLES)) {
    const report = auditSite({
      url: sample.url,
      html: sample.html,
      robotsTxt: sample.robotsTxt,
      llmsTxt: sample.llmsTxt,
    });

    const parsed = JSON.parse(report.fixPack.jsonLdJson);
    assert.equal(parsed["@context"], "https://schema.org");
    assert.ok(Array.isArray(parsed["@graph"]) && parsed["@graph"].length >= 3);

    const types = parsed["@graph"].map((n) => n["@type"]);
    assert.ok(types.includes("Organization"));
    assert.ok(types.includes("FAQPage"));
    assert.ok(types.some((t) => ["Product", "SoftwareApplication", "LocalBusiness"].includes(t)));

    // Verify preview contains <= 10 lines and non-empty brand context
    const previewLines = report.preview.llmsPreview10.split("\n");
    assert.ok(previewLines.length > 0 && previewLines.length <= 10);
    assert.ok(report.fixPack.buyerPrompts.length === 20);
  }
});

test("robots.txt parser respects RFC-style group override (explicit GPTBot beats wildcard *)", () => {
  const parsed = parseRobotsTxt([
    "User-agent: *",
    "Allow: /",
    "",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
  ].join("\n"));

  assert.equal(parsed.bots["*"].allowed, true);
  assert.equal(parsed.bots["OAI-SearchBot"].allowed, true);
  assert.equal(parsed.bots["OAI-SearchBot"].matchedBy, "explicit");
  assert.equal(parsed.bots["GPTBot"].allowed, false);
  assert.equal(parsed.bots["GPTBot"].matchedBy, "explicit");
});

test("JSON-LD parser flags malformed JSON cleanly without crashing", () => {
  const res = parseJsonLdBlocks(`<html><head><script type="application/ld+json">{ bad json</script></head></html>`);
  assert.equal(res.blockCount, 1);
  assert.equal(res.validBlockCount, 0);
  assert.equal(res.errors.length, 1);
});

test("Ed25519 license verification passes both node:crypto and globalThis.crypto.subtle", async () => {
  // 1. Validate embedded production SPKI public key loads in both node:crypto and WebCrypto
  const prodSpkiDer = Buffer.from(PUBLIC_SPKI_BASE64, "base64");
  const prodNodeKey = crypto.createPublicKey({ key: prodSpkiDer, format: "der", type: "spki" });
  assert.equal(prodNodeKey.asymmetricKeyType, "ed25519");

  const prodSubtleKey = await globalThis.crypto.subtle.importKey(
    "spki",
    prodSpkiDer,
    { name: "Ed25519" },
    false,
    ["verify"]
  );
  assert.equal(prodSubtleKey.algorithm.name, "Ed25519");

  const badAgainstProd = await verifyLicenseToken("OPC1.eyJ2IjoxLCJwIjoiZ2VvLWRvY3RvciJ9.AAAA");
  assert.equal(badAgainstProd.valid, false);
  assert.equal(badAgainstProd.reason, "BAD_SIGNATURE");

  // 2. End-to-end sign -> verify with ephemeral Ed25519 keypair (node:crypto + WebCrypto)
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const testSpkiB64 = publicKey.export({ format: "der", type: "spki" }).toString("base64");
  const nowSec = Math.floor(Date.now() / 1000);

  const validToken = signTestToken(
    { v: 1, p: PRODUCT_SLUG, e: "merchant@example.com", plan: "fix-pack", iat: nowSec, exp: 0 },
    privateKey
  );
  const wildcardToken = signTestToken(
    { v: 1, p: "*", e: "vip@example.com", plan: "all-access", iat: nowSec, exp: 0 },
    privateKey
  );
  const wrongProductToken = signTestToken(
    { v: 1, p: "agent-guard", e: "other@example.com", plan: "pro", iat: nowSec, exp: 0 },
    privateKey
  );
  const expiredToken = signTestToken(
    { v: 1, p: PRODUCT_SLUG, e: "old@example.com", plan: "pro", iat: nowSec - 7200, exp: nowSec - 60 },
    privateKey
  );

  // Check node:crypto verification directly on validToken
  const [, pB64, sB64] = validToken.split(".");
  assert.equal(
    crypto.verify(null, Buffer.from(`OPC1.${pB64}`, "utf8"), publicKey, fromBase64Url(sB64)),
    true
  );

  // Check WebCrypto verifyLicenseToken
  const resValid = await verifyLicenseToken(validToken, { publicSpkiBase64: testSpkiB64, nowSec });
  assert.equal(resValid.valid, true);
  assert.equal(resValid.payload.p, "geo-doctor");
  assert.equal(resValid.payload.e, "merchant@example.com");

  const resWildcard = await verifyLicenseToken(wildcardToken, { publicSpkiBase64: testSpkiB64, nowSec });
  assert.equal(resWildcard.valid, true);
  assert.equal(resWildcard.payload.p, "*");

  const resWrongProd = await verifyLicenseToken(wrongProductToken, { publicSpkiBase64: testSpkiB64, nowSec });
  assert.equal(resWrongProd.valid, false);
  assert.equal(resWrongProd.reason, "PRODUCT_MISMATCH");

  const resExpired = await verifyLicenseToken(expiredToken, { publicSpkiBase64: testSpkiB64, nowSec });
  assert.equal(resExpired.valid, false);
  assert.equal(resExpired.reason, "EXPIRED");

  const tamperedToken = validToken.slice(0, -4) + "zzzz";
  const resTampered = await verifyLicenseToken(tamperedToken, { publicSpkiBase64: testSpkiB64, nowSec });
  assert.equal(resTampered.valid, false);
  assert.equal(resTampered.reason, "BAD_SIGNATURE");
});

test("GEO Doctor's own docs/ site passes all 12 checks with 100/100 benchmark score", () => {
  const html = fs.readFileSync(path.join(ROOT, "docs", "index.html"), "utf8");
  const robotsTxt = fs.readFileSync(path.join(ROOT, "docs", "robots.txt"), "utf8");
  const llmsTxt = fs.readFileSync(path.join(ROOT, "docs", "llms.txt"), "utf8");
  const sitemapExists = fs.existsSync(path.join(ROOT, "docs", "sitemap.xml"));

  const report = auditSite({
    url: "https://a3152557994-ship-it.github.io/geo-doctor/",
    html,
    robotsTxt,
    llmsTxt,
    sitemapXmlFound: sitemapExists,
  });

  assert.equal(report.score, 100, `Expected docs/ self-audit 100/100, got ${report.score}: ${JSON.stringify(report.checks.filter(c => c.status !== "pass"))}`);
  assert.equal(report.grade, "A+");
  assert.equal(report.tierColor, "green");
  assert.equal(report.checks.every((c) => c.status === "pass"), true);
});

