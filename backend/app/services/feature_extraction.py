import re

from app.schemas.predict import AnomalyInput, SessionInput


def extract_anomaly_features(data: AnomalyInput) -> list[float]:
    url = str(data.url)
    content = str(data.content) if data.content else ""
    url_length = len(url)
    url_param_count = url.count("&") + (1 if "?" in url else 0)
    url_special_char_count = len(re.findall(r"[<>'\";=\-\-]", url))
    content_special_char_count = len(re.findall(r"[<>'\";=\-\-]", content))
    url_digit_ratio = sum(c.isdigit() for c in url) / max(len(url), 1)
    url_has_sql = int(bool(re.search(r"select|union|insert|drop|--|%27|or 1=1|and 1=1", url, re.I)))
    url_has_script = int(
        bool(re.search(r"script|%3c|%3e|javascript:|onerror=|onload=|alert\(|iframe", url, re.I))
    )
    url_path_depth = url.split("?")[0].count("/")
    has_content = int(bool(data.content))
    content_length = len(content)
    content_param_count = content.count("&") + has_content
    method_get = int(data.method.upper() == "GET")
    method_post = int(data.method.upper() == "POST")
    method_put = int(data.method.upper() == "PUT")
    header_content_length = float(data.content_length or 0)
    return [
        url_length,
        url_param_count,
        url_special_char_count,
        url_digit_ratio,
        url_has_sql,
        url_has_script,
        url_path_depth,
        has_content,
        content_length,
        content_param_count,
        content_special_char_count,
        method_get,
        method_post,
        method_put,
        header_content_length,
    ]


def extract_churn_features(data: SessionInput) -> list[float]:
    avg_time = data.session_duration_sec / max(data.n_clicks, 1)
    repeat_click_ratio = max(0, 1 - data.n_unique_items / max(data.n_clicks, 1))
    special_offer_ratio = data.n_special_offer_views / max(data.n_clicks, 1)
    return [
        data.n_clicks,
        data.n_unique_items,
        data.n_special_offer_views,
        data.n_brand_views,
        data.session_duration_sec,
        avg_time,
        repeat_click_ratio,
        special_offer_ratio,
        data.start_hour,
        data.start_dayofweek,
        data.n_unique_product_categories,
    ]
