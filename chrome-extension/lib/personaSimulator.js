(function () {
  const HIGHLIGHT_CLASS = "agenticqa-persona-highlight";
  const STYLE_ID = "agenticqa-persona-style";
  const HIGHLIGHT_MS = 4000;

  const PERSONA_META = {
    impatient_shopper: { label: "Aceleci Alışverişçi", lane: "conversion" },
    accessibility_focused_user: { label: "Erişilebilirlik Hassas Kullanıcı", lane: "ux_churn" },
    malicious_actor: { label: "Kötü Niyetli Saldırgan", lane: "trust" }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildPersonaResult(id, events, findings, friction, wouldAbandon) {
    const meta = PERSONA_META[id];
    return {
      id,
      label: meta.label,
      lane: meta.lane,
      status: "completed",
      would_abandon: wouldAbandon,
      friction_score: clamp(Math.round(friction), 0, 100),
      events,
      findings: findings.slice(0, 5)
    };
  }

  function simulateImpatientShopper(payload) {
    const events = [];
    const findings = [];
    let friction = 18;
    let wouldAbandon = false;

    const pageType = payload.cart?.page_type || "unknown";
    const hasCheckoutCta = payload.cart?.totals?.page_has_checkout_cta === true;
    const formFields = payload.ux?.forms?.non_sensitive_fields || 0;
    const cartItems = payload.cart?.cart_item_count || 0;
    const ctaAboveFold = payload.ux?.above_fold?.cta_above_fold || 0;
    const visiblePrices = payload.ecommerce?.pricing?.all_visible_prices?.length || 0;

    events.push({ t: 0, type: "page_scan", page_type: pageType });

    if (!hasCheckoutCta && (pageType === "cart" || pageType === "checkout")) {
      friction += 38;
      wouldAbandon = true;
      findings.push("Checkout CTA bulunamadi — aceleci kullanici terk eder");
      events.push({ t: 900, type: "seek_checkout", result: "not_found" });
    } else if (hasCheckoutCta) {
      events.push({ t: 450, type: "seek_checkout", result: "found" });
      friction -= 8;
    }

    if (formFields > 8) {
      friction += 28;
      wouldAbandon = true;
      findings.push(`${formFields} form alani — aceleci kullanici formu birakir`);
      events.push({ t: 1400, type: "form_scan", fields: formFields, result: "too_many" });
    } else if (formFields > 4) {
      friction += 10;
      events.push({ t: 1100, type: "form_scan", fields: formFields, result: "moderate" });
    }

    if (cartItems === 0 && pageType === "cart") {
      friction += 14;
      findings.push("Sepet bos — satin alma akisi baslamiyor");
      events.push({ t: 650, type: "cart_check", items: 0 });
    } else if (cartItems > 0) {
      events.push({ t: 500, type: "cart_check", items: cartItems });
      friction -= 6;
    }

    if (ctaAboveFold === 0 && pageType !== "cart" && pageType !== "checkout") {
      friction += 12;
      findings.push("Above-fold CTA yok — hizli karar veremiyor");
      events.push({ t: 320, type: "cta_scan", above_fold: 0 });
    }

    if (visiblePrices === 0 && (payload.ecommerce?.product_listings?.length || 0) > 0) {
      friction += 16;
      wouldAbandon = true;
      findings.push("Fiyat gorunmuyor — aceleci kullanici urunu birakir");
      events.push({ t: 750, type: "price_scan", visible_prices: 0 });
    }

    return buildPersonaResult("impatient_shopper", events, findings, friction, wouldAbandon);
  }

  function simulateAccessibilityFocusedUser(payload) {
    const events = [];
    const findings = [];
    let friction = 15;
    let wouldAbandon = false;

    const smallTargets = payload.ux?.small_tap_targets?.length || 0;
    const modals = payload.ux?.modals_and_overlays?.length || 0;
    const complexity = payload.ux?.visual_complexity?.elements_per_viewport_k || 0;
    const contrast = payload.contrast?.contrast_quality || "unknown";
    const hierarchyValid = payload.ux?.heading_hierarchy?.hierarchy_valid !== false;

    events.push({ t: 0, type: "orientation_scan" });

    if (smallTargets > 0) {
      friction += Math.min(smallTargets * 4, 28);
      wouldAbandon = smallTargets >= 3;
      findings.push(`${smallTargets} kucuk tiklanabilir alan — erisilebilirlik sorunu`);
      events.push({ t: 800, type: "tap_target_scan", count: smallTargets, result: "fail" });
    } else {
      events.push({ t: 600, type: "tap_target_scan", count: 0, result: "pass" });
    }

    if (modals > 0) {
      friction += Math.min(modals * 6, 24);
      wouldAbandon = true;
      findings.push(`${modals} modal/popup — navigasyonu zorlastiriyor`);
      events.push({ t: 1200, type: "modal_encounter", count: modals });
    }

    if (complexity > 5) {
      friction += 18;
      wouldAbandon = true;
      findings.push("Yuksek gorsel karmasiklik — icerikte yön bulmak zor");
      events.push({ t: 1600, type: "complexity_scan", score: complexity });
    }

    if (contrast === "low") {
      friction += 22;
      findings.push("Dusuk kontrast — metinleri okuyamaz");
      events.push({ t: 1000, type: "contrast_check", result: "fail" });
    } else if (contrast === "medium") {
      friction += 10;
      events.push({ t: 950, type: "contrast_check", result: "warn" });
    }

    if (!hierarchyValid) {
      friction += 12;
      findings.push("Baslik hiyerarsisi bozuk — sayfa yapisi anlasilmiyor");
      events.push({ t: 1400, type: "heading_scan", result: "invalid" });
    }

    return buildPersonaResult("accessibility_focused_user", events, findings, friction, wouldAbandon);
  }

  function simulateMaliciousActor(payload) {
    const events = [];
    const findings = [];
    let friction = 12;
    let wouldAbandon = false;

    const isHttps = payload.page?.is_https === true;
    const sensitiveFields = payload.ux?.forms?.sensitive_fields || 0;
    const trustSignals =
      (payload.ecommerce?.trust_signals?.length || 0) +
      (payload.visible?.trust_signals?.length || 0);
    const paymentSignals = payload.ecommerce?.payment_signals?.length || 0;

    events.push({ t: 0, type: "surface_scan" });

    if (!isHttps) {
      friction += 40;
      findings.push("HTTPS yok — guvenlik acigi sinyali");
      events.push({ t: 200, type: "transport_check", result: "insecure" });
    } else {
      events.push({ t: 180, type: "transport_check", result: "secure" });
    }

    if (sensitiveFields > 0) {
      friction += Math.min(sensitiveFields * 8, 32);
      findings.push(`${sensitiveFields} hassas form alani gorunur — veri sizintisi riski`);
      events.push({ t: 700, type: "field_probe", sensitive_fields: sensitiveFields, result: "exposed" });
    } else {
      events.push({ t: 650, type: "field_probe", sensitive_fields: 0, result: "none_visible" });
    }

    if (trustSignals === 0) {
      friction += 16;
      findings.push("Guven rozeti/mesaji yok — saldirgan acisindan zayif sinyal");
      events.push({ t: 950, type: "trust_scan", count: 0 });
    } else {
      friction -= 6;
      events.push({ t: 900, type: "trust_scan", count: trustSignals });
    }

    if (paymentSignals === 0 && (payload.cart?.page_type === "checkout" || payload.cart?.page_type === "cart")) {
      friction += 10;
      findings.push("Odeme guveni sinyali eksik");
      events.push({ t: 1100, type: "payment_scan", count: 0 });
    }

    return buildPersonaResult("malicious_actor", events, findings, friction, wouldAbandon);
  }

  function ensureHighlightStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #f59e0b !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25) !important;
      }
      .${HIGHLIGHT_CLASS}[data-agenticqa-tone="danger"] {
        outline-color: #ef4444 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
      }
      .${HIGHLIGHT_CLASS}[data-agenticqa-tone="warn"] {
        outline-color: #f59e0b !important;
      }
      .${HIGHLIGHT_CLASS}[data-agenticqa-tone="info"] {
        outline-color: #2563eb !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2) !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function markElement(el, tone) {
    if (!el || !window.KonseyShared?.isVisible?.(el)) return;
    el.classList.add(HIGHLIGHT_CLASS);
    el.setAttribute("data-agenticqa-tone", tone || "warn");
  }

  function clearHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
      el.removeAttribute("data-agenticqa-tone");
    });
  }

  function applyHighlights(payload, simulation) {
    ensureHighlightStyles();
    clearHighlights();

    const checkoutSelectors =
      "button, a, [role='button'], input[type='submit']";
    const checkoutPattern =
      /checkout|odeme|ödeme|siparis|sipariş|satın al|satin al|proceed|place order/i;

    document.querySelectorAll(checkoutSelectors).forEach((el) => {
      if (!window.KonseyShared.isVisible(el)) return;
      const text = window.KonseyShared.normalizeText(el.textContent || el.getAttribute("aria-label") || "");
      if (checkoutPattern.test(text)) {
        markElement(el, "info");
      }
    });

    if (payload.cart?.totals?.page_has_checkout_cta !== true) {
      const cartRoot = window.KonseyCartExtractor?.findCartRegion?.();
      if (cartRoot) markElement(cartRoot, "danger");
    }

    (payload.ux?.small_tap_targets || []).slice(0, 3).forEach((_item, index) => {
      const buttons = document.querySelectorAll("button, a, [role='button']");
      let seen = 0;
      buttons.forEach((el) => {
        if (seen > index) return;
        if (!window.KonseyShared.isVisible(el)) return;
        const rect = el.getBoundingClientRect();
        if (rect.width >= 44 && rect.height >= 44) return;
        if (seen === index) markElement(el, "warn");
        seen += 1;
      });
    });

    document.querySelectorAll("input, select, textarea").forEach((field) => {
      if (!window.KonseyShared.isVisible(field)) return;
      if (window.KonseyPiiSanitizer?.isSensitiveField?.(field)) {
        markElement(field, "danger");
      }
    });

    const impatient = simulation.personas.find((p) => p.id === "impatient_shopper");
    if (impatient?.would_abandon && payload.ux?.forms?.non_sensitive_fields > 8) {
      const form = document.querySelector("form");
      if (form) markElement(form, "warn");
    }

    window.setTimeout(clearHighlights, HIGHLIGHT_MS);
  }

  function run(payload, options) {
    const opts = options || {};
    const personas = [
      simulateImpatientShopper(payload),
      simulateAccessibilityFocusedUser(payload),
      simulateMaliciousActor(payload)
    ];

    const simulation = {
      simulated_at: new Date().toISOString(),
      personas,
      aggregate: {
        any_would_abandon: personas.some((persona) => persona.would_abandon),
        total_findings: personas.reduce((sum, persona) => sum + persona.findings.length, 0),
        max_friction_score: Math.max(...personas.map((persona) => persona.friction_score))
      }
    };

    if (opts.highlight !== false) {
      try {
        applyHighlights(payload, simulation);
      } catch {
        /* demo overlay optional */
      }
    }

    return simulation;
  }

  window.KonseyPersonaSimulator = {
    run,
    applyHighlights,
    clearHighlights
  };
})();
