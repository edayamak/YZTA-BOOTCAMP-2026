(function () {
  function buildPayload(mode) {
    const cart = window.KonseyCartExtractor.capture();
    const pageContext = window.KonseyPageContext.capture();
    const isFast = mode === "fast";

    const payload = {
      captured_at: new Date().toISOString(),
      capture_mode: mode,
      privacy_notice:
        "Kisisel kullanici verisi (email, telefon, sifre, adres, kart) toplanmaz veya maskeleme uygulanir.",
      page: {
        url: pageContext.url,
        title: window.KonseyPiiSanitizer.redactText(document.title),
        language: document.documentElement.lang || null,
        referrer: document.referrer
          ? window.KonseyPiiSanitizer.sanitizeUrl(document.referrer)
          : null,
        path: pageContext.path,
        hostname: pageContext.hostname,
        is_https: pageContext.is_https,
        primary_platform: pageContext.primary_platform,
        platform_hints: pageContext.platform_hints,
        meta: pageContext.meta,
        breadcrumbs: pageContext.breadcrumbs,
        page_type_hint: cart.page_type
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        device_pixel_ratio: window.devicePixelRatio,
        document_height: pageContext.document_height,
        document_width: pageContext.document_width
      },
      visible: isFast
        ? window.KonseyVisibleDataCapture.captureFast()
        : window.KonseyVisibleDataCapture.capture(),
      ecommerce: window.KonseyEcommerceSignals.capture(),
      ux: window.KonseyUxMetrics.capture(),
      contrast: window.KonseyContrastAnalyzer.capture(),
      cart,
      dom: isFast ? window.KonseyDomCapture.captureSummary() : window.KonseyDomCapture.captureHeavy(),
      css: isFast ? window.KonseyCssCapture.captureFast() : window.KonseyCssCapture.captureHeavy()
    };

    payload.ml_features = window.KonseyFeatureBuilder.build(payload);
    return payload;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "KONSEY_PING") {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type === "KONSEY_CAPTURE_FAST") {
      try {
        sendResponse({ ok: true, payload: buildPayload("fast") });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Capture failed"
        });
      }
      return false;
    }

    if (message?.type === "KONSEY_CAPTURE_HEAVY") {
      try {
        sendResponse({
          ok: true,
          payload: {
            dom: window.KonseyDomCapture.captureHeavy(),
            css: window.KonseyCssCapture.captureHeavy()
          }
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Capture failed"
        });
      }
      return false;
    }

    if (message?.type === "KONSEY_CAPTURE_PAGE") {
      try {
        sendResponse({ ok: true, payload: buildPayload("heavy") });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Capture failed"
        });
      }
      return false;
    }

    return false;
  });
})();
