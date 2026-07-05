(function () {
  const TARGET_SELECTOR =
    "button, a, [role='button'], input[type='submit'], h1, h2, h3, label, .btn";

  function analyzeElement(el) {
    const computed = window.getComputedStyle(el);
    const color = computed.color;
    const backgroundColor = computed.backgroundColor;
    const ratio = window.KonseyShared.contrastRatio(color, backgroundColor);

    return {
      tag: el.tagName.toLowerCase(),
      text: window.KonseyShared.sanitizeText(el.textContent).slice(0, 80),
      color,
      backgroundColor,
      contrast_ratio: ratio ? Number(ratio.toFixed(2)) : null,
      passes_wcag_aa: ratio ? ratio >= 4.5 : null,
      classes: el.className ? String(el.className).split(/\s+/).slice(0, 5) : []
    };
  }

  window.KonseyContrastAnalyzer = {
    capture() {
      const samples = [];
      const lowContrast = [];
      const seen = new Set();

      document.querySelectorAll(TARGET_SELECTOR).forEach((el) => {
        if (samples.length >= 50) return;
        if (!window.KonseyShared.isVisible(el)) return;

        const key = `${el.tagName}:${el.className}:${el.textContent?.slice(0, 20)}`;
        if (seen.has(key)) return;
        seen.add(key);

        const result = analyzeElement(el);
        samples.push(result);

        if (result.contrast_ratio !== null && result.contrast_ratio < 4.5) {
          lowContrast.push(result);
        }
      });

      const ratios = samples
        .map((item) => item.contrast_ratio)
        .filter((value) => value !== null);

      const average =
        ratios.length > 0
          ? Number((ratios.reduce((sum, value) => sum + value, 0) / ratios.length).toFixed(2))
          : null;

      return {
        sample_count: samples.length,
        average_contrast_ratio: average,
        low_contrast_count: lowContrast.length,
        contrast_quality:
          average === null ? "unknown" : average >= 4.5 ? "good" : average >= 3 ? "medium" : "low",
        low_contrast_samples: lowContrast.slice(0, 15),
        samples: samples.slice(0, 25)
      };
    }
  };
})();
