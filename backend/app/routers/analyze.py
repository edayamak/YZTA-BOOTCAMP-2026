from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.schemas.analyze import AnalyzeResponse, CaptureRecordResponse
from app.schemas.extension import ExtensionCapturePayload
from app.services.capture_service import capture_store, ingest_extension_payload
from app.services.ws_manager import manager

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_extension(payload: ExtensionCapturePayload):
    record = ingest_extension_payload(payload)
    capture_id = record["capture_id"]

    await manager.broadcast({"type": "new_capture", "capture": record})

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


@router.websocket("/ws/captures")
async def captures_ws(websocket: WebSocket):
    """Yeni bir /api/analyze isteği geldiğinde bağlı istemcilere anlık olarak
    {"type": "new_capture", "capture": {...}} mesajı yayınlar."""
    await manager.connect(websocket)
    try:
        while True:
            # İstemciden veri beklemiyoruz, sadece bağlantıyı canlı tutuyoruz;
            # istemci kapatınca WebSocketDisconnect fırlar.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)