(function () {
  function walkShadowRoots(root, visitor, depth = 0) {
    if (!root || depth > 8) return;

    visitor(root, depth);

    const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];
    elements.forEach((el) => {
      if (el.shadowRoot) {
        walkShadowRoots(el.shadowRoot, visitor, depth + 1);
      }
    });
  }

  function queryDeep(selector, root = document) {
    const results = [];

    walkShadowRoots(root, (node) => {
      if (!node.querySelectorAll) return;
      node.querySelectorAll(selector).forEach((el) => results.push(el));
    });

    return results;
  }

  function queryDeepFirst(selector, root = document) {
    let found = null;

    walkShadowRoots(root, (node) => {
      if (found || !node.querySelector) return;
      found = node.querySelector(selector) || found;
    });

    return found;
  }

  function getDeepText(root = document, limit = 5000) {
    const chunks = [];

    walkShadowRoots(root, (node) => {
      if (chunks.join(" ").length >= limit) return;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (text) chunks.push(text);
      }
    });

    return chunks.join(" ").slice(0, limit);
  }

  window.KonseyShadowDom = {
    queryDeep,
    queryDeepFirst,
    getDeepText,
    walkShadowRoots
  };
})();
