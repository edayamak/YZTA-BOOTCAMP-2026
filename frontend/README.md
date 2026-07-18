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
```

## Çalıştırma

```bash
npm run dev
```

Run script'i Vite'ı sabit olarak 3000 portunda başlatır: `http://localhost:3000`

**Not:** Backend ayrı bir terminalde çalışıyor olmalı (bkz. `backend/README.md`). Backend kapalıyken dashboard "Tarama Bekleniyor..." mesajı gösterir, çökmez.

## Sayfa Akışı

- `/dashboard?capture_id=cap_abc123` parametresiyle belirli bir taramayı açar.
- Parametre verilmezse backend'deki en son capture otomatik olarak gösterilir.

## Proje yapısı

```text
frontend/
  src/
    views/
      DashboardLayout.jsx   # Sidebar, skor kartları, ajan ordusu, yol haritası sekmeleri
    components/
      AgentCards.jsx        # Persona simülasyon kartları (personas prop'u alır)
    App.jsx
    main.jsx
    index.css                # Tailwind import + global body stilleri
  postcss.config.js
  vite.config.js
  package.json
```

## Backend ↔ Frontend akışı

```text
Eklenti: Siteyi Tara
  → Backend: POST /api/analyze (capture_id üretir)
  → Kullanıcı: "Admin konsolunda incele" linkine tıklar
  → Frontend: GET /api/capture/{capture_id}
  → Dashboard: summary, ml, agent_simulation.personas render edilir
```

Backend'in tam kayıt yanıtında (`GET /api/capture/{id}`) extension payload'ı `payload` alanı altında gelir; `summary` ve `ml` ise backend'in ayrıca ürettiği özet alanlardır.

## Teknolojiler

- React 19
- Tailwind CSS v4 (`@tailwindcss/postcss` üzerinden; otomatik içerik taraması kullanılıyor)
- Vite 8
- lucide-react (ikon seti)

## Notlar

- Veri şu an sadece sayfa yüklendiğinde bir kez çekiliyor; gerçek zamanlı güncelleme (WebSocket) Sprint 3 kapsamında.
- "Canlı Akış", "Raporlar & Loglar" ve "Ayarlar" sekmeleri şu an placeholder (Sprint 3 Yol Haritası) içeriği gösteriyor, Sprint 3'te tam fonksiyonel olarak aktif edilecek.
- CatBoost modelleri backend'de yüklü değilse ML kartı bunu olduğu gibi gösterir (`models_loaded: false`), frontend tarafında ek bir işlem gerekmez.
