# AgenticQA Frontend

Backend'in sakladığı tarama kayıtlarını okuyup admin konsolunda gösteren React + Tailwind CSS arayüzü.

## Ne yapar?

| Katman | Görev |
| :--- | :--- |
| **Capture görüntüleme** | `GET /api/capture/{id}` — Tek bir taramanın tam kaydını çeker, dashboard'da render eder. |
| **Capture listeleme** | `GET /api/captures` — URL'de `capture_id` yoksa en son yapılan taramayı otomatik gösterir. |
| **Persona kartları** | `agent_simulation.personas` verisini (Aceleci Alışverişçi vb.) kart olarak render eder. |
| **Risk/ML özeti** | `summary` ve `ml` alanlarındaki risk skoru, risk seviyesi, ML model durumu bilgilerini gösterir. |

Frontend varsayılan olarak `http://127.0.0.1:8000` adresindeki backend'e istek atar.

## Kurulum

```bash
cd frontend
npm install

## Çalıştırma
