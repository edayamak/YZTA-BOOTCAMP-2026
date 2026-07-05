from typing import Any, Optional

from pydantic import BaseModel, Field


class ExtensionCapturePayload(BaseModel):
    capture_id: Optional[str] = None
    captured_at: Optional[str] = None
    capture_mode: Optional[str] = None
    admin_console_url: Optional[str] = None
    page: Optional[dict[str, Any]] = None
    cart: Optional[dict[str, Any]] = None
    ml_features: Optional[dict[str, Any]] = None
    analysis_lanes: Optional[dict[str, Any]] = None
    agent_simulation: Optional[dict[str, Any]] = None
    dom: Optional[dict[str, Any]] = None
    css: Optional[dict[str, Any]] = None
    ux: Optional[dict[str, Any]] = None
    contrast: Optional[dict[str, Any]] = None
    ecommerce: Optional[dict[str, Any]] = None
    viewport: Optional[dict[str, Any]] = None
    visible: Optional[dict[str, Any]] = None

    model_config = {"extra": "allow"}
