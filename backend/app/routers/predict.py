from fastapi import APIRouter, HTTPException

from app.schemas.predict import AnomalyInput, SessionInput
from app.services.ml_service import ml_service

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/anomaly")
def predict_anomaly(data: AnomalyInput):
    if not ml_service.ready:
        raise HTTPException(status_code=503, detail="Anomaly modeli yuklu degil")
    try:
        return ml_service.predict_anomaly(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/churn")
def predict_churn(data: SessionInput):
    if not ml_service.ready:
        raise HTTPException(status_code=503, detail="Churn modeli yuklu degil")
    try:
        return ml_service.predict_churn(data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
