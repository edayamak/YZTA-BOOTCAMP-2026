from fastapi import APIRouter, HTTPException

from app.schemas.analyze import AnalyzeResponse, CaptureRecordResponse
from app.schemas.extension import ExtensionCapturePayload
from app.services.capture_service import capture_store, ingest_extension_payload

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_extension(payload: ExtensionCapturePayload):
    record = ingest_extension_payload(payload)
    capture_id = record["capture_id"]

    return AnalyzeResponse(
        status="received",
        message="Extension verisi alindi",
        capture_id=capture_id,
        received_at=record["received_at"],
        summary=record["summary"],
        ml=record["ml"],
        links={
            "capture": f"/api/capture/{capture_id}",
            "predict_anomaly": "/predict/anomaly",
            "predict_churn": "/predict/churn",
        },
    )


@router.get("/capture/{capture_id}", response_model=CaptureRecordResponse)
def get_capture(capture_id: str):
    record = capture_store.get(capture_id)
    if not record:
        raise HTTPException(status_code=404, detail="Capture bulunamadi")
    return CaptureRecordResponse(**record)


@router.get("/captures")
def list_captures():
    return {"count": len(capture_store.list_ids()), "capture_ids": capture_store.list_ids()}
