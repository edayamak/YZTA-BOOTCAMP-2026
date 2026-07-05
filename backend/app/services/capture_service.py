from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from app.schemas.analyze import AnalyzeMlBridge, AnalyzeSummary
from app.schemas.extension import ExtensionCapturePayload
from app.schemas.predict import AnomalyInput, SessionInput
from app.services.ml_service import ml_service


class CaptureStore:
    def __init__(self) -> None:
        self._records: dict[str, dict[str, Any]] = {}

    def save(self, capture_id: str, record: dict[str, Any]) -> None:
        self._records[capture_id] = record

    def get(self, capture_id: str) -> Optional[dict[str, Any]]:
        return self._records.get(capture_id)

    def list_ids(self) -> list[str]:
        return list(self._records.keys())


capture_store = CaptureStore()


def _parse_hour(captured_at: Optional[str]) -> int:
    if not captured_at:
        return datetime.utcnow().hour
    try:
        return datetime.fromisoformat(captured_at.replace("Z", "+00:00")).hour
    except ValueError:
        return datetime.utcnow().hour


def build_summary(payload: ExtensionCapturePayload) -> AnalyzeSummary:
    lanes = payload.analysis_lanes or {}
    agent = payload.agent_simulation or {}
    aggregate = agent.get("aggregate") or {}
    page = payload.page or {}
    cart = payload.cart or {}
    features = payload.ml_features or {}

    return AnalyzeSummary(
        url=page.get("url"),
        hostname=page.get("hostname"),
        platform=page.get("primary_platform") or features.get("platform"),
        page_type=cart.get("page_type") or features.get("sayfa_tipi"),
        overall_risk_score=lanes.get("overall_risk_score"),
        overall_risk_level=lanes.get("overall_risk_level"),
        agent_findings=int(aggregate.get("total_findings") or 0),
        any_would_abandon=bool(aggregate.get("any_would_abandon")),
    )


def extension_to_anomaly_input(payload: ExtensionCapturePayload) -> AnomalyInput:
    page = payload.page or {}
    dom = payload.dom or {}
    ux = payload.ux or {}
    forms = ux.get("forms") or {}

    synthetic_content = f"fields={forms.get('total_visible_fields', 0)};required={forms.get('required_fields', 0)}"

    return AnomalyInput(
        method="GET",
        url=str(page.get("url") or page.get("path") or "/"),
        content=synthetic_content,
        content_length=int(dom.get("html_length") or 0),
    )


def extension_to_session_input(payload: ExtensionCapturePayload) -> SessionInput:
    cart = payload.cart or {}
    ecommerce = payload.ecommerce or {}
    ux = payload.ux or {}
    agent = payload.agent_simulation or {}
    personas = agent.get("personas") or []

    event_count = sum(len(persona.get("events") or []) for persona in personas)
    friction = max((persona.get("friction_score") or 0) for persona in personas) if personas else 30

    return SessionInput(
        n_clicks=max(event_count, 1),
        n_unique_items=max(int(cart.get("cart_item_count") or 0), len(ecommerce.get("product_listings") or []), 1),
        session_duration_sec=float(max(friction, 10)) * 2.5,
        n_special_offer_views=len(ecommerce.get("urgency_signals") or []),
        n_brand_views=len(ecommerce.get("badges") or []),
        n_unique_product_categories=len(ecommerce.get("product_listings") or []),
        start_hour=_parse_hour(payload.captured_at),
        start_dayofweek=datetime.utcnow().weekday(),
    )


def run_ml_bridge(payload: ExtensionCapturePayload) -> AnalyzeMlBridge:
    if not ml_service.ready:
        return AnalyzeMlBridge(
            models_loaded=False,
            note="CatBoost modelleri yuklenmedi. backend/models/*.cbm dosyalarini ekleyin.",
        )

    try:
        anomaly = ml_service.predict_anomaly(extension_to_anomaly_input(payload))
        churn = ml_service.predict_churn(extension_to_session_input(payload))
        return AnalyzeMlBridge(models_loaded=True, anomaly=anomaly, churn=churn)
    except Exception as exc:
        return AnalyzeMlBridge(models_loaded=True, note=f"ML tahmin hatasi: {exc}")


def ingest_extension_payload(payload: ExtensionCapturePayload) -> dict[str, Any]:
    capture_id = payload.capture_id or f"cap_{uuid4().hex[:12]}"
    received_at = datetime.utcnow().isoformat() + "Z"
    summary = build_summary(payload)
    ml = run_ml_bridge(payload)

    stored_payload = payload.model_dump(mode="json")
    stored_payload["capture_id"] = capture_id

    record = {
        "capture_id": capture_id,
        "received_at": received_at,
        "summary": summary.model_dump(),
        "ml": ml.model_dump(),
        "payload": stored_payload,
    }
    capture_store.save(capture_id, record)
    return record
