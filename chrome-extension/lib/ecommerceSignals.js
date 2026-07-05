(function () {
  const SHIPPING_KEYWORDS = [
    "ucretsiz kargo",
    "ücretsiz kargo",
    "free shipping",
    "kargo",
    "teslimat",
    "aynı gün",
    "ayni gun",
    "same day"
  ];

  const PAYMENT_KEYWORDS = [
    "visa",
    "mastercard",
    "troy",
    "kapida odeme",
    "kapıda ödeme",
    "taksit",
    "installment",
    "paypal",
    "iyzico",
    "paytr",
    "stripe"
  ];

  const URGENCY_KEYWORDS = [
    "son ",
    "kalan",
    "stokta",
    "tukendi",
    "tükendi",
    "limited",
    "flash",
    "firsat",
    "fırsat",
    "countdown"
  ];

  const SOCIAL_PROOF_KEYWORDS = [
    "yorum",
    "review",
    "rating",
    "puan",
    "mutlu musteri",
    "mutlu müşteri",
    "bestseller",
    "en cok satan",
    "en çok satan"
  ];

  const TRUST_KEYWORDS = [
    "guvenli",
    "güvenli",
    "secure",
    "ssl",
    "verified",
    "iade",
    "return",
    "garanti",
    "warranty"
  ];

  const BANNER_PATTERN =
    /ucretsiz kargo|ücretsiz kargo|guvenli alisveris|güvenli alışveriş|mutlu musteri|mutlu müşteri|ayni gun kargo|aynı gün kargo|kargo.*(ustu|üzeri)/i;

  function findKeywordMatches(text, keywords) {
    const normalized = text.toLowerCase();
    return keywords.filter((keyword) => normalized.includes(keyword));
  }

  function extractSignalBlocks(keywords, limit = 20) {
    const signals = [];
    const seen = new Set();

    document.querySelectorAll("body *").forEach((el) => {
      if (signals.length >= limit) return;
      if (!window.KonseyShared.isVisible(el)) return;

      const text = window.KonseyShared.normalizeText(el.textContent);
      if (text.length < 3 || text.length > 180) return;

      const matched = findKeywordMatches(text, keywords);
      if (matched.length === 0) return;
      if (seen.has(text)) return;
      seen.add(text);

      signals.push({ text: window.KonseyShared.sanitizeText(text), keywords: matched });
    });

    return signals;
  }

  function isInsideCartRegion(el) {
    const root = window.KonseyCartExtractor?.findCartRegion?.();
    return !!(root && root.contains(el));
  }

  function scoreProductCandidate(el) {
    if (!window.KonseyShared.isVisible(el)) return 0;
    if (isInsideCartRegion(el)) return 0;

    let score = 0;
    const text = window.KonseyShared.normalizeText(el.innerText || el.textContent);
    const prices = window.KonseyShared.extractPrices(text);
    const link = el.querySelector("a[href]")?.href || el.closest("a[href]")?.href || null;
    const image = el.querySelector("img");

    if (prices.length === 0) return 0;
    if (text.length < 8 || text.length > 600) return 0;
    if (BANNER_PATTERN.test(text) && !link) return 0;

    if (link) score += 3;
    if (image?.alt) score += 2;
    if (el.matches?.("[data-product-id], [data-id], article, li")) score += 1;
    if (/product|urun|item|card|p-card/i.test(`${el.className} ${el.id}`)) score += 1;
    if (prices.length >= 1 && prices.length <= 3) score += 1;

    return score;
  }

  function extractProductListings() {
    const candidates = [];
    const selectors = [
      "article",
      "li",
      "figure",
      "[data-product-id]",
      "[data-id]",
      "[data-testid*='product' i]",
      "[class*='product-card' i]",
      "[class*='product-item' i]",
      "[class*='p-card' i]",
      "[class*='ProductCard' i]"
    ];

    const nodes = new Set();
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => nodes.add(el));
    });

    nodes.forEach((el, index) => {
      const score = scoreProductCandidate(el);
      if (score < 4) return;

      const text = window.KonseyShared.normalizeText(el.innerText || el.textContent);
      const prices = window.KonseyShared.extractPrices(text);
      const link = el.querySelector("a[href]")?.href || (el.matches?.("a[href]") ? el.href : null);
      const image = el.querySelector("img");
      const title =
        image?.alt ||
        el.querySelector("h2, h3, h4, [class*='title'], [class*='name']")?.textContent ||
        text;

      candidates.push({
        index,
        score,
        title: window.KonseyShared.sanitizeText(title).slice(0, 120),
        prices: prices.slice(0, 5),
        discounts: window.KonseyShared.extractDiscounts(text),
        href: link ? window.KonseyPiiSanitizer.sanitizeUrl(link) : null,
        image_alt: image?.alt || null
      });
    });

    candidates.sort((a, b) => b.score - a.score);

    const products = [];
    const seen = new Set();

    for (const item of candidates) {
      const key = `${item.title.slice(0, 50)}:${item.prices[0] || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      products.push(item);
      if (products.length >= 30) break;
    }

    return products;
  }

  function extractBadges() {
    const badges = [];
    const seen = new Set();

    document.querySelectorAll("[class*='badge'], [class*='tag'], span, div").forEach((el) => {
      if (badges.length >= 25) return;
      if (!window.KonseyShared.isVisible(el)) return;

      const text = window.KonseyShared.normalizeText(el.textContent);
      if (text.length < 2 || text.length > 40) return;
      if (!/%|indirim|yeni|new|sale|lansman|fırsat|firsat|hot|free/i.test(text)) return;
      if (seen.has(text)) return;
      seen.add(text);

      badges.push({
        text: window.KonseyShared.sanitizeText(text),
        classes: el.className ? String(el.className).split(/\s+/).slice(0, 5) : []
      });
    });

    return badges;
  }

  function extractCheckoutHints() {
    const bodyText = window.KonseyShared.normalizeText(document.body?.innerText || "").toLowerCase();

    return {
      has_guest_checkout_text: /(misafir|guest).*(odeme|checkout|alisveris)/i.test(bodyText),
      has_account_login: /(uye giris|üye giriş|login|sign in)/i.test(bodyText),
      has_continue_button: /(devam et|continue|odeme|checkout)/i.test(bodyText),
      has_promo_code_field: /(promosyon|kupon|coupon|indirim kodu)/i.test(bodyText),
      has_free_gift_text: /(hediye|gift)/i.test(bodyText)
    };
  }

  function extractPriceSummary() {
    const bodyText = document.body?.innerText || "";
    const prices = window.KonseyShared.extractPrices(bodyText).map((price) => ({
      raw: price,
      value: window.KonseyShared.parsePriceNumber(price)
    }));

    const numeric = prices.map((item) => item.value).filter((value) => value !== null);

    return {
      all_visible_prices: prices.slice(0, 30).map((item) => item.raw),
      min_price: numeric.length ? Math.min(...numeric) : null,
      max_price: numeric.length ? Math.max(...numeric) : null,
      discount_badges: window.KonseyShared.extractDiscounts(bodyText)
    };
  }

  window.KonseyEcommerceSignals = {
    capture() {
      const bodyText = window.KonseyShared.normalizeText(document.body?.innerText || "");

      return {
        shipping_signals: extractSignalBlocks(SHIPPING_KEYWORDS),
        payment_signals: extractSignalBlocks(PAYMENT_KEYWORDS),
        urgency_signals: extractSignalBlocks(URGENCY_KEYWORDS, 15),
        social_proof_signals: extractSignalBlocks(SOCIAL_PROOF_KEYWORDS, 15),
        trust_signals: extractSignalBlocks(TRUST_KEYWORDS, 20),
        product_listings: extractProductListings(),
        badges: extractBadges(),
        checkout_hints: extractCheckoutHints(),
        pricing: extractPriceSummary(),
        review_widgets_detected: {
          yotpo: !!document.querySelector("[class*='yotpo']"),
          trustpilot: !!document.querySelector("[class*='trustpilot']"),
          google_reviews: /google.*yorum|google review/i.test(bodyText)
        }
      };
    }
  };
})();
