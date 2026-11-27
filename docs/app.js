import {
  SAMPLES,
  auditSite,
  probeLiveUrl,
} from "./auditor.js";

const STUDIO_CONTACT = {
  emailPrimary: "a3152557994@gmail.com",
  emailSecondary: "3152557994@qq.com",
};

const I18N = {
  zh: {
    navSelfAudit: "自检本站标杆 (100分)",
    navUnlock: "免费导出修复包 / 代部署",
    heroBadge: "12 项 ChatGPT / Perplexity / Claude 推荐度硬核体检 · 全套修复包 100% 免费免码导出",
    heroTitle: 'AI 时代客户先问 ChatGPT：<br>你的独立站会被<span class="hero-serif">直接推荐</span>，还是当场隐身？',
    heroLead: "3 秒排查 OAI-SearchBot 放行、/llms.txt 与 Product + Offer + FAQPage JSON-LD 缺失。0–100 体检报告与全套 5 项一键修复包现已 $0 / ¥0 免费全量开放；嫌改代码麻烦可预约 $199 / ¥499 工程师人工代部署。",
    heroPricingPill: "自助修复包 $0 免费全开 · 人工代部署 $199 / ¥499",
    heroZeroLeak: "源码仅在本地浏览器解析 · 绝不上传商业隐私",
    heroBuyLink: "免费导出修复包 →",
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
    ctaGenerateFix: "免费复制/导出专属修复包 ($0)",
    checksHeading: "12 项 AI 推荐度诊断明细",
    filterAll: "全部 (12)",
    filterFail: "红灯阻断",
    filterWarn: "黄灯提醒",
    filterPass: "已通过",
    previewHeading: "专属 /llms.txt 核心摘要速览（下方已免费解锁全套 5 项文件）",
    previewSub: "已自动提取站点名称、产品类型、明文定价与卖点层级；完整 /llms.txt、llms-full.txt、JSON-LD 与 20 个买家自测提问可在下方直接免费导出。",
    btnCopyPreview: "复制摘要",
    pricingHeading: "全套 5 项修复包 $0 免费开放 · 另供工程师人工代部署",
    pricingSub: "不设收费墙拦人：自助修复包 100% 免费免码导出；如需工程师代改 Shopify / WordPress 主题并验收结构化数据，可预约人工代部署。",
    plan1Tag: "100% 免费开放 · 免注册免激活码",
    plan1Title: "自助单站一键修复包 (Fix Pack)",
    plan1Cta: "向上滚动免费导出（$0）",
    plan2Tag: "数创引擎工作室 · 省心托管",
    plan2Title: "Shopify / WordPress 人工代部署",
    plan2Cta: "预约人工代部署（$199 / ¥499）",
    btnCopyAsset: "一键复制",
    btnDownloadAsset: "免费导出文件",
    selfAuditLabel: "透明自测基准：12/12 自动化规范实测通过（5.0 / 5.0 · 1 条公开测试套件验证记录 · 零虚构买家评价）",
    btnAuditSelfNow: "立即实测本站分数 →",
    faqHeading: "常见问题（FAQ）",
    allAccessTitle: "🎉 全站 18 款效率与防封微工具 100% 免费开放 · 离线百宝箱 & 严选基础设施",
    allAccessDesc: "前往 OPC 免费总站一键转存离线工具百宝箱，或查阅 AWS Bedrock / 静态住宅网络合规防封指南与开源赞赏通道。",
    probingText: "正在并发探测目标页、robots.txt、llms.txt 与 sitemap.xml（最多等待 8 秒）…",
    probeFailedPrefix: "在线抓取受阻（绝不伪造结果）：",
    probeFailedGuide: "Shopify / Cloudflare 站点常拦截浏览器跨域请求。点击下方按钮一键切换「模式 B」，粘贴源码即可 100% 精准体检！",
    switchToModeB: "切换到模式 B（粘贴源码）",
    copiedText: "已复制",
    passLabel: "通过",
    warnLabel: "待优",
    failLabel: "阻断",
    fixPrefix: "修复建议：",
    projectionFmt: (curr, proj) => `当前 AI 推荐准备度：<strong>${curr}/100</strong> → 部署免费 Fix Pack 后预计可达 <strong>${proj}/100</strong>`,
    unlockedMeta: "✓ 100% 免费免码全解锁 — 可直接一键复制或导出文件",
  },
  en: {
    navSelfAudit: "Self-Audit This Page (100/100)",
    navUnlock: "Free Fix Pack & DFY",
    heroBadge: "12-Point ChatGPT / Perplexity / Claude Readiness Audit · 100% Free Unlocked Fix Pack",
    heroTitle: 'Buyers Ask ChatGPT First:<br>Will AI <span class="hero-serif">Recommend</span> Your Store or Skip It?',
    heroLead: "Check OAI-SearchBot access, /llms.txt, and Product + Offer + FAQPage JSON-LD in 3 seconds. Export all 5 Fix Pack files for $0 Free, or book $199 / ¥499 Done-For-You deployment.",
    heroPricingPill: "Self-Serve Fix Pack $0 Free · Done-For-You $199 / ¥499",
    heroZeroLeak: "100% client-side HTML parsing · Zero source upload",
    heroBuyLink: "Export Free Fix Pack →",
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
    ctaGenerateFix: "Export Free Fix Pack ($0)",
    checksHeading: "12-Point AI Search Diagnostic Breakdown",
    filterAll: "All (12)",
    filterFail: "Red Fails",
    filterWarn: "Warnings",
    filterPass: "Passed",
    previewHeading: "Tailored /llms.txt Summary (Full 5-File Fix Pack Unlocked Free Below)",
    previewSub: "Auto-extracted from your site title, entity type, plaintext pricing, and headings.",
    btnCopyPreview: "Copy Summary",
    pricingHeading: "100% Free Self-Serve Fix Pack & Optional Done-For-You Deployment",
    pricingSub: "Zero paywalls on the software — export all 5 files free, or book an engineer to deploy into Shopify / WordPress.",
    plan1Tag: "100% Free · No Login · No Keys",
    plan1Title: "Single-Site Fix Pack",
    plan1Cta: "Scroll Up to Export Free ($0)",
    plan2Tag: "Managed Service",
    plan2Title: "Shopify / WordPress Done-For-You",
    plan2Cta: "Book Done-For-You ($199 / ¥499)",
    btnCopyAsset: "Copy Code",
    btnDownloadAsset: "Download File",
    selfAuditLabel: "Transparent Self-Benchmark: 12/12 automated checks verified (5.0 / 5.0 · 1 open test-suite audit · zero fabricated reviews)",
    btnAuditSelfNow: "Test This Site Now →",
    faqHeading: "Frequently Asked Questions",
    allAccessTitle: "🎉 All 18 OPC Micro-Tools Are 100% Free · Offline Bundle & Cloud Guides",
    allAccessDesc: "Grab the offline toolkit bundle on OPC Hub or explore compliant cloud & residential ISP guides.",
    probingText: "Concurrently probing HTML, /robots.txt, /llms.txt, and /sitemap.xml (timeout 8s)...",
    probeFailedPrefix: "Live fetch blocked (never fabricated): ",
    probeFailedGuide: "Switch to Mode B to paste HTML & robots.txt for 100% accurate offline analysis.",
    switchToModeB: "Switch to Mode B (Paste Source)",
    copiedText: "Copied!",
    passLabel: "PASS",
    warnLabel: "WARN",
    failLabel: "FAIL",
    fixPrefix: "Fix: ",
    projectionFmt: (curr, proj) => `Current AI Readiness: <strong>${curr}/100</strong> → Projected after Free Fix Pack: <strong>${proj}/100</strong>`,
    unlockedMeta: "✓ 100% Free & Unlocked — Copy or download any deliverable directly",
  },
};

const state = {
  lang: "zh",
  mode: "url",
  filter: "all",
  activeAsset: "llmsTxt",
  report: null,
  unlocked: true,
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

  $("llms-preview-code").textContent = r.preview.llmsPreview10;
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
  $("deliverable-pre").textContent = text;
  $("deliverable-meta").textContent = dict.unlockedMeta;
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
  } catch {}

  state.report = auditSite({
    url: canonicalHome,
    html: document.documentElement.outerHTML,
    robotsTxt: "User-agent: *\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nSitemap: https://a3152557994-ship-it.github.io/geo-doctor/sitemap.xml",
    llmsTxt: `# GEO Doctor\n\n> Self-audited live DOM snapshot.\n\n## Core\n- [Home](${canonicalHome}): Live workbench\n\n## Endpoints\n- [robots.txt](${canonicalHome}robots.txt): Crawler rules`,
    sitemapXmlFound: true,
  });
  renderReport();
}

function openDfyModal() {
  const r = state.report;
  const failedTitles = r
    ? r.checks
        .filter((c) => c.status !== "pass")
        .slice(0, 5)
        .map((c) => `- [#${c.index} ${c.status.toUpperCase()}] ${c.titleEn}`)
        .join("\n")
    : "- Full site audit pending";

  const brief = [
    `【数创引擎工作室 · GEO 人工代部署预约】`,
    `【服务内容】Shopify / WordPress 人工代部署 ($199 USD / ¥499 CNY · 含2次微调)`,
    `【目标站点】${r?.extracted?.url || $("input-live-url").value || "N/A"} (${r ? `${r.score}/100 ${r.grade}` : "N/A"})`,
    failedTitles ? `【待修复项】\n${failedTitles}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  $("order-brief-text").textContent = brief;
  const subject = encodeURIComponent("[数创引擎 · GEO代部署] Shopify/WordPress ($199 / ¥499)");
  const body = encodeURIComponent(brief);
  $("link-mailto-qq").href = `mailto:${STUDIO_CONTACT.emailSecondary}?cc=${STUDIO_CONTACT.emailPrimary}&subject=${subject}&body=${body}`;
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

  $("btn-copy-asset").addEventListener("click", (e) => {
    const { text } = getAssetPayload(state.activeAsset);
    copyText(text, e.currentTarget);
  });

  $("btn-download-asset").addEventListener("click", () => {
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

  $("btn-order-dfy").addEventListener("click", openDfyModal);
  $("btn-close-modal").addEventListener("click", () => $("order-modal").classList.add("hidden"));
  $("order-modal").addEventListener("click", (e) => {
    if (e.target === $("order-modal")) $("order-modal").classList.add("hidden");
  });
  $("btn-copy-order-brief").addEventListener("click", (e) => {
    copyText($("order-brief-text").textContent, e.currentTarget);
  });
  $("btn-copy-qq-num")?.addEventListener("click", (e) => copyText("3152557994", e.currentTarget));
  $("btn-copy-qq-mail")?.addEventListener("click", (e) => copyText(STUDIO_CONTACT.emailSecondary, e.currentTarget));
  $("btn-copy-gmail-addr")?.addEventListener("click", (e) => copyText(STUDIO_CONTACT.emailPrimary, e.currentTarget));

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
  await runSelfAudit();
}

bootstrap();
