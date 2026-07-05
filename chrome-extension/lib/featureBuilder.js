(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function riskLevel(score) {
    if (score <= 33) return "low";
    if (score <= 66) return "medium";
    return "high";
  }

  function riskLabel(level) {
    return { low: "Düşük", medium: "Orta", high: "Yüksek" }[level] || "-";
  }

  function buildTrustFeatures(payload) {
    const trustSignals =
      (payload.ecommerce?.trust_signals?.length || 0) +
      (payload.visible?.trust_signals?.length || 0);
    const paymentSignals = payload.ecommerce?.payment_signals?.length || 0;
    const shippingSignals = payload.ecommerce?.shipping_signals?.length || 0;
    const reviewWidgets = payload.ecommerce?.review_widgets_detected || {};
    const reviewWidgetCount = Object.values(reviewWidgets).filter(Boolean).length;
    const sensitiveFields = payload.ux?.forms?.sensitive_fields || 0;

    return {
      ssl_rozeti_var_mi: payload.page?.is_https === true,
      guven_sinyali_sayisi: trustSignals,
      odeme_sinyali_sayisi: paymentSignals,
      kargo_sinyali_sayisi: shippingSignals,
      yorum_widget_sayisi: reviewWidgetCount,
      hassas_form_alani_sayisi: sensitiveFields,
      sosyal_kanit_sinyali_sayisi: payload.ecommerce?.social_proof_signals?.length || 0
    };
  }

  function buildUxChurnFeatures(payload) {
    const contrast = payload.contrast?.contrast_quality || "unknown";

    return {
      form_soru_sayisi: payload.ux?.forms?.non_sensitive_fields || 0,
      zorunlu_alan_sayisi: payload.ux?.forms?.required_fields || 0,
      renk_kontrasti: contrast === "good" ? "iyi" : contrast === "medium" ? "orta" : "dusuk",
      ortalama_kontrast_orani: payload.contrast?.average_contrast_ratio || null,
      dusuk_kontrast_buton_sayisi: payload.contrast?.low_contrast_count || 0,
      modal_popup_sayisi: payload.ux?.modals_and_overlays?.length || 0,
      h1_sayisi: payload.ux?.heading_hierarchy?.h1_count || 0,
      baslik_hiyerarsisi_gecerli_mi: payload.ux?.heading_hierarchy?.hierarchy_valid === true,
      gorsel_alt_orani: payload.ux?.accessibility?.image_alt_coverage_ratio || null,
      kucuk_tiklanabilir_alan_sayisi: payload.ux?.small_tap_targets?.length || 0,
      above_fold_cta_sayisi: payload.ux?.above_fold?.cta_above_fold || 0,
      sayfa_karmasikligi_skoru: payload.ux?.visual_complexity?.elements_per_viewport_k || null
    };
  }

  function buildConversionFeatures(payload) {
    return {
      sepet_urun_sayisi: payload.cart?.cart_item_count || 0,
      sepet_toplam_tl: payload.cart?.cart_total?.numeric || null,
      ucretsiz_kargo_mesaji_var_mi: payload.cart?.cart_features?.free_shipping_message === true,
      promosyon_kodu_alani_var_mi: payload.cart?.cart_features?.promo_code_available === true,
      checkout_cta_var_mi: payload.cart?.totals?.page_has_checkout_cta === true,
      gorunen_fiyat_sayisi: payload.ecommerce?.pricing?.all_visible_prices?.length || 0,
      indirim_rozeti_sayisi: payload.ecommerce?.badges?.length || 0,
      urun_listesi_sayisi: payload.ecommerce?.product_listings?.length || 0,
      aciliyet_sinyali_sayisi: payload.ecommerce?.urgency_signals?.length || 0,
      sosyal_kanit_sinyali_sayisi: payload.ecommerce?.social_proof_signals?.length || 0,
      platform: payload.page?.primary_platform || payload.page?.platform_hints?.[0] || "unknown",
      sayfa_tipi: payload.cart?.page_type || "unknown"
    };
  }

  function buildMlFeatures(payload) {
    return {
      ...buildTrustFeatures(payload),
      ...buildUxChurnFeatures(payload),
      ...buildConversionFeatures(payload)
    };
  }

  function scoreTrustLane(features) {
    let score = 45;
    const highlights = [];

    if (features.ssl_rozeti_var_mi) {
      score -= 18;
      highlights.push("HTTPS aktif");
    } else {
      score += 35;
      highlights.push("HTTPS yok — güven riski");
    }

    if (features.guven_sinyali_sayisi > 0) {
      score -= Math.min(features.guven_sinyali_sayisi * 3, 18);
      highlights.push(`${features.guven_sinyali_sayisi} güven sinyali`);
    } else {
      score += 12;
      highlights.push("Güven rozeti/mesajı zayıf");
    }

    if (features.odeme_sinyali_sayisi > 0) {
      score -= Math.min(features.odeme_sinyali_sayisi * 2, 12);
      highlights.push("Ödeme ikonları görünür");
    }

    if (features.yorum_widget_sayisi > 0) {
      score -= features.yorum_widget_sayisi * 4;
      highlights.push("Yorum widget'ı tespit edildi");
    }

    if (features.hassas_form_alani_sayisi > 0) {
      score += Math.min(features.hassas_form_alani_sayisi * 6, 24);
      highlights.push(`${features.hassas_form_alani_sayisi} hassas form alanı`);
    }

    score = clamp(Math.round(score), 0, 100);
    const level = riskLevel(score);

    return {
      lane_id: "trust",
      label: "Güven",
      model_endpoint: "/predict/anomaly",
      features,
      risk_score: score,
      risk_level: level,
      risk_label: riskLabel(level),
      highlights: highlights.slice(0, 4)
    };
  }

  function scoreUxChurnLane(features) {
    let score = 18;
    const highlights = [];

    if (features.renk_kontrasti === "dusuk") {
      score += 32;
      highlights.push("Düşük renk kontrastı");
    } else if (features.renk_kontrasti === "orta") {
      score += 14;
      highlights.push("Orta kontrast");
    } else if (features.renk_kontrasti === "iyi") {
      highlights.push("Kontrast iyi");
    }

    if (features.dusuk_kontrast_buton_sayisi > 0) {
      score += Math.min(features.dusuk_kontrast_buton_sayisi * 2, 18);
    }

    if (features.modal_popup_sayisi > 0) {
      score += Math.min(features.modal_popup_sayisi * 5, 25);
      highlights.push(`${features.modal_popup_sayisi} modal/popup`);
    }

    if (!features.baslik_hiyerarsisi_gecerli_mi) {
      score += 12;
      highlights.push("Başlık hiyerarşisi bozuk");
    }

    if (features.kucuk_tiklanabilir_alan_sayisi > 0) {
      score += Math.min(features.kucuk_tiklanabilir_alan_sayisi * 3, 18);
      highlights.push("Küçük tıklanabilir alanlar");
    }

    if (features.sayfa_karmasikligi_skoru && features.sayfa_karmasikligi_skoru > 5) {
      score += 16;
      highlights.push("Yüksek görsel karmaşıklık");
    }

    if (features.form_soru_sayisi > 8) {
      score += 10;
      highlights.push("Uzun form — sürtünme riski");
    }

    score = clamp(Math.round(score), 0, 100);
    const level = riskLevel(score);

    return {
      lane_id: "ux_churn",
      label: "UX / Churn",
      model_endpoint: "/predict/churn",
      features,
      risk_score: score,
      risk_level: level,
      risk_label: riskLabel(level),
      highlights: highlights.slice(0, 4)
    };
  }

  function scoreConversionLane(features) {
    let score = 28;
    const highlights = [];
    const pageType = features.sayfa_tipi || "unknown";

    if (features.checkout_cta_var_mi) {
      score -= 16;
      highlights.push("Checkout CTA mevcut");
    } else if (pageType === "cart" || pageType === "checkout") {
      score += 28;
      highlights.push("Checkout CTA eksik");
    }

    if (features.gorunen_fiyat_sayisi === 0 && features.urun_listesi_sayisi > 0) {
      score += 22;
      highlights.push("Fiyat görünürlüğü zayıf");
    } else if (features.gorunen_fiyat_sayisi > 0) {
      score -= 8;
    }

    if (features.ucretsiz_kargo_mesaji_var_mi) {
      score -= 10;
      highlights.push("Ücretsiz kargo mesajı var");
    } else if (pageType === "cart") {
      score += 8;
    }

    if (features.sepet_urun_sayisi > 0) {
      score -= 6;
      highlights.push(`${features.sepet_urun_sayisi} ürünlü sepet`);
    }

    if (features.indirim_rozeti_sayisi > 0) {
      score -= Math.min(features.indirim_rozeti_sayisi * 2, 8);
    }

    if (features.sosyal_kanit_sinyali_sayisi === 0 && features.urun_listesi_sayisi > 0) {
      score += 8;
    }

    score = clamp(Math.round(score), 0, 100);
    const level = riskLevel(score);

    return {
      lane_id: "conversion",
      label: "Satış Hunisi",
      model_endpoint: null,
      features,
      risk_score: score,
      risk_level: level,
      risk_label: riskLabel(level),
      highlights: highlights.slice(0, 4)
    };
  }

  function buildAnalysisLanes(payload) {
    const trust = scoreTrustLane(buildTrustFeatures(payload));
    const uxChurn = scoreUxChurnLane(buildUxChurnFeatures(payload));
    const conversion = scoreConversionLane(buildConversionFeatures(payload));
    const lanes = [trust, uxChurn, conversion];
    const scores = lanes.map((lane) => lane.risk_score);
    const overall = clamp(Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length), 0, 100);

    return {
      version: 1,
      overall_risk_score: overall,
      overall_risk_level: riskLevel(overall),
      overall_risk_label: riskLabel(riskLevel(overall)),
      lanes: {
        trust,
        ux_churn: uxChurn,
        conversion
      }
    };
  }

  function enrichLanesWithPersonas(analysisLanes, simulation) {
    if (!analysisLanes?.lanes || !simulation?.personas) return analysisLanes;

    const lanePersonaMap = {
      trust: [],
      ux_churn: [],
      conversion: []
    };

    simulation.personas.forEach((persona) => {
      const laneKey = persona.lane;
      if (!lanePersonaMap[laneKey]) return;
      lanePersonaMap[laneKey].push({
        id: persona.id,
        label: persona.label,
        would_abandon: persona.would_abandon,
        friction_score: persona.friction_score,
        finding_count: persona.findings.length
      });
    });

    Object.keys(lanePersonaMap).forEach((key) => {
      const lane = analysisLanes.lanes[key];
      if (!lane) return;
      lane.persona_signals = lanePersonaMap[key];
    });

    return analysisLanes;
  }

  window.KonseyFeatureBuilder = {
    buildTrustFeatures,
    buildUxChurnFeatures,
    buildConversionFeatures,
    buildMlFeatures,
    buildAnalysisLanes,
    enrichLanesWithPersonas,
    build(payload) {
      return {
        ml_features: buildMlFeatures(payload),
        analysis_lanes: buildAnalysisLanes(payload)
      };
    }
  };
})();
