from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

API_PREFIX = "/api"
CORS_ORIGINS = [
    "http://localhost:3000",
    "chrome-extension://*",
]
