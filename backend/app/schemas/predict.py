from typing import Optional

from pydantic import BaseModel, Field


class AnomalyInput(BaseModel):
    method: str = Field(..., examples=["GET"])
    url: str = Field(..., examples=["/tienda1/index.jsp?id=3"])
    content: Optional[str] = Field(None, examples=["username=admin&password=1234"])
    content_length: Optional[int] = Field(0, examples=[68])


class SessionInput(BaseModel):
    n_clicks: int = Field(..., examples=[5])
    n_unique_items: int = Field(..., examples=[3])
    session_duration_sec: float = Field(..., examples=[320.5])
    n_special_offer_views: int = Field(0, examples=[2])
    n_brand_views: int = Field(0, examples=[1])
    n_unique_product_categories: int = Field(0, examples=[1])
    start_hour: int = Field(..., examples=[14])
    start_dayofweek: int = Field(..., examples=[2])


class AnomalyResult(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    risk_level: str


class ChurnResult(BaseModel):
    churn_risk: float
    ux_score: float
    will_churn: bool
    ux_label: str
