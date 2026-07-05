# AgenticQA Backend

Chrome eklentisinden gelen tarama verisini alan ve CatBoost tahmin modellerini sunan FastAPI servisi.

## Ne yapar?

| Katman | Görev |
|--------|--------|
| **Extension intake** | `POST /api/analyze` — eklenti payload'ını alır, `capture_id` üretir |
| **Capture store** | Taramayı bellekte saklar (admin/dashboard için) |
| **ML API** | `POST /predict/anomaly`, `POST /predict/churn` — Sprint 1 CatBoost modelleri |

Eklenti varsayılan olarak `http://localhost:8000/api/analyze` adresine POST atar.

## Kurulum

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

CatBoost model dosyalarını `models/` klasörüne koy:

```
backend/models/
  anomaly_model.cbm
  churn_model.cbm
```

Modeller yoksa servis yine ayağa kalkar; extension verisi alınır, ML skoru boş döner.

## Çalıştırma

```bash
./run.sh
```

`run.sh` sadece `app/` klasörünü izler; `.venv` yüzünden reload döngüsüne girmez.

Elle başlatmak için:

```bash
uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8000
```

Sağlık kontrolü: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)  
Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## API özeti

### Extension

**`POST /api/analyze`**

Eklentinin gönderdiği JSON (page, cart, dom, css, analysis_lanes, agent_simulation, ml_features …).

Örnek yanıt:

```json
{
  "status": "received",
  "message": "Extension verisi alindi",
  "capture_id": "cap_abc123",
  "summary": {
    "url": "https://magaza.example.com/cart",
    "platform": "shopify",
    "overall_risk_score": 36
  },
  "ml": {
    "models_loaded": true,
    "anomaly": { "anomaly_score": 0.12, "risk_level": "LOW" },
    "churn": { "churn_risk": 0.41, "ux_score": 59.0, "ux_label": "ORTA" }
  },
  "links": {
    "capture": "/api/capture/cap_abc123"
  }
}
```

**`GET /api/capture/{capture_id}`** — Admin konsolunun okuyacağı tam kayıt.

**`GET /api/captures`** — Kayıtlı tarama ID listesi (geliştirme).

### ML (doğrudan)

**`POST /predict/anomaly`**

```json
{
  "method": "GET",
  "url": "/checkout?id=1",
  "content": null,
  "content_length": 0
}
```

**`POST /predict/churn`**

```json
{
  "n_clicks": 5,
  "n_unique_items": 3,
  "session_duration_sec": 320.5,
  "start_hour": 14,
  "start_dayofweek": 2
}
```

## Proje yapısı

```
backend/
  app/
    main.py              # FastAPI app, CORS
    routers/
      analyze.py         # /api/analyze, /api/capture/*
      predict.py         # /predict/*
      health.py          # /, /health
    services/
      capture_service.py # Extension intake + ML köprüsü
      ml_service.py      # Model yükleme / tahmin
      feature_extraction.py
    schemas/
  models/                # *.cbm dosyaları (git'e eklenmez)
  run.sh
  requirements.txt
```

## Extension ↔ Backend akışı

```
Eklenti: Siteyi Tara
  → POST /api/analyze (capture_id ile)
  → Backend: kaydet + ML köprüsü
  → Kullanıcı: Admin konsolunda incele (GET /api/capture/{id})
```

Extension payload'ı, CatBoost giriş formatına `capture_service` içinde map edilir. Ham `ml_features` doğrudan modele verilmez.

## Notlar

- Capture store şu an **bellek içi**; sunucu kapanınca silinir. Kalıcı depo (PostgreSQL/Supabase) sonraki sprint.
- CORS tüm origin'lere açık (geliştirme). Production'da kısıtlanmalı.
