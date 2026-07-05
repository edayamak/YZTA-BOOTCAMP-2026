(function () {
  function detectPlatform() {
    const host = window.location.hostname.toLowerCase();

    if (host.includes("amazon.")) return ["amazon"];
    if (host.includes("mediamarkt")) return ["mediamarkt"];
    if (host.includes("trendyol")) return ["trendyol"];
    if (host.includes("hepsiburada")) return ["hepsiburada"];
    if (host.includes("n11.com")) return ["n11"];
    if (host.endsWith(".myshopify.com") || host.includes("shopify")) return ["shopify"];

    if (document.querySelector("#nav-cart, #navbar, #nav-logo-sprite")) {
      return ["amazon"];
    }

    const html = document.documentElement.outerHTML;

    if (/webmobile-pwa|mms-app-root|assets\.mmsrg\.com/i.test(html)) return ["mediamarkt"];
    if (/cdn\.myikas\.com|ikas\.com/i.test(html)) return ["ikas"];
    if (/woocommerce|wp-content/i.test(html)) return ["woocommerce"];
    if (/magento/i.test(html)) return ["magento"];
    if (/ticimax/i.test(html)) return ["ticimax"];
    if (/ideasoft/i.test(html)) return ["ideasoft"];

    return ["unknown"];
  }

  function extractMeta() {
    const readMeta = (selector) =>
      document.querySelector(selector)?.getAttribute("content") || null;

    return {
      description: readMeta('meta[name="description"]'),
      og_title: readMeta('meta[property="og:title"]'),
      og_description: readMeta('meta[property="og:description"]'),
      og_type: readMeta('meta[property="og:type"]'),
      og_image: readMeta('meta[property="og:image"]'),
      robots: readMeta('meta[name="robots"]'),
      viewport: readMeta('meta[name="viewport"]')
    };
  }

  function extractBreadcrumbs() {
    const items = [];

    document
      .querySelectorAll(
        "[aria-label*='breadcrumb' i] a, .breadcrumb a, .breadcrumbs a, nav[aria-label*='breadcrumb' i] a"
      )
      .forEach((link, index) => {
        if (!window.KonseyShared.isVisible(link)) return;
        items.push({
          index,
          text: window.KonseyShared.sanitizeText(link.textContent).slice(0, 80),
          href: window.KonseyPiiSanitizer.sanitizeUrl(link.href)
        });
      });

    return items.slice(0, 15);
  }

  window.KonseyPageContext = {
    capture() {
      const platform_hints = detectPlatform();
      const url = window.KonseyPiiSanitizer.sanitizeUrl(window.location.href);

      return {
        url,
        path: window.location.pathname,
        hostname: window.location.hostname,
        is_https: window.location.protocol === "https:",
        platform_hints,
        primary_platform: platform_hints[0],
        meta: extractMeta(),
        breadcrumbs: extractBreadcrumbs(),
        document_height: Math.max(
          document.body?.scrollHeight || 0,
          document.documentElement?.scrollHeight || 0
        ),
        document_width: Math.max(
          document.body?.scrollWidth || 0,
          document.documentElement?.scrollWidth || 0
        )
      };
    }
  };
})();
