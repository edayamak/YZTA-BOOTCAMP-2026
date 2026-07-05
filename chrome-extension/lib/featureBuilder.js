(function () {
  function buildMlFeatures(payload) {
    const contrast = payload.contrast?.contrast_quality || "unknown";
    const trustCount =
      (payload.ecommerce?.trust_signals?.length || 0) +
      (payload.ecommerce?.shipping_signals?.length || 0);
    const formFields = payload.ux?.forms?.non_sensitive_fields || 0;

    return {
      form_soru_sayisi: formFields,
      zorunlu_alan_sayisi: payload.ux?.forms?.required_fields || 0,
      renk_kontrasti: contrast === "good" ? "iyi" : contrast === "medium" ? "orta" : "dusuk",
      ortalama_kontrast_orani: payload.contrast?.average_contrast_ratio || null,
      dusuk_kontrast_buton_sayisi: payload.contrast?.low_contrast_count || 0,
      ssl_rozeti_var_mi: payload.page?.is_https === true,
      guven_sinyali_sayisi: trustCount,
      sepet_urun_sayisi: payload.cart?.cart_item_count || 0,
      sepet_toplam_tl: payload.cart?.cart_total?.numeric || null,
      ucretsiz_kargo_mesaji_var_mi: payload.cart?.cart_features?.free_shipping_message === true,
      promosyon_kodu_alani_var_mi: payload.cart?.cart_features?.promo_code_available === true,
      checkout_cta_var_mi: payload.cart?.totals?.page_has_checkout_cta === true,
      gorunen_fiyat_sayisi: payload.ecommerce?.pricing?.all_visible_prices?.length || 0,
      indirim_rozeti_sayisi: payload.ecommerce?.badges?.length || 0,
      urun_listesi_sayisi: payload.ecommerce?.product_listings?.length || 0,
      modal_popup_sayisi: payload.ux?.modals_and_overlays?.length || 0,
      h1_sayisi: payload.ux?.heading_hierarchy?.h1_count || 0,
      baslik_hiyerarsisi_gecerli_mi: payload.ux?.heading_hierarchy?.hierarchy_valid === true,
      gorsel_alt_orani: payload.ux?.accessibility?.image_alt_coverage_ratio || null,
      kucuk_tiklanabilir_alan_sayisi: payload.ux?.small_tap_targets?.length || 0,
      above_fold_cta_sayisi: payload.ux?.above_fold?.cta_above_fold || 0,
      sayfa_karmasikligi_skoru: payload.ux?.visual_complexity?.elements_per_viewport_k || null,
      platform: payload.page?.primary_platform || payload.page?.platform_hints?.[0] || "unknown",
      sayfa_tipi: payload.cart?.page_type || "unknown"
    };
  }

  window.KonseyFeatureBuilder = {
    build(payload) {
      return buildMlFeatures(payload);
    }
  };
})();
