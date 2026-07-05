importScripts("lib/config.js");

const Config = globalThis.AgenticQAConfig;
const SCRIPT_VERSION = "1.8.3";

const CONTENT_SCRIPT_FILES = [
  "lib/piiSanitizer.js",
  "lib/shared.js",
  "lib/shadowDom.js",
  "lib/pageContext.js",
  "lib/ecommerceSignals.js",
  "lib/uxMetrics.js",
  "lib/contrastAnalyzer.js",
  "lib/featureBuilder.js",
  "lib/personaSimulator.js",
  "lib/visibleDataCapture.js",
  "lib/cartExtractor.js",
  "lib/cssCapture.js",
  "lib/domCapture.js",
  "content.js"
];

async function ensureScripts(tabId) {
  try {
    const ping = await chrome.tabs.sendMessage(tabId, { type: "KONSEY_PING" });
    if (ping?.ok && ping.version === SCRIPT_VERSION) return;
  } catch {
    /* inject */
  }

  for (const file of CONTENT_SCRIPT_FILES) {
    await chrome.scripting.executeScript({ target: { tabId }, files: [file] });
  }
}

async function setJob(patch) {
  const current = (await chrome.storage.local.get(["captureJob"])).captureJob || {};
  const next = { ...current, ...patch, updatedAt: Date.now() };
  await chrome.storage.local.set({ captureJob: next });
  updateBadge(next);
  return next;
}

let badgeTimer = null;

function clearBadgeTimer() {
  if (badgeTimer) {
    clearInterval(badgeTimer);
    badgeTimer = null;
  }
}

function updateBadge(job) {
  if (!job || job.status === "running") {
    setBadgeRunning(job?.phase || "fast");
    return;
  }

  if (job.status === "done") {
    setBadgeDone();
    return;
  }

  if (job.status === "error") {
    setBadgeError();
  }
}

function setBadgeRunning(phase) {
  clearBadgeTimer();
  chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });

  const label =
    phase === "heavy"
      ? "AgenticQA - Veri paketleniyor…"
      : phase === "agents"
        ? "AgenticQA - Senaryolar kaydediliyor…"
        : "AgenticQA - Site taranıyor…";
  chrome.action.setTitle({ title: label });

  const frames =
    phase === "heavy" ? ["…", "··", "·"] : phase === "agents" ? ["A", "A·", "A··"] : ["•", "••", "•••"];
  let index = 0;

  const tick = () => {
    chrome.action.setBadgeText({ text: frames[index % frames.length] });
    index += 1;
  };

  tick();
  badgeTimer = setInterval(tick, 450);
}

function setBadgeDone() {
  clearBadgeTimer();
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#16a34a" });
  chrome.action.setTitle({ title: "AgenticQA - Tarama tamamlandı" });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: "AgenticQA" });
  }, 5000);
}

function setBadgeError() {
  clearBadgeTimer();
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  chrome.action.setTitle({ title: "AgenticQA - Tarama hatası" });
}

chrome.runtime.onStartup.addListener(async () => {
  const { captureJob } = await chrome.storage.local.get(["captureJob"]);
  if (captureJob?.status === "running") updateBadge(captureJob);
});

chrome.runtime.onInstalled.addListener(async () => {
  const { captureJob } = await chrome.storage.local.get(["captureJob"]);
  if (captureJob?.status === "running") updateBadge(captureJob);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.captureJob?.newValue) {
    updateBadge(changes.captureJob.newValue);
  }
});

async function sendToApi(payload) {
  try {
    const response = await fetch(Config.API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function runAnalysis(tabId, url) {
  const captureId = Config.createCaptureId();
  const adminConsoleUrl = Config.buildAdminConsoleUrl(captureId);

  await setJob({
    status: "running",
    phase: "fast",
    tabId,
    url,
    captureId,
    adminConsoleUrl,
    error: null,
    startedAt: Date.now()
  });

  try {
    await ensureScripts(tabId);

    const fastRes = await chrome.tabs.sendMessage(tabId, { type: "KONSEY_CAPTURE_FAST" });
    if (!fastRes?.ok) throw new Error(fastRes?.error || "Hizli tarama basarisiz");

    let workingPayload = {
      ...fastRes.payload,
      capture_id: captureId,
      admin_console_url: adminConsoleUrl
    };

    await chrome.storage.local.set({ lastCapture: workingPayload });
    await setJob({ phase: "agents", fastDone: true });

    const agentRes = await chrome.tabs.sendMessage(tabId, {
      type: "KONSEY_RUN_AGENT_SIM",
      payload: workingPayload,
      highlight: false
    });
    if (!agentRes?.ok) throw new Error(agentRes?.error || "Agent simulasyonu basarisiz");

    workingPayload = {
      ...agentRes.payload,
      capture_id: captureId,
      admin_console_url: adminConsoleUrl
    };

    await chrome.storage.local.set({ lastCapture: workingPayload });
    await setJob({ phase: "heavy", agentsDone: true });

    const heavyRes = await chrome.tabs.sendMessage(tabId, { type: "KONSEY_CAPTURE_HEAVY" });
    if (!heavyRes?.ok) throw new Error(heavyRes?.error || "DOM/CSS alinamadi");

    const fullPayload = {
      ...workingPayload,
      dom: heavyRes.payload.dom,
      css: heavyRes.payload.css,
      capture_mode: "full",
      capture_id: captureId,
      admin_console_url: adminConsoleUrl
    };

    await chrome.storage.session.set({
      lastCaptureHeavy: {
        dom: heavyRes.payload.dom,
        css: heavyRes.payload.css,
        captured_at: fullPayload.captured_at,
        url: fullPayload.page?.url,
        capture_id: captureId
      }
    });

    await chrome.storage.local.set({ lastCapture: fullPayload });

    const apiResult = await sendToApi(fullPayload);

    await setJob({
      status: "done",
      phase: "complete",
      finishedAt: Date.now(),
      captureId,
      adminConsoleUrl,
      apiSynced: apiResult.ok
    });

    return fullPayload;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tarama hatasi";
    await setJob({ status: "error", error: message, finishedAt: Date.now(), captureId, adminConsoleUrl });
    throw error;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "KONSEY_START_ANALYSIS") {
    runAnalysis(message.tabId, message.url).catch(() => {});
    sendResponse({ ok: true, started: true });
    return false;
  }

  if (message?.type === "KONSEY_SEND_TO_SERVER") {
    fetch(Config.API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload)
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        sendResponse({ ok: response.ok, status: response.status, body });
      })
      .catch((error) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Server request failed"
        });
      });
    return true;
  }

  return false;
});
