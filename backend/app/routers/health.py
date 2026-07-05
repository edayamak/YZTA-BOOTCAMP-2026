from fastapi import APIRouter

from app.services.ml_service import ml_service

router = APIRouter(tags=["health"])


@router.get("/")
def root():
    return {
        "status": "AgenticQA backend calisiyor",
        "version": "1.0.0",
        "models_loaded": ml_service.ready,
    }


@router.get("/health")
def health():
    return {"status": "ok", "models_loaded": ml_service.ready}
