from typing import Any, Optional

from pydantic import BaseModel

from app.schemas.predict import AnomalyResult, ChurnResult


class AnalyzeSummary(BaseModel):
    url: Optional[str] = None
    hostname: Optional[str] = None
    platform: Optional[str] = None
    page_type: Optional[str] = None
    overall_risk_score: Optional[int] = None
    overall_risk_level: Optional[str] = None
    agent_findings: int = 0
    any_would_abandon: bool = False


class AnalyzeMlBridge(BaseModel):
    models_loaded: bool
    anomaly: Optional[AnomalyResult] = None
    churn: Optional[ChurnResult] = None
    note: Optional[str] = None


class AnalyzeResponse(BaseModel):
    status: str
    message: str
    capture_id: str
    received_at: str
    summary: AnalyzeSummary
    ml: AnalyzeMlBridge
    links: dict[str, str]


class CaptureRecordResponse(BaseModel):
    capture_id: str
    received_at: str
    summary: AnalyzeSummary
    ml: AnalyzeMlBridge
    payload: dict[str, Any]
