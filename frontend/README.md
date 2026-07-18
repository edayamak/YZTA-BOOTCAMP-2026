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

Çalıştırma
Bash
npm run dev
Run script'i Vite'ı sabit olarak 3000 portunda başlatır: http://localhost:3000

Not: Backend ayrı bir terminalde çalışıyor olmalı (bkz. backend/README.md). Backend kapalıyken dashboard "Tarama Bekleniyor..." mesajı gösterir, çökmez.

Sayfa Akışı
/dashboard?capture_id=cap_abc123 parametresiyle belirli bir taramayı açar.

Parametre verilmezse backend'deki en son capture otomatik olarak gösterilir.

Proje Yapısı
Plaintext
frontend/
  ├── src/
  │    ├── views/
  │    │    └── DashboardLayout.jsx   # Sidebar, skor kartları, ajan ordusu, yol haritası sekmeleri
  │    ├── components/
  │    │    └── AgentCards.jsx        # Persona simülasyon kartları (personas prop'u alır)
  │    ├── App.jsx
  │    ├── main.jsx
  │    └── index.css                  # Tailwind import + global body stilleri
  ├── postcss.config.js
  ├── vite.config.js
  └── package.json
