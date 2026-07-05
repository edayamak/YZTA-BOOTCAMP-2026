(function () {
  const PRICE_PATTERN =
    /(?:₺|TL|TRY|\$|€|£)\s?\d[\d.,]*|\d[\d.,]*\s?(?:₺|TL|TRY|\$|€|£)/gi;
  const PERCENT_PATTERN = /%\s?\d+|\d+\s?%/g;
  const DISCOUNT_PATTERN = /%\d+\s*(?:indirim|off|discount)?|\d+\s?%\s*(?:indirim|off)?/gi;

  function isVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isInViewport(el) {
    if (!isVisible(el)) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function sanitizeText(text) {
    return window.KonseyPiiSanitizer
      ? window.KonseyPiiSanitizer.redactText(text)
      : String(text || "");
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function extractPrices(text) {
    return Array.from(
      new Set((String(text).match(PRICE_PATTERN) || []).map((item) => item.trim()))
    );
  }

  function extractPercents(text) {
    return Array.from(
      new Set((String(text).match(PERCENT_PATTERN) || []).map((item) => item.trim()))
    );
  }

  function extractDiscounts(text) {
    return Array.from(
      new Set((String(text).match(DISCOUNT_PATTERN) || []).map((item) => item.trim()))
    ).slice(0, 15);
  }

  function parsePriceNumber(priceText) {
    const match = String(priceText).match(/[\d.,]+/);
    if (!match) return null;
    const normalized = match[0].includes(",") && match[0].includes(".")
      ? match[0].replace(/\./g, "").replace(",", ".")
      : match[0].replace(",", ".");
    const value = parseFloat(normalized);
    return Number.isNaN(value) ? null : value;
  }

  function parseCountFromText(text) {
    const normalized = String(text || "").trim();
    if (!normalized) return null;

    const paren = normalized.match(/\((\d+)\)/);
    if (paren) return parseInt(paren[1], 10);

    if (normalized.length <= 12) {
      const leading = normalized.match(/^(\d{1,2})(?:\s|$|[^\d])/);
      if (leading) return parseInt(leading[1], 10);
    }

    return null;
  }

  function luminance(rgbString) {
    const match = rgbString.match(/\d+/g);
    if (!match || match.length < 3) return null;

    const [r, g, b] = match.slice(0, 3).map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(foreground, background) {
    const l1 = luminance(foreground);
    const l2 = luminance(background);
    if (l1 === null || l2 === null) return null;

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  window.KonseyShared = {
    PRICE_PATTERN,
    isVisible,
    isInViewport,
    sanitizeText,
    normalizeText,
    extractPrices,
    extractPercents,
    extractDiscounts,
    parsePriceNumber,
    parseCountFromText,
    contrastRatio
  };
})();
