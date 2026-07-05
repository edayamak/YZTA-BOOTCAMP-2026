(function () {
  function extractHeadingHierarchy() {
    const headings = [];

    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el, index) => {
      if (!window.KonseyShared.isVisible(el)) return;
      headings.push({
        index,
        level: Number(el.tagName.replace("H", "")),
        text: window.KonseyShared.sanitizeText(el.textContent).slice(0, 120)
      });
    });

    let hierarchyValid = true;
    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i].level - headings[i - 1].level > 1) {
        hierarchyValid = false;
        break;
      }
    }

    return {
      headings,
      h1_count: headings.filter((item) => item.level === 1).length,
      hierarchy_valid: hierarchyValid
    };
  }

  function extractFormMetrics() {
    let totalFields = 0;
    let requiredFields = 0;
    let sensitiveFields = 0;

    document.querySelectorAll("input, select, textarea").forEach((field) => {
      if (!window.KonseyShared.isVisible(field)) return;
      totalFields += 1;
      if (field.required) requiredFields += 1;
      if (window.KonseyPiiSanitizer.isSensitiveField(field)) sensitiveFields += 1;
    });

    return {
      total_visible_fields: totalFields,
      required_fields: requiredFields,
      sensitive_fields: sensitiveFields,
      non_sensitive_fields: Math.max(totalFields - sensitiveFields, 0)
    };
  }

  function extractModalDetection() {
    const modals = [];

    document
      .querySelectorAll(
        "[role='dialog'], [aria-modal='true'], .modal, .popup, .overlay, [class*='drawer'], [class*='cookie']"
      )
      .forEach((el, index) => {
        if (!window.KonseyShared.isVisible(el)) return;

        const text = window.KonseyShared.sanitizeText(el.textContent).slice(0, 180);
        if (!text) return;

        modals.push({
          index,
          tag: el.tagName.toLowerCase(),
          classes: el.className ? String(el.className).split(/\s+/).slice(0, 6) : [],
          text
        });
      });

    return modals.slice(0, 10);
  }

  function extractAboveFoldMetrics() {
    let visibleElements = 0;
    let ctaAboveFold = 0;
    let imagesAboveFold = 0;

    document.querySelectorAll("button, a, img, input, h1, h2").forEach((el) => {
      if (!window.KonseyShared.isInViewport(el)) return;
      visibleElements += 1;
      if (el.tagName === "IMG") imagesAboveFold += 1;
      if (el.tagName === "BUTTON" || el.getAttribute("role") === "button") ctaAboveFold += 1;
    });

    return {
      visible_interactive_above_fold: visibleElements,
      cta_above_fold: ctaAboveFold,
      images_above_fold: imagesAboveFold
    };
  }

  function extractAccessibilityHints() {
    const images = document.querySelectorAll("img");
    let withAlt = 0;
    let withoutAlt = 0;

    images.forEach((img) => {
      if (img.alt && img.alt.trim()) withAlt += 1;
      else withoutAlt += 1;
    });

    const ariaLabelCount = document.querySelectorAll("[aria-label]").length;
    const missingButtonText = [];

    document.querySelectorAll("button, [role='button']").forEach((btn, index) => {
      if (missingButtonText.length >= 10) return;
      const text = window.KonseyShared.normalizeText(btn.textContent || btn.getAttribute("aria-label"));
      if (!text) {
        missingButtonText.push({
          index,
          classes: btn.className ? String(btn.className).split(/\s+/).slice(0, 5) : []
        });
      }
    });

    return {
      image_alt_coverage_ratio: images.length ? Number((withAlt / images.length).toFixed(2)) : null,
      images_with_alt: withAlt,
      images_without_alt: withoutAlt,
      aria_label_count: ariaLabelCount,
      buttons_missing_text: missingButtonText
    };
  }

  function extractTapTargets() {
    const smallTargets = [];

    document.querySelectorAll("button, a, [role='button']").forEach((el, index) => {
      if (smallTargets.length >= 15) return;
      if (!window.KonseyShared.isVisible(el)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) return;

      smallTargets.push({
        index,
        text: window.KonseyShared.sanitizeText(el.textContent).slice(0, 60),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    });

    return smallTargets;
  }

  function extractVisualComplexity() {
    const totalElements = document.querySelectorAll("body *").length;
    const viewportArea = window.innerWidth * window.innerHeight || 1;

    return {
      total_dom_elements: totalElements,
      elements_per_viewport_k: Number((totalElements / (viewportArea / 1000)).toFixed(2)),
      iframe_count: document.querySelectorAll("iframe").length,
      video_count: document.querySelectorAll("video").length,
      sticky_header_detected: !!document.querySelector("header[class*='sticky'], header[style*='sticky'], .sticky")
    };
  }

  window.KonseyUxMetrics = {
    capture() {
      const headingData = extractHeadingHierarchy();
      const formMetrics = extractFormMetrics();
      const aboveFold = extractAboveFoldMetrics();
      const accessibility = extractAccessibilityHints();
      const complexity = extractVisualComplexity();

      return {
        heading_hierarchy: headingData,
        forms: formMetrics,
        above_fold: aboveFold,
        modals_and_overlays: extractModalDetection(),
        accessibility,
        small_tap_targets: extractTapTargets(),
        visual_complexity: complexity
      };
    }
  };
})();
