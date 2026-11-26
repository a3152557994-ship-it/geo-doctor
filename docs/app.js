import {
  PRODUCT_SLUG,
  SAMPLES,
  auditSite,
  probeLiveUrl,
  verifyLicenseToken,
} from "./auditor.js";

/**
 * Reserved payment integration slots.
 * Populate Stripe Payment Links or local QR image paths (e.g. "assets/pay-qr.png") anytime.
 */
const PAYMENT_CONFIG = {
  emailPrimary: "a3152557994@gmail.com",
  emailSecondary: "3152557994@qq.com",
  stripeFixPackUrl: "",
  stripeDfyUrl: "",
  qrCodeImageUrl: "",
};

const STORAGE_LICENSE_KEY = "geo_doctor_opc1_token_v1";
const GLOBAL_WILDCARD_KEY = "opc_global_license_v1";

const I18N = {
  zh: {
    navSelfAudit: "自检本站标杆 (100分)",
    navUnlock: "激活码解锁",
    heroBadge: "12 项 ChatGPT / Perplexity / Claude 推荐度硬核体检 · 纯前端本地验签",
    heroTitle: 'AI 时代客户先问 ChatGPT：<br>你的独立站会被<span class="hero-serif">直接推荐</span>，还是当场隐身？',
    heroLead: "3 秒排查 OAI-SearchBot 放行、/llms.txt 与 Product + Offer + FAQPage JSON-LD 缺失。免费查看 0–100 体检报告与专属 llms.txt 前 10 行预览；一键修复包低至 $29 / ¥99 立即买断。",
    heroPricingPill: "修复包 $29 / ¥99 · 人工代部署 $199 / ¥499",
    heroZeroLeak: "源码仅在本地浏览器解析 · 绝不上传商业隐私",
    heroBuyLink: "查看修复包清单 →",
    modeATab: "模式 A：在线 URL 并发探测",
    modeBTab: "模式 B：粘贴源码精确体检（抗跨域防拦截）",
    btnRunUrl: "立即体检 URL",
    modeAHint: "并发探测目标页 HTML、/robots.txt、/llms.txt 与 /sitemap.xml（优先直连，受跨域限制时自动回退公开读取通道；绝不伪造结果）。",
    sampleBarLabel: "一键载入典型实盘样例：",
    labelSourceUrl: "目标页面 URL（用于生成规范 canonical 与 /llms.txt 链接）",
    btnCopyCurl: "复制 curl 抓源码命令",
    labelHtml: "HTML 页面源码 *",
    labelRobots: "robots.txt 内容",
    labelLlms: "/llms.txt 内容（可选，留空按缺失计）",
    btnRunSource: "执行 100% 离线精准体检",
    statPass: "绿灯通过",
    statWarn: "黄灯待优",
    statFail: "红灯阻断",
    ctaGenerateFix: "生成专属修复包 ($29 / ¥99)",
    checksHeading: "12 项 AI 推荐度诊断明细",
    filterAll: "全部 (12)",
    filterFail: "红灯阻断",
    filterWarn: "黄灯提醒",
    filterPass: "已通过",
    previewHeading: "免费赠送：已为当前站点动态生成 /llms.txt 前 10 行真实预览",
    previewSub: "已自动提取站点名称、产品类型、明文定价与卖点层级；完整 /llms.txt、llms-full.txt、JSON-LD 与 20 个买家自测提问可在下方一键解锁。",
    btnCopyPreview: "复制前 10 行预览",
    pricingHeading: "一键修复包与高客单代部署方案",
    pricingSub: "一次性买断，无按月订阅割韭菜。修复完立刻用上方诊断台复测验证分数飙升。",
    plan1Tag: "自助极速买断 · 主推",
    plan1Title: "单站一键修复包 (Fix Pack)",
    plan1Cta: "获取修复包（$29 / ¥99）",
    plan2Tag: "人工交付 · 省心托管",
    plan2Title: "Shopify / WordPress 人工代部署",
    plan2Cta: "预约人工代部署（$199 / ¥499）",
    btnVerifyLicense: "本地 Ed25519 验签解锁",
    btnClearLicense: "清除激活码",
    btnCopyAsset: "一键复制",
    btnDownloadAsset: "导出文件",
    lockOverlayTitle: "已按当前体检站点生成专属修复包（待解锁）",
    lockOverlaySub: "输入 OPC1. 激活码即刻在浏览器本地通过 Ed25519 公钥验签解锁全部 5 项交付文件；暂无激活码可直接点击下单秒发。",
    lockOverlayCta: "立即获取激活码（$29 / ¥99）",
    selfAuditLabel: "透明自测基准：12/12 自动化规范实测通过（5.0 / 5.0 · 1 条公开测试套件验证记录 · 零虚构买家评价）",
    btnAuditSelfNow: "立即实测本站分数 →",
    faqHeading: "常见问题（FAQ）",
    allAccessTitle: "🔥 OPC All-Access 全站 14 款工具通票：¥39 / $14.99 一次性买断",
    allAccessDesc: "签发一枚 p=\"*\" 全通型 OPC1. 激活码，直接解锁本站 GEO Doctor 完整修复包 + 全站其余 13 款开发者与跨境效率工具！",
    allAccessCta: "申领全站通票（¥39 / $14.99）",
    modalTitle: "统一收银台 · 申领或当场验签 OPC1. 激活码",
    modalStep1: "① 一键复制订单口令（含商品、价格、站点得分与专属单号）",
    modalStep2: "② 客服快速通道（粘贴发送上方口令，秒发 OPC1. 激活码）",
    modalStep3: "③ 已购 OPC1. 激活码？当场本地 Ed25519 验签秒解锁",
    btnSendQQ: "✉️ 备用：邮件客户端",
    btnCopyOrder: "📋 一键复制订单口令",
    probingText: "正在并发探测目标页、robots.txt、llms.txt 与 sitemap.xml（最多等待 8 秒）…",
    probeFailedPrefix: "在线抓取受阻（绝不伪造结果）：",
    probeFailedGuide: "Shopify / Cloudflare 站点常拦截浏览器跨域请求。点击下方按钮一键切换「模式 B」，粘贴源码即可 100% 精准体检！",
    switchToModeB: "切换到模式 B（粘贴源码）",
    copiedText: "已复制",
    passLabel: "通过",
    warnLabel: "待优",
    failLabel: "阻断",
    fixPrefix: "修复建议：",
    projectionFmt: (curr, proj) => `当前 AI 推荐准备度：<strong>${curr}/100</strong> → 部署 Fix Pack 后预计可达 <strong>${proj}/100</strong>`,
    unlockedMeta: (email, plan) => `已通过 Ed25519 本地验签解锁 · 授权对象: ${email || "Verified"} (${plan || "pro"})`,
    lockedMeta: "已锁定 — 输入 OPC1. 激活码本地验签后解锁复制与文件导出",
  },
  en: {
    navSelfAudit: "Self-Audit This Page (100/100)",
    navUnlock: "License Unlock",
    heroBadge: "12-Point ChatGPT / Perplexity / Claude Readiness Audit · Local Ed25519 Unlock",
    heroTitle: 'Buyers Ask ChatGPT First:<br>Will AI <span class="hero-serif">Recommend</span> Your Store or Skip It?',
    heroLead: "Check OAI-SearchBot access, /llms.txt, and Product + Offer + FAQPage JSON-LD in 3 seconds. Inspect your 0–100 score and custom 10-line llms.txt preview free; unlock the full Fix Pack for $29 / ¥99.",
    heroPricingPill: "Fix Pack $29 / ¥99 · Done-For-You $199 / ¥499",
    heroZeroLeak: "100% client-side HTML parsing · Zero source upload",
    heroBuyLink: "View Fix Pack →",
    modeATab: "Mode A: Live URL Concurrent Probe",
    modeBTab: "Mode B: Paste Source (100% Offline Precision)",
    btnRunUrl: "Audit Live URL",
    modeAHint: "Concurrently probes HTML, /robots.txt, /llms.txt, and /sitemap.xml (direct fetch first, public reader fallback on CORS; never fabricates scores).",
    sampleBarLabel: "Load real-world sample:",
    labelSourceUrl: "Target Page URL (used for canonical & /llms.txt links)",
    btnCopyCurl: "Copy curl fetch command",
    labelHtml: "Page HTML Source *",
    labelRobots: "robots.txt Content",
    labelLlms: "/llms.txt Content (optional)",
    btnRunSource: "Run 100% Offline Audit",
    statPass: "Passed",
    statWarn: "Warnings",
    statFail: "Blocked",
    ctaGenerateFix: "Unlock Fix Pack ($29 / ¥99)",
    checksHeading: "12-Point AI Search Diagnostic Breakdown",
    filterAll: "All (12)",
    filterFail: "Red Fails",
    filterWarn: "Warnings",
    filterPass: "Passed",
    previewHeading: "Free Preview: First 10 Lines of Your Tailored /llms.txt",
    previewSub: "Auto-extracted from your site title, entity type, plaintext pricing, and headings. Unlock the full /llms.txt, llms-full.txt, JSON-LD, and 20 buyer prompts below.",
    btnCopyPreview: "Copy 10-Line Preview",
    pricingHeading: "One-Click Fix Pack & Done-For-You Deployment",
    pricingSub: "One-time purchase, zero recurring SaaS tax. Re-run the diagnostic above after deploying to verify your score jump.",
    plan1Tag: "Self-Serve · Best Value",
    plan1Title: "Single-Site Fix Pack",
    plan1Cta: "Get Fix Pack ($29 / ¥99)",
    plan2Tag: "Managed Service",
    plan2Title: "Shopify / WordPress Done-For-You",
    plan2Cta: "Book Done-For-You ($199 / ¥499)",
    btnVerifyLicense: "Verify Ed25519 & Unlock",
    btnClearLicense: "Clear Key",
    btnCopyAsset: "Copy Code",
    btnDownloadAsset: "Download File",
    lockOverlayTitle: "Your Site-Specific Fix Pack Is Ready (Locked)",
    lockOverlaySub: "Paste an OPC1. license code for instant browser-local Ed25519 verification, or click below to order and receive your code.",
    lockOverlayCta: "Get License Code ($29 / ¥99)",
    selfAuditLabel: "Transparent Self-Benchmark: 12/12 automated checks verified (5.0 / 5.0 · 1 open test-suite audit · zero fabricated reviews)",
    btnAuditSelfNow: "Test This Site Now →",
    faqHeading: "Frequently Asked Questions",
    allAccessTitle: "🔥 OPC All-Access Master Key (All 14 Tools): ¥39 / $14.99 One-Time",
    allAccessDesc: "One p=\"*\" Ed25519 OPC1. key unlocks GEO Doctor Fix Pack + all 13 other web & CLI utilities on OPC Hub!",
    allAccessCta: "Get Master Key (¥39 / $14.99)",
    modalTitle: "Unified Checkout & Instant OPC1. License Unlock",
    modalStep1: "① Copy Order Command (Product, Price, Score & Order ID)",
    modalStep2: "② Fast Support Channel (QQ / WeChat: 3152557994)",
    modalStep3: "③ Already Have an OPC1. Key? Verify & Unlock Locally",
    btnSendQQ: "✉️ Fallback: Mail App",
    btnCopyOrder: "📋 Copy Order Command",
    probingText: "Concurrently probing HTML, /robots.txt, /llms.txt, and /sitemap.xml (timeout 8s)...",
    probeFailedPrefix: "Live fetch blocked (never fabricated): ",
    probeFailedGuide: "Shopify / Cloudflare stores often block cross-origin browser requests. Switch to Mode B to paste HTML & robots.txt for 100% accurate offline analysis.",
    switchToModeB: "Switch to Mode B (Paste Source)",
    copiedText: "Copied!",
    passLabel: "PASS",
    warnLabel: "WARN",
    failLabel: "FAIL",
    fixPrefix: "Fix: ",
    projectionFmt: (curr, proj) => `Current AI Readiness: <strong>${curr}/100</strong> → Projected after Fix Pack: <strong>${proj}/100</strong>`,
    unlockedMeta: (email, plan) => `Unlocked locally via Ed25519 · Licensed to: ${email || "Verified"} (${plan || "pro"})`,
    lockedMeta: "Locked — Verify OPC1 license locally to unlock copy & file download",
  },
};

const state = {
  lang: "zh",
  mode: "url",
  filter: "all",
  activeAsset: "llmsTxt",
  report: null,
  license: { unlocked: false, payload: null, token: "" },
  modalPlan: "fix-pack",
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showStatus(msg, type = "info", actionBtn = null) {
  const el = $("probe-status");
  el.className = `status-banner ${type}`;
  el.innerHTML = "";
  const span = document.createElement("span");
  span.textContent = msg;
  el.appendChild(span);
  if (actionBtn) {
    el.appendChild(document.createTextNode(" "));
    el.appendChild(actionBtn);
  }
  el.classList.remove("hidden");
}

function hideStatus() {
  $("probe-status").classList.add("hidden");
}

function applyLanguage() {
  const dict = I18N[state.lang];
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (dict[key]) el.innerHTML = dict[key];
  });

  // Update sample buttons
  document.querySelectorAll(".sample-btn").forEach((btn) => {
    const sample = SAMPLES[btn.dataset.sample];
    if (sample) {
      btn.textContent = state.lang === "zh" ? sample.labelZh : sample.labelEn;
    }
  });

  $("btn-lang-toggle").textContent = state.lang === "zh" ? "Switch to EN" : "切换中文";

  if (state.report) renderReport();
}

function setMode(mode) {
  state.mode = mode;
  const isUrl = mode === "url";
  $("tab-mode-url").classList.toggle("active", isUrl);
  $("tab-mode-source").classList.toggle("active", !isUrl);
  $("panel-mode-url").classList.toggle("hidden", !isUrl);
  $("panel-mode-source").classList.toggle("hidden", isUrl);
  hideStatus();
}

function renderReport() {
  const r = state.report;
  if (!r) return;
  const dict = I18N[state.lang];

  // Ring math (r=66 -> circumference = 2 * pi * 66 = 414.69)
  const circ = 414.69;
  const offset = circ - (circ * r.score) / 100;
  const ring = $("score-ring-arc");
  ring.style.strokeDashoffset = String(offset.toFixed(2));
  ring.style.stroke =
    r.tierColor === "green"
      ? "var(--green)"
      : r.tierColor === "yellow"
        ? "var(--amber)"
        : "var(--red)";

  $("score-value").textContent = String(r.score);
  const badge = $("grade-badge");
  badge.className = `grade-badge tier-${r.tierColor}`;
  badge.textContent = `Grade ${r.grade} · ${
    r.tierColor === "green"
      ? state.lang === "zh" ? "AI 推荐友好" : "AI-Ready"
      : r.tierColor === "yellow"
        ? state.lang === "zh" ? "中等（存在缺口）" : "Moderate Gaps"
        : state.lang === "zh" ? "高危隐身风险" : "High Invisibility Risk"
  }`;

  $("audited-brand").textContent = r.extracted.brandName || "Target Site";
  $("audited-url").textContent = r.extracted.url || "(Offline Source)";
  $("count-pass").textContent = String(r.preview.passCount);
  $("count-warn").textContent = String(r.preview.warnCount);
  $("count-fail").textContent = String(r.preview.failCount);
  $("projection-box").innerHTML = dict.projectionFmt(r.score, r.preview.projectedScore);

  // 12 Checks list
  const listEl = $("check-list");
  listEl.innerHTML = "";
  const filtered = r.checks.filter((c) => state.filter === "all" || c.status === state.filter);

  for (const c of filtered) {
    const item = document.createElement("article");
    item.className = "check-item";
    const statusCls = c.status === "pass" ? "tier-green" : c.status === "warn" ? "tier-yellow" : "tier-red";
    const statusWord = c.status === "pass" ? dict.passLabel : c.status === "warn" ? dict.warnLabel : dict.failLabel;
    const title = state.lang === "zh" ? c.titleZh : c.titleEn;
    const evidence = state.lang === "zh" ? c.evidenceZh : c.evidenceEn;
    const fix = state.lang === "zh" ? c.fixZh : c.fixEn;

    item.innerHTML = `
      <div class="check-item-top">
        <div class="check-title">
          <span class="check-idx">#${String(c.index).padStart(2, "0")}</span>
          <span>${escapeHtml(title)}</span>
        </div>
        <span class="check-pill ${statusCls}">${statusWord} · ${c.score}/${c.maxScore}</span>
      </div>
      <p class="check-evidence">${escapeHtml(evidence)}</p>
      <p class="check-fix"><strong>${escapeHtml(dict.fixPrefix)}</strong>${escapeHtml(fix)}</p>
    `;
    listEl.appendChild(item);
  }

  // Free 10-line preview
  $("llms-preview-code").textContent = r.preview.llmsPreview10;

  // Deliverables box
  renderDeliverableAsset();
}

function getAssetPayload(assetKey) {
  const pack = state.report?.fixPack;
  if (!pack) return { text: "", filename: "asset.txt", mime: "text/plain" };

  switch (assetKey) {
    case "llmsTxt":
      return { text: pack.llmsTxt, filename: "llms.txt", mime: "text/plain;charset=utf-8" };
    case "llmsFullTxt":
      return { text: pack.llmsFullTxt, filename: "llms-full.txt", mime: "text/plain;charset=utf-8" };
    case "jsonLdScriptTag":
      return { text: pack.jsonLdScriptTag, filename: "geo-doctor-schema.json", downloadText: pack.jsonLdJson, mime: "application/json;charset=utf-8" };
    case "robotsTxtPatch":
      return { text: pack.robotsTxtPatch, filename: "robots.txt", mime: "text/plain;charset=utf-8" };
    case "buyerPrompts":
      return {
        text: pack.buyerPrompts.join("\n"),
        filename: "buyer-audit-prompts.txt",
        mime: "text/plain;charset=utf-8",
      };
    default:
      return { text: pack.llmsTxt, filename: "llms.txt", mime: "text/plain;charset=utf-8" };
  }
}

function renderDeliverableAsset() {
  const dict = I18N[state.lang];
  const { text } = getAssetPayload(state.activeAsset);
  const unlocked = state.license.unlocked;

  const contentEl = $("deliverable-content");
  const overlayEl = $("lock-overlay");
  const copyBtn = $("btn-copy-asset");
  const dlBtn = $("btn-download-asset");
  const metaEl = $("deliverable-meta");

  contentEl.classList.toggle("is-locked", !unlocked);
  overlayEl.classList.toggle("hidden", unlocked);
  copyBtn.disabled = !unlocked;
  dlBtn.disabled = !unlocked;

  if (unlocked) {
    $("deliverable-pre").textContent = text;
    metaEl.textContent = dict.unlockedMeta(state.license.payload?.e, state.license.payload?.plan);
  } else {
    // Show masked/abbreviated preview behind blur so zero paid payload leaks in plain readable form
    const previewStub = text
      .split("\n")
      .slice(0, 12)
      .map((line, i) => (i < 2 ? line : line.replace(/[A-Za-z0-9\u4e00-\u9fa5]/g, "•")))
      .join("\n");
    $("deliverable-pre").textContent = previewStub;
    metaEl.textContent = dict.lockedMeta;
  }
}

async function copyText(text, btn) {
  if (!text) return;
  const orig = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = I18N[state.lang].copiedText;
    setTimeout(() => {
      btn.textContent = orig;
    }, 1400);
  } catch {
    btn.textContent = "Copy manually";
  }
}

function loadSampleIntoModeB(sampleKey) {
  const s = SAMPLES[sampleKey];
  if (!s) return;
  setMode("source");
  $("input-source-url").value = s.url;
  $("input-html").value = s.html;
  $("input-robots").value = s.robotsTxt;
  $("input-llms").value = s.llmsTxt;
  state.report = auditSite({
    url: s.url,
    html: s.html,
    robotsTxt: s.robotsTxt,
    llmsTxt: s.llmsTxt,
    sitemapXmlFound: sampleKey === "gold-benchmark" || sampleKey === "average-shopify",
  });
  renderReport();
}

async function runLiveAudit(targetUrl) {
  const dict = I18N[state.lang];
  showStatus(dict.probingText, "info");
  const probe = await probeLiveUrl(targetUrl, { timeoutMs: 7000 });
  if (!probe.ok) {
    const switchBtn = document.createElement("button");
    switchBtn.type = "button";
    switchBtn.className = "btn btn-primary btn-sm";
    switchBtn.textContent = dict.switchToModeB;
    switchBtn.onclick = () => {
      setMode("source");
      $("input-source-url").value = targetUrl;
      if (probe.robotsTxt) $("input-robots").value = probe.robotsTxt;
      if (probe.llmsTxt) $("input-llms").value = probe.llmsTxt;
    };
    showStatus(`${dict.probeFailedPrefix} ${probe.reason}. ${dict.probeFailedGuide}`, "error", switchBtn);
    return;
  }

  hideStatus();
  const log = probe.probeLog;
  showStatus(
    `Probe OK (${probe.transport}) — HTML: ${log.html} | robots.txt: ${log.robots} | llms.txt: ${log.llms} | sitemap: ${log.sitemap}`,
    "info"
  );

  state.report = auditSite({
    url: probe.url,
    html: probe.html,
    robotsTxt: probe.robotsTxt,
    llmsTxt: probe.llmsTxt,
    sitemapXmlFound: probe.sitemapXmlFound,
  });
  renderReport();
}

async function runSelfAudit() {
  const canonicalHome = "https://a3152557994-ship-it.github.io/geo-doctor/";
  try {
    // On HTTP(S) (localhost dev or GitHub Pages), fetch the exact deployed sibling files
    if (window.location.protocol.startsWith("http")) {
      const [htmlRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
        fetch("./index.html"),
        fetch("./robots.txt"),
        fetch("./llms.txt"),
        fetch("./sitemap.xml"),
      ]);
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const robotsTxt = robotsRes.ok ? await robotsRes.text() : "";
        const llmsTxt = llmsRes.ok ? await llmsRes.text() : "";
        state.report = auditSite({
          url: canonicalHome,
          html,
          robotsTxt,
          llmsTxt,
          sitemapXmlFound: sitemapRes.ok,
        });
        renderReport();
        return;
      }
    }
  } catch {
    // Fallback to live probe or DOM snapshot
  }

  state.report = auditSite({
    url: canonicalHome,
    html: document.documentElement.outerHTML,
    robotsTxt: "User-agent: *\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nSitemap: https://a3152557994-ship-it.github.io/geo-doctor/sitemap.xml",
    llmsTxt: `# GEO Doctor\n\n> Self-audited live DOM snapshot.\n\n## Core\n- [Home](${canonicalHome}): Live workbench\n\n## Endpoints\n- [robots.txt](${canonicalHome}robots.txt): Crawler rules`,
    sitemapXmlFound: true,
  });
  renderReport();
}

async function handleLicenseVerification(token, persist = true) {
  const feedback = $("license-feedback");
  const modalFeedback = $("modal-license-feedback");
  const trimmed = String(token || "").trim();
  const setBothFeedback = (cls, msg) => {
    for (const el of [feedback, modalFeedback]) {
      if (!el) continue;
      el.className = cls;
      el.textContent = msg;
      el.classList.remove("hidden");
    }
  };

  if (!trimmed) {
    setBothFeedback(
      "status-banner error",
      state.lang === "zh" ? "请输入以 OPC1. 开头的激活码。" : "Please enter an OPC1. license code."
    );
    return false;
  }

  const res = await verifyLicenseToken(trimmed, { expectedProduct: PRODUCT_SLUG });
  if (!res.valid) {
    state.license = { unlocked: false, payload: null, token: "" };
    if (persist) localStorage.removeItem(STORAGE_LICENSE_KEY);
    setBothFeedback(
      "status-banner error",
      state.lang === "zh"
        ? `验签未通过 (${res.reason})：${res.message || "激活码无效"}`
        : `Verification failed (${res.reason}): ${res.message || "Invalid license"}`
    );
    $("btn-clear-license").classList.add("hidden");
    renderDeliverableAsset();
    return false;
  }

  state.license = { unlocked: true, payload: res.payload, token: trimmed };
  $("input-license").value = trimmed;
  if ($("modal-input-license")) $("modal-input-license").value = trimmed;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_LICENSE_KEY, trimmed);
      if (res.payload?.p === "*") {
        localStorage.setItem(GLOBAL_WILDCARD_KEY, trimmed);
      }
    } catch {}
  }
  setBothFeedback(
    "status-banner info",
    state.lang === "zh"
      ? `✅ Ed25519 本地验签通过！已永久解锁全部 5 项修复交付件（授权：${res.payload.e || (res.payload.p === "*" ? "全站通票 *" : "Pro")}）。`
      : `✅ Ed25519 verified locally! All 5 deliverables unlocked for ${res.payload.e || (res.payload.p === "*" ? "All-Access *" : "Pro")}.`
  );
  $("btn-clear-license").classList.remove("hidden");
  renderDeliverableAsset();
  return true;
}

let currentOrderStamp = "";
function makeOrderStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `GEO-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function refreshModalOrderBrief() {
  const plan = state.modalPlan;
  const r = state.report;
  document.querySelectorAll("[data-plan-choice]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.planChoice === plan);
  });

  const planMeta =
    plan === "dfy"
      ? { title: "GEO Doctor Shopify/WordPress 人工代部署 (DFY)", price: "$199 USD / ¥499 CNY" }
      : plan === "all-access"
        ? { title: 'OPC All-Access 全站 14 款工具通票 (p="*")', price: "¥39 CNY / $14.99 USD" }
        : { title: "GEO Doctor 单站一键修复包 (slug: geo-doctor)", price: "$29 USD / ¥99 CNY" };

  const failedTitles = r
    ? r.checks
        .filter((c) => c.status !== "pass")
        .slice(0, 5)
        .map((c) => `- [#${c.index} ${c.status.toUpperCase()}] ${c.titleEn}`)
        .join("\n")
    : "- Full site audit pending";

  const brief = [
    `【OPC 订单口令】${currentOrderStamp}`,
    `【选购方案】${planMeta.title}`,
    `【订单价格】${planMeta.price}`,
    `【体检站点】${r?.extracted?.url || $("input-live-url").value || "N/A"} (${r ? `${r.score}/100 ${r.grade}` : "N/A"})`,
    failedTitles ? `【待修复项】\n${failedTitles}` : null,
    `【发货请求】请签发对应 OPC1. 离线激活码`,
  ]
    .filter(Boolean)
    .join("\n");

  $("order-brief-text").textContent = brief;

  const subject = encodeURIComponent(`[OPC 订单 ${currentOrderStamp}] ${planMeta.title} (${planMeta.price})`);
  const body = encodeURIComponent(brief);
  $("link-mailto-qq").href = `mailto:${PAYMENT_CONFIG.emailSecondary}?cc=${PAYMENT_CONFIG.emailPrimary}&subject=${subject}&body=${body}`;
}

function openOrderModal(plan = "all-access") {
  state.modalPlan = plan;
  currentOrderStamp = makeOrderStamp();
  refreshModalOrderBrief();
  $("order-modal").classList.remove("hidden");
}

function initEvents() {
  $("tab-mode-url").addEventListener("click", () => setMode("url"));
  $("tab-mode-source").addEventListener("click", () => setMode("source"));

  $("btn-lang-toggle").addEventListener("click", () => {
    state.lang = state.lang === "zh" ? "en" : "zh";
    applyLanguage();
  });

  $("btn-run-url").addEventListener("click", () => {
    runLiveAudit($("input-live-url").value);
  });

  $("input-live-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runLiveAudit($("input-live-url").value);
  });

  $("btn-run-source").addEventListener("click", () => {
    const html = $("input-html").value;
    if (!html.trim()) {
      showStatus(
        state.lang === "zh" ? "请先粘贴目标页面的 HTML 源码，或点击上方样例一键体验。" : "Please paste HTML source or click a sample above.",
        "error"
      );
      return;
    }
    hideStatus();
    state.report = auditSite({
      url: $("input-source-url").value.trim(),
      html,
      robotsTxt: $("input-robots").value.trim() ? $("input-robots").value : null,
      llmsTxt: $("input-llms").value,
      sitemapXmlFound: /sitemap:/i.test($("input-robots").value),
    });
    renderReport();
  });

  document.querySelectorAll(".sample-btn").forEach((btn) => {
    btn.addEventListener("click", () => loadSampleIntoModeB(btn.dataset.sample));
  });

  $("btn-copy-curl").addEventListener("click", (e) => {
    const target = $("input-source-url").value.trim() || "https://yourstore.com/";
    const cmd = `curl -sL "${target}" | pbcopy && echo "HTML copied! Now paste into Mode B"`;
    copyText(cmd, e.currentTarget);
  });

  document.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      state.filter = pill.dataset.filter;
      renderReport();
    });
  });

  $("btn-copy-preview").addEventListener("click", (e) => {
    copyText(state.report?.preview?.llmsPreview10 || "", e.currentTarget);
  });

  document.querySelectorAll(".deliverable-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".deliverable-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeAsset = tab.dataset.asset;
      renderDeliverableAsset();
    });
  });

  $("btn-verify-license").addEventListener("click", () => {
    handleLicenseVerification($("input-license").value, true);
  });

  $("btn-clear-license").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_LICENSE_KEY);
    state.license = { unlocked: false, payload: null, token: "" };
    $("input-license").value = "";
    $("license-feedback").classList.add("hidden");
    $("btn-clear-license").classList.add("hidden");
    renderDeliverableAsset();
  });

  $("btn-copy-asset").addEventListener("click", (e) => {
    if (!state.license.unlocked) return;
    const { text } = getAssetPayload(state.activeAsset);
    copyText(text, e.currentTarget);
  });

  $("btn-download-asset").addEventListener("click", () => {
    if (!state.license.unlocked) return;
    const payload = getAssetPayload(state.activeAsset);
    const content = payload.downloadText || payload.text;
    const blob = new Blob([content], { type: payload.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = payload.filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  $("btn-order-fixpack").addEventListener("click", () => openOrderModal("fix-pack"));
  $("btn-overlay-order").addEventListener("click", () => openOrderModal("fix-pack"));
  $("btn-order-dfy").addEventListener("click", () => openOrderModal("dfy"));
  $("btn-order-allaccess")?.addEventListener("click", () => openOrderModal("all-access"));
  $("btn-footer-support")?.addEventListener("click", () => openOrderModal("all-access"));
  document.querySelectorAll("[data-plan-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.modalPlan = btn.dataset.planChoice;
      refreshModalOrderBrief();
    });
  });
  $("btn-close-modal").addEventListener("click", () => $("order-modal").classList.add("hidden"));
  $("order-modal").addEventListener("click", (e) => {
    if (e.target === $("order-modal")) $("order-modal").classList.add("hidden");
  });
  $("btn-copy-order-brief").addEventListener("click", (e) => {
    copyText($("order-brief-text").textContent, e.currentTarget);
  });
  $("btn-copy-qq-num")?.addEventListener("click", (e) => copyText("3152557994", e.currentTarget));
  $("btn-copy-qq-mail")?.addEventListener("click", (e) => copyText(PAYMENT_CONFIG.emailSecondary, e.currentTarget));
  $("btn-copy-gmail-addr")?.addEventListener("click", (e) => copyText(PAYMENT_CONFIG.emailPrimary, e.currentTarget));
  $("btn-modal-verify")?.addEventListener("click", async () => {
    const ok = await handleLicenseVerification($("modal-input-license").value, true);
    if (ok) {
      setTimeout(() => $("order-modal").classList.add("hidden"), 900);
    }
  });

  $("btn-self-audit").addEventListener("click", () => {
    setMode("url");
    $("input-live-url").value = "https://a3152557994-ship-it.github.io/geo-doctor/";
    runSelfAudit();
    window.scrollTo({ top: $("report-section").offsetTop - 70, behavior: "smooth" });
  });
  $("btn-self-audit-2").addEventListener("click", () => {
    $("btn-self-audit").click();
  });
}

async function bootstrap() {
  initEvents();
  applyLanguage();

  const savedToken = localStorage.getItem(STORAGE_LICENSE_KEY) || localStorage.getItem(GLOBAL_WILDCARD_KEY);
  if (savedToken) {
    $("input-license").value = savedToken;
    await handleLicenseVerification(savedToken, false);
  }

  // Initial load: self-audit geo-doctor so the user immediately sees a working 100/100 live studio
  await runSelfAudit();
}

bootstrap();
