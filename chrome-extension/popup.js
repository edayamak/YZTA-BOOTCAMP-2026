const analyzeBtn = document.getElementById("analyzeBtn");
const statusEl = document.getElementById("status");
const resultSection = document.getElementById("resultSection");
const adminBtn = document.getElementById("adminBtn");
const sitePlatformBlock = document.getElementById("sitePlatformBlock");
const metricPageType = document.getElementById("metricPageType");
const metricRisk = document.getElementById("metricRisk");
const dataPackBlock = document.getElementById("dataPackBlock");
const metricCaptureId = document.getElementById("metricCaptureId");
const progressWrap = document.getElementById("progressWrap");
const progressLabel = document.getElementById("progressLabel");
const progressFill = document.getElementById("progressFill");

let lastAdminUrl = null;
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
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPlatformLabel(platform) {
  if (!platform || platform === "unknown") return "Bilinmiyor";
  return platform;
}

function formatPageType(type) {
  const labels = {
    cart: "Sepet",
    checkout: "Checkout",
    product: "Ürün",
    listing: "Liste",
    home: "Ana sayfa",
    unknown: "Bilinmiyor"
  };
  return labels[type] || type || "Bilinmiyor";
}

function formatRiskBrief(payload) {
  const lanes = payload.analysis_lanes;
  if (!lanes) return "-";
  const tone =
    lanes.overall_risk_level === "low"
      ? "Düşük"
      : lanes.overall_risk_level === "medium"
        ? "Orta"
        : "Yüksek";
  return `%${lanes.overall_risk_score} · ${tone}`;
}

function formatSitePlatformBlock(hostname, platform) {
  return `Site      ${hostname || "-"}\nPlatform  ${formatPlatformLabel(platform)}`;
}

function buildDataPack(payload) {
  const htmlLen = payload.dom?.html?.length || payload.dom?.html_length || 0;
  const htmlReady = !!payload.dom?.html;
  const cssLen = payload.css ? JSON.stringify(payload.css).length : 0;
  const metricsLen = JSON.stringify({
    page: payload.page,
    cart: payload.cart,
    ux: payload.ux,
    contrast: payload.contrast,
    ecommerce: payload.ecommerce,
    ml_features: payload.ml_features,
    analysis_lanes: payload.analysis_lanes,
    agent_simulation: payload.agent_simulation,
    capture_id: payload.capture_id
  }).length;

  const rows = [
    {
      label: "HTML",
      bytes: htmlLen,
      approximate: !htmlReady && htmlLen > 0,
      pending: !htmlLen
    },
    { label: "CSS", bytes: cssLen, pending: !cssLen },
    { label: "JSON", bytes: metricsLen, pending: !metricsLen }
  ];

  const readyBytes = rows.reduce((sum, row) => sum + (row.pending ? 0 : row.bytes), 0);
  const allReady = !rows.some((row) => row.pending);

  return { rows, totalBytes: readyBytes, allReady };
}

function formatDataPackBlock(payload) {
  const pack = buildDataPack(payload);
  const lines = pack.rows.map((row) => {
    const size = row.pending ? "…" : `${row.approximate ? "~" : ""}${formatBytes(row.bytes)}`;
    return `${row.label.padEnd(8)} ${size}`;
  });

  if (pack.allReady) {
    lines.push(`${"Toplam".padEnd(8)} ${formatBytes(pack.totalBytes)}`);
  }

  return lines.join("\n");
}

function renderDataPack(payload) {
  dataPackBlock.textContent = formatDataPackBlock(payload);
}

function openAdminConsole(url) {
  if (!url) return;
  chrome.tabs.create({ url });
}

function renderResult(payload, job) {
  const f = payload.ml_features || {};
  sitePlatformBlock.textContent = formatSitePlatformBlock(
    payload.page?.hostname,
    payload.page?.primary_platform || f.platform || payload.page?.platform_hints?.[0]
  );
  metricPageType.textContent = formatPageType(payload.cart?.page_type);
  metricRisk.textContent = formatRiskBrief(payload);
  renderDataPack(payload);
  metricCaptureId.textContent = payload.capture_id || job?.captureId || "-";

  lastAdminUrl =
    payload.admin_console_url ||
    job?.adminConsoleUrl ||
    (payload.capture_id
      ? window.AgenticQAConfig.buildAdminConsoleUrl(payload.capture_id)
      : null);

  adminBtn.disabled = !lastAdminUrl;
  resultSection.classList.remove("hidden");
}

async function mergeHeavyAssets(payload) {
  if (payload.dom?.html) return payload;

  const session = await chrome.storage.session.get(["lastCaptureHeavy"]);
  const heavy = session.lastCaptureHeavy;
  if (!heavy?.dom) return payload;

  return { ...payload, dom: heavy.dom, css: heavy.css || payload.css, capture_mode: "full" };
}

async function applyState() {
  const data = await chrome.storage.local.get(["captureJob", "lastCapture"]);
  const job = data.captureJob;

  if (data.lastCapture) {
    const payload = await mergeHeavyAssets(data.lastCapture);
    renderResult(payload, job);
  }

  if (!job) {
    setProgress(false);
    return;
  }

  if (job.status === "running") {
    analyzeBtn.disabled = true;
    resultSection.classList.add("hidden");
    if (job.phase === "fast") {
      setProgress(true, "Sayfa metrikleri alınıyor…", 25);
      setStatus("Site taranıyor — popup kapatabilirsin.", "busy");
    } else if (job.phase === "agents") {
      setProgress(true, "Persona simülasyonu…", 50);
      setStatus("Davranış senaryoları kaydediliyor.", "busy");
    } else {
      setProgress(true, "DOM ve CSS paketleniyor…", 80);
      setStatus("Tam veri paketi hazırlanıyor.", "busy");
    }
    return;
  }

  analyzeBtn.disabled = false;
  setProgress(false);

  if (job.status === "done") {
    setStatus("Tamam.", "ok");
    if (data.lastCapture) {
      const payload = await mergeHeavyAssets(data.lastCapture);
      renderResult(payload, job);
    }
    stopPolling();
  } else if (job.status === "error") {
    setStatus(job.error || "Tarama hatası.", "err");
    stopPolling();
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(applyState, 600);
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
  resultSection.classList.add("hidden");
  setStatus("Başlatılıyor…", "busy");
  setProgress(true, "Başlatılıyor…", 8);

  try {
    const tab = await getActiveTab();
    if (isBlockedUrl(tab.url)) {
      throw new Error("Bu sayfada çalışmaz.");
    }

    startPolling();

    chrome.runtime.sendMessage(
      { type: "KONSEY_START_ANALYSIS", tabId: tab.id, url: tab.url },
      (res) => {
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message, "err");
          analyzeBtn.disabled = false;
          stopPolling();
          return;
        }
        if (!res?.started) {
          setStatus("Tarama başlatılamadı.", "err");
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

adminBtn.addEventListener("click", () => {
  openAdminConsole(lastAdminUrl);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.captureJob || changes.lastCapture)) {
    applyState();
  }
});

applyState().then(() => {
  chrome.storage.local.get(["captureJob"], (r) => {
    if (r.captureJob?.status === "running") startPolling();
  });
});
