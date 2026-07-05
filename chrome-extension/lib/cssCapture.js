(function () {
  const INTERACTIVE_SELECTOR =
    "button, a, input, select, textarea, [role='button'], h1, h2, h3, label, .btn, .button";

  function readStylesheetRules(sheet, limit) {
    try {
      return Array.from(sheet.cssRules || [])
        .map((rule) => rule.cssText)
        .slice(0, limit);
    } catch {
      return [{ note: "cross_origin_blocked", href: sheet.href || null }];
    }
  }

  function collectStylesheets(readRules, maxSheets) {
    const stylesheets = [];

    for (const sheet of document.styleSheets) {
      if (stylesheets.length >= maxSheets) break;

      const entry = {
        href: sheet.href || null,
        rules: readRules ? readStylesheetRules(sheet, readRules === true ? 300 : readRules) : []
      };

      if (entry.href || entry.rules.length > 0) stylesheets.push(entry);
    }

    const inlineStyles = Array.from(document.querySelectorAll("style"))
      .slice(0, readRules ? 15 : 5)
      .map((node, index) => ({
        index,
        content: (node.textContent || "").trim().slice(0, readRules ? 8000 : 2000)
      }))
      .filter((item) => item.content.length > 0);

    return { stylesheets, inline_styles: inlineStyles };
  }

  function collectComputedStyles(maxSamples) {
    const samples = [];
    const seen = new Set();

    document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
      if (samples.length >= maxSamples) return;
      if (!window.KonseyShared.isVisible(el)) return;

      const key = `${el.tagName}:${el.className}:${el.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const computed = window.getComputedStyle(el);
      samples.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: el.className ? String(el.className).split(/\s+/).slice(0, 6) : [],
        text: window.KonseyShared.sanitizeText(el.textContent).slice(0, 60),
        styles: {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontFamily: computed.fontFamily,
          borderRadius: computed.borderRadius
        }
      });
    });

    return samples;
  }

  function extractPalette(samples) {
    const colors = new Set();
    const backgrounds = new Set();
    const fonts = new Set();

    samples.forEach((sample) => {
      colors.add(sample.styles.color);
      backgrounds.add(sample.styles.backgroundColor);
      fonts.add(sample.styles.fontFamily);
    });

    return {
      text_colors: Array.from(colors).slice(0, 15),
      background_colors: Array.from(backgrounds).slice(0, 15),
      font_families: Array.from(fonts).slice(0, 8)
    };
  }

  function build(mode) {
    const isFast = mode === "fast";
    const stylesheetData = collectStylesheets(isFast ? 0 : true, isFast ? 8 : 20);
    const computedStyles = collectComputedStyles(isFast ? 25 : 50);

    return {
      mode,
      stylesheet_count: document.styleSheets.length,
      inline_style_count: stylesheetData.inline_styles.length,
      stylesheets: stylesheetData.stylesheets,
      inline_styles: stylesheetData.inline_styles,
      computed_samples: computedStyles,
      palette: extractPalette(computedStyles)
    };
  }

  window.KonseyCssCapture = {
    captureFast() {
      return build("fast");
    },
    captureHeavy() {
      return build("heavy");
    },
    capture() {
      return build("heavy");
    }
  };
})();
