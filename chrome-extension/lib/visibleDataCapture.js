(function () {
  const BLOCK_TAGS = new Set([
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "TD",
    "TH",
    "LABEL",
    "BUTTON",
    "A",
    "SPAN",
    "DIV",
    "ARTICLE",
    "SECTION"
  ]);

  function isVisible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }

    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getDirectText(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      }
    }
    return text.replace(/\s+/g, " ").trim();
  }

  function extractHeadings() {
    const headings = [];

    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el, index) => {
      if (!isVisible(el)) return;

      const text = window.KonseyPiiSanitizer.redactText((el.textContent || "").trim());
      if (!text) return;

      headings.push({
        index,
        level: el.tagName.toLowerCase(),
        text: text.slice(0, 200)
      });
    });

    return headings.slice(0, 30);
  }

  function extractVisibleBlocks() {
    const blocks = [];
    const seen = new Set();

    document.querySelectorAll("body *").forEach((el) => {
      if (blocks.length >= 60) return;
      if (!BLOCK_TAGS.has(el.tagName)) return;
      if (!isVisible(el)) return;
      if (window.KonseyPiiSanitizer.isSensitiveField(el)) return;

      const text = window.KonseyPiiSanitizer.redactText(
        (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim()
      );

      if (text.length < 2 || text.length > 500) return;
      if (seen.has(text)) return;
      seen.add(text);

      blocks.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") || null,
        text,
        classes: el.className ? String(el.className).split(/\s+/).slice(0, 5) : []
      });
    });

    return blocks;
  }

  function extractNavigation() {
    const navItems = [];

    document
      .querySelectorAll("nav a, header a, [role='navigation'] a, .menu a, .navbar a")
      .forEach((link, index) => {
        if (!isVisible(link)) return;

        const text = window.KonseyPiiSanitizer.redactText((link.textContent || "").trim());
        if (!text) return;

        navItems.push({
          index,
          text: text.slice(0, 80),
          href: window.KonseyPiiSanitizer.sanitizeUrl(link.href)
        });
      });

    return navItems.slice(0, 40);
  }

  function extractCTAs() {
    const ctas = [];

    document
      .querySelectorAll("button, [role='button'], input[type='submit'], a.btn, a.button")
      .forEach((el, index) => {
        if (!isVisible(el)) return;

        const text = window.KonseyPiiSanitizer.redactText(
          (el.textContent || el.value || "").replace(/\s+/g, " ").trim()
        );
        if (!text) return;

        ctas.push({
          index,
          text: text.slice(0, 120),
          tag: el.tagName.toLowerCase()
        });
      });

    return ctas.slice(0, 30);
  }

  function extractProductCards() {
    const cards = [];
    const selectors = [
      ".product-card",
      ".product-item",
      ".product",
      "[data-product-id]",
      "[class*='product-card']",
      "[class*='product-item']",
      ".grid__item",
      ".card"
    ];

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el, index) => {
        if (cards.length >= 20) return;
        if (!isVisible(el)) return;

        const text = window.KonseyPiiSanitizer.redactText(
          (el.innerText || "").replace(/\s+/g, " ").trim()
        );
        if (text.length < 5) return;

        cards.push({
          index,
          selector,
          text: text.slice(0, 350)
        });
      });

      if (cards.length > 0) break;
    }

    return cards;
  }

  function extractFormStructure() {
    const forms = [];

    document.querySelectorAll("form").forEach((form, index) => {
      if (!isVisible(form)) return;

      const fields = [];
      form.querySelectorAll("input, select, textarea, label").forEach((field) => {
        if (!isVisible(field)) return;

        const sensitive = window.KonseyPiiSanitizer.isSensitiveField(field);
        const labelText = window.KonseyPiiSanitizer.redactText(
          (field.labels?.[0]?.textContent || field.getAttribute("aria-label") || "").trim()
        );

        fields.push({
          tag: field.tagName.toLowerCase(),
          type: field.type || null,
          name: sensitive ? "[REDACTED_FIELD]" : field.name || null,
          label: labelText.slice(0, 80) || null,
          required: field.required || false,
          sensitive
        });
      });

      forms.push({
        index,
        action: window.KonseyPiiSanitizer.sanitizeUrl(form.getAttribute("action")),
        method: form.getAttribute("method") || "get",
        field_count: fields.length,
        fields: fields.slice(0, 30)
      });
    });

    return forms.slice(0, 10);
  }

  function extractTrustSignals() {
    const keywords = [
      "ssl",
      "guvenli",
      "güvenli",
      "secure",
      "verified",
      "kargo",
      "iade",
      "return",
      "warranty",
      "garanti",
      "reviews",
      "yorum",
      "rating"
    ];

    const signals = [];

    document.querySelectorAll("body *").forEach((el) => {
      if (signals.length >= 20) return;
      if (!isVisible(el)) return;

      const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (text.length > 120) return;

      const matched = keywords.filter((keyword) => text.includes(keyword));
      if (matched.length === 0) return;

      signals.push({
        text: window.KonseyPiiSanitizer.redactText(text).slice(0, 120),
        keywords: matched
      });
    });

    return signals;
  }

  window.KonseyVisibleDataCapture = {
    captureFast() {
      const headings = extractHeadings();
      const navigation = extractNavigation();
      const ctas = extractCTAs();
      const forms = extractFormStructure();
      const trust_signals = extractTrustSignals();

      const visibleTextSample = window.KonseyPiiSanitizer.redactText(
        (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 2000)
      );

      return {
        mode: "fast",
        visible_text_sample: visibleTextSample,
        headings,
        visible_blocks: [],
        navigation,
        ctas,
        product_cards: [],
        forms,
        trust_signals,
        stats: {
          heading_count: headings.length,
          visible_block_count: 0,
          cta_count: ctas.length,
          product_card_count: 0,
          form_count: forms.length
        }
      };
    },
    capture() {
      const headings = extractHeadings();
      const blocks = extractVisibleBlocks();
      const navigation = extractNavigation();
      const ctas = extractCTAs();
      const product_cards = extractProductCards();
      const forms = extractFormStructure();
      const trust_signals = extractTrustSignals();

      const visibleTextSample = window.KonseyPiiSanitizer.redactText(
        (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 3000)
      );

      return {
        visible_text_sample: visibleTextSample,
        headings,
        visible_blocks: blocks,
        navigation,
        ctas,
        product_cards,
        forms,
        trust_signals,
        stats: {
          heading_count: headings.length,
          visible_block_count: blocks.length,
          cta_count: ctas.length,
          product_card_count: product_cards.length,
          form_count: forms.length
        }
      };
    }
  };
})();
