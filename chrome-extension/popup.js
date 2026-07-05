const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const previewText = document.getElementById("previewText");
const summaryEl = document.getElementById("summary");
const downloadSection = document.getElementById("downloadSection");
const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
const downloadCssBtn = document.getElementById("downloadCssBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const htmlSizeEl = document.getElementById("htmlSize");
const cssSizeEl = document.getElementById("cssSize");
const metricPlatform = document.getElementById("metricPlatform");
const metricCart = document.getElementById("metricCart");
const metricContrast = document.getElementById("metricContrast");
const metricProducts = document.getElementById("metricProducts");
const progressWrap = document.getElementById("progressWrap");
const progressLabel = document.getElementById("progressLabel");
const progressFill = document.getElementById("progressFill");

let lastPayload = null;
let pollTimer = null;

function setProgress(visible, label, percent) {
  progressWrap.classList.toggle("hidden", !visible);
  if (label) progressLabel.textContent = label;
  progressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = `status${type ? ` ${type}` : ""}`;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function slugify(value) {
  return String(value || "snapshot")
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function buildPreview(payload) {
  return JSON.stringify(
    {
      capture_mode: payload.capture_mode,
      url: payload.page.url,
      title: payload.page.title,
      platform: payload.page.platform_hints,
      ml_features: payload.ml_features,
      cart: {
        cart_item_count: payload.cart.cart_item_count,
        cart_total: payload.cart.cart_total,
        line_items: payload.cart.line_items?.slice(0, 3) || []
      },
      ecommerce: {
        product_count: payload.ecommerce?.product_listings?.length || 0
      },
      dom: {
        deferred: payload.dom?.deferred || false,
        html_length: payload.dom?.html_length || 0
      }
    },
    null,
    2
  );
}

function buildHtmlExport(payload) {
  const header = `<!-- Konsey AI | ${payload.page.url} | ${payload.captured_at} -->\n`;
  return header + (payload.dom?.html || "<!-- DOM henuz hazir degil -->");
}

function buildCssExport(payload) {
  const css = payload.css || {};
  const lines = [`/* Konsey AI | ${payload.page.url} | ${payload.captured_at} */`, ""];

  (css.inline_styles || []).forEach((block, i) => {
    lines.push(`/* inline #${i + 1} */`, block.content || "", "");
  });

  (css.stylesheets || []).forEach((sheet, i) => {
    lines.push(`/* sheet #${i + 1}: ${sheet.href || "inline"} */`);
    (sheet.rules || []).forEach((rule) => {
      if (typeof rule === "string") lines.push(rule);
      else if (rule?.note) lines.push(`/* ${rule.note} */`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

function buildJsonExport(payload) {
  const out = { ...payload };
  delete out.dom;
  out.dom_meta = {
    html_length: payload.dom?.html_length || 0,
    deferred: payload.dom?.deferred || false
  };
  return JSON.stringify(out, null, 2);
}

function downloadFile(filename, content, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderSummary(payload) {
  const f = payload.ml_features || {};
  metricPlatform.textContent =
    payload.page.primary_platform || f.platform || payload.page.platform_hints?.[0] || "-";

  const n = payload.cart?.cart_item_count;
  const t = payload.cart?.cart_total?.amount;
  const firstItem = payload.cart?.line_items?.[0]?.name;
  const qty = payload.cart?.line_items?.[0]?.quantity;
  const qtyLabel = qty && qty > 1 ? ` x${qty}` : "";
  metricCart.textContent =
    n != null
      ? `${n} ürün${t ? ` · ${t}` : ""}${firstItem ? ` (${(firstItem.length > 26 ? `${firstItem.slice(0, 26)}…` : firstItem)}${qtyLabel})` : ""}`
      : "Boş";

  const c = { good: "İyi", medium: "Orta", low: "Düşük" };
  metricContrast.textContent = c[payload.contrast?.contrast_quality] || "-";
  metricProducts.textContent = String(payload.ecommerce?.product_listings?.length || 0);

  summaryEl.classList.remove("hidden");
}

function updateDownloads(payload) {
  const hasHtml = !!payload.dom?.html;
  htmlSizeEl.textContent = hasHtml
    ? formatBytes(payload.dom.html.length)
    : payload.dom?.html_length
      ? `~${formatBytes(payload.dom.html_length)}`
      : "-";
  cssSizeEl.textContent = payload.css ? formatBytes(JSON.stringify(payload.css).length) : "-";

  downloadHtmlBtn.disabled = !hasHtml;
  downloadCssBtn.disabled = !payload.css;
  downloadJsonBtn.disabled = false;
  downloadSection.classList.remove("hidden");
}

async function mergeHeavyAssets(payload) {
  if (payload.dom?.html) return payload;

  const session = await chrome.storage.session.get(["lastCaptureHeavy"]);
  const heavy = session.lastCaptureHeavy;
  if (!heavy?.dom) return payload;

  return { ...payload, dom: heavy.dom, css: heavy.css || payload.css, capture_mode: "full" };
}

async function applyPayload(payload) {
  lastPayload = await mergeHeavyAssets(payload);
  previewText.textContent = buildPreview(lastPayload);
  renderSummary(lastPayload);
  updateDownloads(lastPayload);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refreshFromStorage, 600);
}

async function refreshFromStorage() {
  const data = await chrome.storage.local.get(["captureJob", "lastCapture"]);
  const job = data.captureJob;

  if (data.lastCapture) {
    await applyPayload(data.lastCapture);
  }

  if (!job) {
    setProgress(false);
    return;
  }

  if (job.status === "running") {
    analyzeBtn.disabled = true;
    setProgress(true);
    if (job.phase === "fast") {
      setProgress(true, "Hızlı analiz… sepet, UX, fiyat", 35);
      setStatus("Analiz çalışıyor - popup kapatabilirsin.", "busy");
    } else {
      setProgress(true, "DOM/CSS hazırlanıyor…", 75);
      setStatus("Arka planda DOM/CSS toplanıyor.", "busy");
    }
    return;
  }

  analyzeBtn.disabled = false;
  setProgress(false);

  if (job.status === "done") {
    setProgress(true, "Tamamlandı", 100);
    setStatus("Tamamlandı. İndirebilirsin.", "ok");
    setTimeout(() => setProgress(false), 1200);
    stopPolling();
  } else if (job.status === "error") {
    setStatus(job.error || "Hata oluştu.", "err");
    stopPolling();
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Aktif sekme bulunamadı.");
  return tab;
}

function isBlockedUrl(url) {
  return (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:")
  );
}

analyzeBtn.addEventListener("click", async () => {
  analyzeBtn.disabled = true;
  setStatus("Başlatılıyor…", "busy");
  setProgress(true, "Başlatılıyor…", 8);

  try {
    const tab = await getActiveTab();
    if (isBlockedUrl(tab.url)) {
      throw new Error("Bu sayfada çalışmaz.");
    }

    startPolling();

    chrome.runtime.sendMessage(
      {
        type: "KONSEY_START_ANALYSIS",
        tabId: tab.id,
        url: tab.url
      },
      (res) => {
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message, "err");
          analyzeBtn.disabled = false;
          stopPolling();
          return;
        }

        if (!res?.started) {
          setStatus("Analiz başlatılamadı.", "err");
          analyzeBtn.disabled = false;
          stopPolling();
        }
      }
    );
  } catch (e) {
    setStatus(e instanceof Error ? e.message : "Hata", "err");
    analyzeBtn.disabled = false;
    stopPolling();
  }
});

downloadHtmlBtn.addEventListener("click", async () => {
  if (!lastPayload) return;
  const payload = await mergeHeavyAssets(lastPayload);
  if (!payload.dom?.html) {
    setStatus("DOM henüz hazır değil, birkaç saniye bekle.", "busy");
    return;
  }
  const s = payload.captured_at.replace(/[:.]/g, "-");
  downloadFile(
    `konsey-dom-${slugify(payload.page.hostname)}-${s}.html`,
    buildHtmlExport(payload),
    "text/html"
  );
});

downloadCssBtn.addEventListener("click", async () => {
  if (!lastPayload) return;
  const payload = await mergeHeavyAssets(lastPayload);
  const s = payload.captured_at.replace(/[:.]/g, "-");
  downloadFile(
    `konsey-css-${slugify(payload.page.hostname)}-${s}.css`,
    buildCssExport(payload),
    "text/css"
  );
});

downloadJsonBtn.addEventListener("click", async () => {
  if (!lastPayload) return;
  const payload = await mergeHeavyAssets(lastPayload);
  const s = payload.captured_at.replace(/[:.]/g, "-");
  downloadFile(
    `konsey-analiz-${slugify(payload.page.hostname)}-${s}.json`,
    buildJsonExport(payload),
    "text/json"
  );
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.captureJob || changes.lastCapture)) {
    refreshFromStorage();
  }
});

refreshFromStorage().then(() => {
  chrome.storage.local.get(["captureJob"], (r) => {
    if (r.captureJob?.status === "running") startPolling();
  });
});
