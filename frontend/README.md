AgenticQA Frontend
Backend'in sakladığı tarama kayıtlarını okuyup admin konsolunda gösteren React + Tailwind arayüzü.

Ne yapar?
Katman	Görev
Capture görüntüleme	GET /api/capture/{id} — tek bir taramanın tam kaydını çeker, dashboard'da render eder
Capture listeleme	GET /api/captures — capture_id URL'de yoksa en son yapılan taramayı otomatik gösterir
Persona kartları	agent_simulation.personas verisini (Aceleci Alışverişçi, Erişilebilirlik Hassas Kullanıcı, Kötü Niyetli Saldırgan) kart olarak render eder
Risk/ML özeti	summary ve ml alanlarındaki risk skoru, risk seviyesi, ML model durumu bilgilerini gösterir

Frontend varsayılan olarak http://127.0.0.1:8000 adresindeki backend'e istek atar.

Kurulum
cd frontend
npm install

Çalıştırma
npm run dev

run script'i Vite'ı sabit olarak 3000 portunda başlatır: http://localhost:3000

Backend ayrı bir terminalde çalışıyor olmalı (bkz. backend/README.md). Backend kapalıyken dashboard "Tarama Bekleniyor..." mesajı ve bir hata bandı gösterir, çökmez.

Sayfa
/dashboard?capture_id=cap_abc123
capture_id URL parametresiyle belirli bir taramayı açar. Parametre verilmezse backend'deki en son capture otomatik gösterilir.

Proje yapısı
frontend/
  src/
    views/
      DashboardLayout.jsx   # Sidebar, skor kartları, ajan ordusu, yol haritası sekmeleri
    components/
      AgentCards.jsx        # Persona simülasyon kartları (personas prop'u alır, yeniden kullanılabilir)
    App.jsx
    main.jsx
    index.css                # Tailwind import + global body stilleri
  postcss.config.js
  vite.config.js
  package.json

Backend ↔ Frontend akışı
Eklenti: Siteyi Tara
  → Backend: POST /api/analyze, capture_id üretir
  → Kullanıcı: "Admin konsolunda incele" linkine tıklar
  → Frontend: GET /api/capture/{capture_id}
  → Dashboard: summary, ml, agent_simulation.personas render edilir

Backend'in tam kayıt yanıtında (GET /api/capture/{id}) extension payload'ı (page, cart, dom, css, agent_simulation, ml_features...) payload alanı altında gelir; summary ve ml ise backend'in ayrıca ürettiği özet alanlardır.

Teknoloji
React 19
Tailwind CSS v4 (@tailwindcss/postcss üzerinden; tailwind.config.js yok, otomatik içerik taraması kullanılıyor)
Vite 8
lucide-react (ikonlar)

Notlar
Veri şu an sadece sayfa yüklendiğinde bir kez çekiliyor; gerçek zamanlı güncelleme (WebSocket) Sprint 3 kapsamında.
"Canlı Akış", "Raporlar & Loglar" ve "Ayarlar" sekmeleri şu an placeholder içerik gösteriyor, Sprint 3'te aktif edilecek.
CatBoost modelleri backend'de yüklü değilse ML kartı bunu olduğu gibi gösterir (models_loaded: false), frontend tarafında ek bir işlem gerekmez.