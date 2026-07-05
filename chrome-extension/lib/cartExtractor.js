(function () {
  const CART_KEYWORDS =
    /cart|sepet|basket|bag|checkout|minicart|mini-cart|side-cart|drawer|sepetim|basket/i;
  const CART_HEADING =
    /^(sepetim|sepet|my cart|your cart|shopping cart|cart|basket)\b/i;
  const TOTAL_KEYWORDS =
    /^toplam\b|^total\b|^subtotal\b|^ara toplam\b|^genel toplam\b|^ödenecek\b|^odenecek\b|^sepet tutar/i;
  const PRODUCT_URL =
    /\/product|\/products\/|\/p\/|\/p-|\/urun|\/item|variant=|\/dp\/|\/pd\//i;
  const PRODUCT_QUERY =
    /[?&](variant|aroma|boyut|size|color|sku|secenek|option)=/i;
  const NARROW_CART_SELECTORS = [
    ".sidebar-basket-wrapper",
    ".basket-container",
    "[class*='side-bar-basket']",
    "[class*='mini-cart']",
    "[class*='cart-drawer']",
    "[class*='side-cart']",
    "[class*='basket-drawer']",
    "[class*='drawer-shadow']",
    "[class*='shadow-drawer']"
  ];
  const LINE_ITEM_SELECTORS = [
    "[class*='sidebar-product']",
    "[class*='cart-item']",
    "[class*='line-item']",
    "[class*='basket-item']",
    "[data-cart-item]"
  ];
  const PRODUCT_MARKERS =
    '[aria-label="product-name"], [class*="sidebar-product"], [class*="cart-item"], [class*="basket-item"], input[type="number"][min="1"]';
  const CART_CONTROL_HREF =
    /\/checkout|\/cart|\/bag|\/sepet|\/basket|\/warenkorb|\/shop\/cart|\/order\/checkout/i;
  const CART_CONTROL_ARIA =
    /alışveriş sepeti|alisveris sepeti|shopping bag|shopping cart|my bag|your bag|open bag|view bag|(?:^|[,\s])(?:sepetim|sepet|cart|basket|cesta|bolsa|warenkorb)(?:$|[,\s\d])/i;
  const CART_CONTROL_META =
    /cart|bag|basket|sepet|checkout|warenkorb/i;

  function isCartControl(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (!isCartRootEligible(el)) return false;

    const aria = el.getAttribute("aria-label") || "";
    const href = el.getAttribute("href") || "";
    const testMeta = [
      el.getAttribute("data-testid") || "",
      el.getAttribute("data-test") || "",
      el.getAttribute("data-qa") || "",
      el.id || ""
    ]
      .join(" ")
      .toLowerCase();

    if (CART_CONTROL_ARIA.test(aria)) return true;
    if (href && CART_CONTROL_HREF.test(href)) return true;
    if (CART_CONTROL_META.test(testMeta)) return true;

    return false;
  }

  function parseCountFromAriaLabel(label) {
    const text = window.KonseyShared.normalizeText(label);
    if (!text) return null;

    if (/\b(boş|bos|empty)\b/i.test(text) && /sepet|cart|bag|basket/i.test(text)) {
      return 0;
    }

    const sepetNumber = text.match(/\bsepet\b[^\d]{0,10}(\d{1,2})\b/i);
    if (sepetNumber) {
      const count = parseInt(sepetNumber[1], 10);
      if (count >= 0 && count < 100) return count;
    }

    const patterns = [
      /(\d+)\s*(?:item|items|ürün|urun|product|products|piece|pieces|adet|parça|parca)/i,
      /(?:item|items|ürün|urun|product|products|adet|parça|parca)[^\d]{0,12}(\d+)/i,
      /,\s*(\d+)\s*(?:$|[,.])/,
      /:\s*(\d+)\b/,
      /\(\s*(\d+)\s*\)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count >= 0 && count < 100) return count;
      }
    }

    return null;
  }

  function extractBadgeCountFromControl(control) {
    let best = null;

    control.querySelectorAll("span, div, sup, strong, b, p, em").forEach((el) => {
      if (!isCartRootEligible(el)) return;

      const text = window.KonseyShared.normalizeText(el.textContent);
      if (!/^\d{1,2}$/.test(text)) return;

      const childText = Array.from(el.children)
        .map((child) => window.KonseyShared.normalizeText(child.textContent))
        .join("");
      if (childText && childText !== text) return;

      const count = parseInt(text, 10);
      if (count <= 0 || count >= 100) return;

      best = count;
    });

    if (best !== null) return best;

    return parseCountFromAriaLabel(control.getAttribute("aria-label") || "");
  }

  function findHeaderCartControls() {
    const controls = [];
    const seen = new Set();

    const add = (el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      controls.push(el);
    };

    document
      .querySelectorAll('a[href], button, [role="button"]')
      .forEach((el) => {
        if (!isCartControl(el)) return;
        add(el);
      });

    return controls;
  }

  function extractHeaderCartCount() {
    const controls = findHeaderCartControls();
    let best = null;
    let sawEmptyCart = false;

    for (const control of controls) {
      const count = extractBadgeCountFromControl(control);
      if (count === 0) {
        sawEmptyCart = true;
        continue;
      }
      if (count !== null) {
        best = Math.max(best || 0, count);
      }
    }

    if (best !== null && best > 0) return best;
    return sawEmptyCart ? 0 : null;
  }

  function meta(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return "";
    return [
      el.id,
      el.className ? String(el.className) : "",
      el.getAttribute("data-testid") || "",
      el.getAttribute("aria-label") || "",
      el.getAttribute("role") || ""
    ]
      .join(" ")
      .toLowerCase();
  }

  function hasCartKeyword(value) {
    return CART_KEYWORDS.test(String(value || ""));
  }

  function isCartRootEligible(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return true;

    return Boolean(el.querySelector(PRODUCT_MARKERS));
  }

  function isProductLink(href) {
    if (!href || href.startsWith("javascript:")) return false;
    if (PRODUCT_URL.test(href) || /-p-\d+/i.test(href)) return true;
    if (PRODUCT_QUERY.test(href)) return true;

    try {
      const path = new URL(href, window.location.origin).pathname;
      if (path.split("/").filter(Boolean).length <= 2 && /[?&]/.test(href)) return true;
    } catch {
      /* ignore */
    }

    return false;
  }

  function isUpsellProduct(href, name) {
    const h = String(href || "").toLowerCase();
    const n = String(name || "").toLowerCase();
    if (/trendyol-plus|\/plus\/|\/subscription|\/abonelik/.test(h)) return true;
    if (/trendyol plus|plus aylik|plus aylık|abonelik|subscription/.test(n)) return true;
    if (n.length > 180) return true;
    return false;
  }

  function findCartRegionFromHeading() {
    for (const el of document.querySelectorAll("h1, h2, h3, h4")) {
      const text = window.KonseyShared.normalizeText(el.textContent);
      if (!CART_HEADING.test(text)) continue;

      let node = el;
      for (let depth = 0; depth < 12 && node && node !== document.body; depth += 1) {
        const hasProductMarker = Boolean(node.querySelector?.(PRODUCT_MARKERS));
        const hasTotal = /\btoplam\b/i.test(node.textContent || "");
        const looksLikeDrawer =
          /drawer|translate-x|fixed|side-cart|mini-cart|sepet|cart-drawer/i.test(meta(node));

        if (
          isCartRootEligible(node) &&
          (hasProductMarker || (hasTotal && depth >= 2) || (looksLikeDrawer && depth >= 2))
        ) {
          return node;
        }

        node = node.parentElement;
      }
    }

    return null;
  }

  function findCartRegion() {
    for (const selector of NARROW_CART_SELECTORS) {
      const el = document.querySelector(selector);
      if (el && isCartRootEligible(el)) return el;
    }

    const fromHeading = findCartRegionFromHeading();
    if (fromHeading) return fromHeading;

    const candidates = new Map();
    const add = (el, bonus = 0) => {
      if (!el) return;
      let node = el;
      for (let depth = 0; depth < 8 && node; depth += 1) {
        const textLen = (node.textContent || "").length;
        if (textLen > 6000) break;

        let score = bonus;
        const m = meta(node);
        if (hasCartKeyword(m)) score += 4;
        if (node.matches?.("aside, [role='dialog']")) score += 2;
        if (node.querySelector(PRODUCT_MARKERS)) score += 5;
        if (node.querySelector(".total_product_count, .basket-count, [class*='product_count']")) {
          score += 4;
        }
        if (textLen > 2500) score -= 3;

        if (score >= 5 && isCartRootEligible(node)) {
          candidates.set(node, Math.max(candidates.get(node) || 0, score));
        }
        node = node.parentElement;
      }
    };

    document
      .querySelectorAll(
        "aside, [role='dialog'], [class*='basket'], [class*='cart-drawer'], [class*='drawer-shadow'], [class*='shadow-drawer']"
      )
      .forEach((el) => {
        if (hasCartKeyword(meta(el)) || el.querySelector(PRODUCT_MARKERS)) add(el, 2);
      });

    let best = null;
    let bestScore = 0;
    candidates.forEach((score, el) => {
      if (score > bestScore) {
        best = el;
        bestScore = score;
      }
    });

    return best;
  }

  function extractCartCount(region) {
    const headerCount = extractHeaderCartCount();
    if (headerCount !== null) return headerCount;

    const badgeSelectors = [
      "[class*='cart-icon'] [class*='count']",
      "[class*='bag-icon'] [class*='count']",
      "[data-qa*='cart'][data-qa*='count']",
      "[data-test*='cart'][data-test*='count']",
      "#nav-cart-count",
      "#nav-ewc-cart-count",
      ".total_product_count",
      ".basket-count",
      "[class*='basket-count']",
      "[class*='cart-count']",
      "[class*='product_count']",
      "[data-cart-count]"
    ];

    for (const selector of badgeSelectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (!isCartRootEligible(el)) continue;
        const text = window.KonseyShared.normalizeText(el.textContent);
        if (text.length > 12) continue;
        const count = window.KonseyShared.parseCountFromText(text);
        if (count !== null && count < 100) return count;
      }
    }

    for (const el of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const text = window.KonseyShared.normalizeText(el.textContent);
      if (text.length > 24) continue;
      if (!/sepetim|sepet|cart|basket/i.test(text)) continue;
      const count = window.KonseyShared.parseCountFromText(text);
      if (count !== null && count < 100) return count;
    }

    const scopes = region ? [region] : [];
    for (const scope of scopes) {
      for (const el of scope.querySelectorAll("span, div, button")) {
        if (!isCartRootEligible(el)) continue;
        const text = window.KonseyShared.normalizeText(el.textContent);
        if (text.length > 40) continue;
        if (!/sepet|cart|basket/i.test(text)) continue;
        const count = window.KonseyShared.parseCountFromText(text);
        if (count !== null && count < 100) return count;
      }
    }

    return null;
  }

  function isShippingThreshold(text) {
    return /(ucretsiz|ücretsiz)\s*kargo|free shipping|kargo.*(ustu|üzeri|over)/i.test(text);
  }

  function extractCartTotal(region) {
    const scopes = region ? [region, document] : [document];

    for (const scope of scopes) {
      for (const el of scope.querySelectorAll(
        "[class*='subtotal'], [class*='total-amount'], [class*='cart-total'], [class*='basket-total']"
      )) {
        if (!isCartRootEligible(el)) continue;
        const text = window.KonseyShared.normalizeText(el.innerText || el.textContent);
        if (isShippingThreshold(text)) continue;
        const prices = window.KonseyShared.extractPrices(text);
        if (prices.length === 0) continue;

        return {
          label: "Sepet toplam",
          amount: prices[0],
          numeric: window.KonseyShared.parsePriceNumber(prices[0]),
          source: "subtotal_element"
        };
      }

      for (const el of scope.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
        if (!isCartRootEligible(el)) continue;
        const text = window.KonseyShared.normalizeText(el.innerText || el.textContent);
        if (!TOTAL_KEYWORDS.test(text)) continue;
        if (isShippingThreshold(text)) continue;

        const prices = window.KonseyShared.extractPrices(text);
        if (prices.length === 0) continue;

        return {
          label: window.KonseyShared.sanitizeText(text).slice(0, 80),
          amount: prices[prices.length - 1],
          numeric: window.KonseyShared.parsePriceNumber(prices[prices.length - 1]),
          source: "total_heading"
        };
      }
    }

    return null;
  }

  function parseQuantityFromNode(node) {
    const qtyInput = node.querySelector('input[type="number"]');
    if (qtyInput?.value) return parseInt(qtyInput.value, 10) || null;

    const qtyText = window.KonseyShared.normalizeText(
      node.querySelector("[class*='quantity']")?.textContent || ""
    );
    const xMatch = qtyText.match(/x\s*(\d+)/i);
    if (xMatch) return parseInt(xMatch[1], 10);

    return null;
  }

  function buildLineItem(index, source, name, prices, link, image, quantity) {
    return {
      index,
      source,
      name: window.KonseyShared.sanitizeText(name).slice(0, 160),
      text: window.KonseyShared.sanitizeText(name).slice(0, 300),
      prices: prices.slice(0, 3),
      quantity,
      quantity_input: quantity !== null,
      href: link ? window.KonseyPiiSanitizer.sanitizeUrl(link) : null,
      image_alt: image?.alt || null
    };
  }

  function extractLineItems(region) {
    if (!region) return [];

    const items = [];
    const seen = new Set();

    const push = (item) => {
      if (isUpsellProduct(item.href, item.name)) return;
      const key = `${item.name}:${item.href || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(item);
    };

    region.querySelectorAll('[aria-label="product-name"]').forEach((node, index) => {
      if (items.length >= 20) return;

      const container =
        node.closest("li, article, [class*='grid'], [class*='cart'], [class*='product']") ||
        node.parentElement;
      const link = container?.querySelector("a[href]")?.href || null;
      const img = container?.querySelector("img") || null;
      const name = window.KonseyShared.normalizeText(node.textContent);
      if (name.length < 3) return;

      const prices = window.KonseyShared.extractPrices(
        window.KonseyShared.normalizeText(container?.innerText || container?.textContent || "")
      );

      push(
        buildLineItem(
          index,
          "aria_product_name",
          name,
          prices,
          link,
          img,
          parseQuantityFromNode(container || node)
        )
      );
    });

    if (items.length > 0) return items;

    for (const selector of LINE_ITEM_SELECTORS) {
      region.querySelectorAll(selector).forEach((node, index) => {
        if (items.length >= 20) return;

        const link = node.querySelector("a[href]")?.href || null;
        const img = node.querySelector("img");
        const name = window.KonseyShared.normalizeText(
          img?.alt || node.querySelector("[class*='title'], [class*='name']")?.textContent || ""
        );
        if (name.length < 3) return;

        const prices = window.KonseyShared.extractPrices(
          window.KonseyShared.normalizeText(node.innerText || node.textContent)
        );

        push(
          buildLineItem(
            index,
            "cart_row",
            name,
            prices,
            link,
            img,
            parseQuantityFromNode(node)
          )
        );
      });

      if (items.length > 0) return items;
    }

    region.querySelectorAll("a[href]").forEach((link, index) => {
      if (items.length >= 20) return;
      if (!isProductLink(link.href)) return;

      const container = link.closest("li, article, div") || link;
      if (!region.contains(container)) return;

      const img = link.querySelector("img") || container.querySelector("img");
      const name = window.KonseyShared.normalizeText(
        img?.alt || link.getAttribute("title") || link.textContent || ""
      );
      if (name.length < 3) return;

      const prices = window.KonseyShared.extractPrices(
        window.KonseyShared.normalizeText(container.innerText || container.textContent)
      );

      push(
        buildLineItem(
          index,
          "product_link",
          name,
          prices,
          link.href,
          img,
          parseQuantityFromNode(container)
        )
      );
    });

    return items;
  }

  function resolveCartCount(count, lineItems) {
    if (count !== null) return count;
    if (lineItems.length === 0) return null;
    return lineItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function extractCartFeatures(region) {
    const text = window.KonseyShared.normalizeText(region?.textContent || "");

    return {
      free_shipping_message: /(ucretsiz|ücretsiz)\s*kargo|free shipping/i.test(text),
      promo_code_available: /(promosyon|kupon|coupon|indirim kodu)/i.test(text),
      gift_selection_available: /(hediye)/i.test(text),
      checkout_cta_visible: /(devam et|checkout|odeme|ödeme|satin al|satın al)/i.test(text)
    };
  }

  function detectPageType() {
    const path = window.location.pathname.toLowerCase();
    const haystack = `${path} ${document.title}`.toLowerCase();

    if (/(cart|sepet|basket|bag)/.test(haystack)) return "cart";
    if (/(checkout|odeme|ödeme|payment)/.test(haystack)) return "checkout";
    if (document.querySelector("[itemtype*='Product'], [class*='product-detail'], .product-single")) {
      return "product";
    }
    if (path === "/" || path === "") return "home";
    return "browse";
  }

  function extractJsonLdHints() {
    const hints = [];

    document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
      try {
        const data = JSON.parse(node.textContent || "{}");
        const serialized = JSON.stringify(data).toLowerCase();
        if (/product|offer|breadcrumb|organization/.test(serialized)) hints.push(data);
      } catch {
        /* ignore */
      }
    });

    return hints.slice(0, 8);
  }

  window.KonseyCartExtractor = {
    findCartRegion,
    findCartDrawerRoot: findCartRegion,
    capture() {
      const region = findCartRegion();
      const lineItems = extractLineItems(region);
      const total = extractCartTotal(region);
      const count = resolveCartCount(extractCartCount(region), lineItems);
      const visibleText = window.KonseyShared.normalizeText(document.body?.innerText || "");

      return {
        page_type: detectPageType(),
        cart_open: !!region,
        cart_region_score: region ? meta(region).slice(0, 80) : null,
        cart_item_count: count,
        cart_total: total,
        visible_prices: window.KonseyShared.extractPrices(visibleText).slice(0, 30),
        line_items: lineItems,
        cart_features: extractCartFeatures(region),
        totals: {
          subtotal_candidates: total?.amount ? [total.amount] : [],
          page_has_checkout_cta: /(ödeme|odeme|checkout|satın al|satin al|devam et)/i.test(visibleText)
        },
        structured_hints: extractJsonLdHints()
      };
    }
  };
})();
