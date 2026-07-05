(function () {
  const SKIP_TAGS = new Set(["SCRIPT", "NOSCRIPT", "IFRAME"]);
  const HTML_CAP = 1_500_000;

  function cloneWithoutScripts(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const clone = node.cloneNode(false);
      if (window.KonseyPiiSanitizer) {
        clone.textContent = window.KonseyPiiSanitizer.redactText(clone.textContent);
      }
      return clone;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    if (SKIP_TAGS.has(node.tagName)) return null;

    const clone = node.cloneNode(false);

    for (const attr of node.attributes) {
      if (attr.name.startsWith("on")) continue;
      if (attr.name === "value") continue;
      clone.setAttribute(attr.name, attr.value);
    }

    if (
      (clone.tagName === "INPUT" || clone.tagName === "TEXTAREA") &&
      window.KonseyPiiSanitizer?.isSensitiveField(node)
    ) {
      clone.setAttribute("value", "[REDACTED]");
    }

    for (const child of node.childNodes) {
      const clonedChild = cloneWithoutScripts(child);
      if (clonedChild) clone.appendChild(clonedChild);
    }

    return clone;
  }

  function stripScriptsFast(html) {
    return html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  }

  function summarizeDom(root) {
    const tags = {};
    const forms = [];
    const buttons = [];
    const inputs = [];
    const images = [];
    const links = [];
    const all = root.getElementsByTagName("*");
    const total = all.length;

    for (let i = 0; i < total; i += 1) {
      tags[all[i].tagName] = (tags[all[i].tagName] || 0) + 1;
    }

    root.querySelectorAll("form").forEach((form, index) => {
      if (index >= 20) return;
      forms.push({
        index,
        id: form.id || null,
        action: form.getAttribute("action"),
        method: form.getAttribute("method") || "get",
        input_count: form.querySelectorAll("input, select, textarea").length
      });
    });

    root.querySelectorAll("button, [role='button'], input[type='submit']").forEach((btn, index) => {
      if (index >= 30) return;
      buttons.push({
        index,
        tag: btn.tagName.toLowerCase(),
        text: (btn.textContent || btn.value || "").trim().slice(0, 120),
        id: btn.id || null,
        classes: btn.className ? String(btn.className).split(/\s+/).slice(0, 8) : []
      });
    });

    root.querySelectorAll("input, select, textarea").forEach((input, index) => {
      if (index >= 40) return;
      const sensitive = window.KonseyPiiSanitizer?.isSensitiveField(input) || false;
      inputs.push({
        index,
        type: input.type || input.tagName.toLowerCase(),
        name: sensitive ? "[REDACTED_FIELD]" : input.name || null,
        placeholder: sensitive ? null : input.placeholder || null,
        required: input.required || false,
        sensitive
      });
    });

    root.querySelectorAll("img").forEach((img, index) => {
      if (index >= 20) return;
      images.push({
        index,
        alt: img.alt || null,
        src: img.currentSrc || img.src || null
      });
    });

    root.querySelectorAll("a[href]").forEach((link, index) => {
      if (index >= 30) return;
      links.push({
        index,
        text: (link.textContent || "").trim().slice(0, 80),
        href: link.href
      });
    });

    return {
      element_counts: tags,
      total_elements: total,
      form_count: forms.length,
      button_count: buttons.length,
      input_count: inputs.length,
      image_count: images.length,
      link_count: links.length,
      forms,
      buttons,
      inputs,
      images,
      links
    };
  }

  function captureHtmlHeavy() {
    const rawLength = document.documentElement.outerHTML.length;
    let html;

    if (rawLength > 400_000) {
      html = stripScriptsFast(document.documentElement.outerHTML);
    } else {
      const clone = cloneWithoutScripts(document.documentElement);
      html = clone ? clone.outerHTML : document.documentElement.outerHTML;
    }

    let truncated = false;
    if (html.length > HTML_CAP) {
      html = `${html.slice(0, HTML_CAP)}\n<!-- Konsey AI: DOM ${HTML_CAP} karakterde kesildi -->`;
      truncated = true;
    }

    return { html, html_length: html.length, truncated, raw_length: rawLength };
  }

  window.KonseyDomCapture = {
    captureSummary() {
      return {
        html: null,
        html_length: document.documentElement.outerHTML.length,
        summary: summarizeDom(document),
        deferred: true
      };
    },
    captureHeavy() {
      const htmlData = captureHtmlHeavy();
      const total = document.getElementsByTagName("*").length;
      const summary =
        total > 8000 ? { total_elements: total, deferred: true } : summarizeDom(document);

      return {
        html: htmlData.html,
        html_length: htmlData.html_length,
        truncated: htmlData.truncated,
        raw_length: htmlData.raw_length,
        summary
      };
    },
    capture() {
      return this.captureHeavy();
    }
  };
})();
