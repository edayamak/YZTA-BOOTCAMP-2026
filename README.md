# YZTA-BOOTCAMP-2026
# **Takım İsmi**

[TAKIM 38]

# Ürün İle İlgili Bilgiler

## Takım Elemanları

* Serenay Nebahat Duran: Product Owner
* Burak Arabacıoğlu: Scrum Master
* Eda Yamak: Team Member/Developer
* Hilal Hanım Keskin: Team Member/Developer
* Ömer Faruk Keskin: Team Member/Developer

## Ürün İsmi

AgenticQA

## Ürün Açıklaması

AgenticQA, e-ticaret sayfalarındaki UX hatalarını, güven sinyali eksiklerini ve sepet terk (churn) riskini tespit eden B2B SaaS platformudur.

Sistem üç katmandan oluşur:

1. **Chrome eklentisi** — Mağaza sayfasını tarar; canlı HTML, CSS, sepet ve metrikleri toplar.
2. **Backend (FastAPI + CatBoost)** — Eklenti verisini alır, `capture_id` üretir, ML skoru hesaplar.
3. **Admin konsol** *(yol haritası)* — Detaylı analiz, AI konsey yorumu ve HTML/CSS düzeltme önerileri burada sunulur.

Mağaza sahibi sitedeyken eklentide **Siteyi Tara** der. Popup yalnızca kısa özet gösterir (site, ön risk, paket boyutu); asıl inceleme admin konsolunda yapılır. JavaScript kaynak kodu okunmaz; kişisel veri toplanmaz.

Toplanan veri üç **analiz hattına** ayrılır: **Güven**, **UX / Churn**, **Satış Hunisi**. Her hat için risk skoru üretilir (0 = iyi, 100 = kötü). Persona simülasyonu (Aceleci Alışverişçi, Erişilebilirlik Hassas Kullanıcı, Güven senaryosu) extension tarafında davranış logu olarak kaydedilir; tam AI konsey yorumu admin katmanında çalışacaktır.

## Ürün Özellikleri

* **Sıfır kod entegrasyonu:** Mağaza koduna dokunmadan Chrome eklentisi ile tek tıkla tarama; popup kapansa bile arka planda DOM/CSS toplama devam eder.
* **Üç analiz hattı:** Güven, UX/Churn ve Satış Hunisi için ayrı feature set, risk skoru ve tespit özeti.
* **Persona simülasyonu:** Üç kullanıcı senaryosu extension payload'ına `agent_simulation` olarak eklenir; backend ve admin konsol bu veriyi kullanır.
* **Canlı DOM & CSS yakalama:** Render edilmiş sayfa iskeleti, kontrast, sepet, e-ticaret sinyalleri (kargo, ödeme, sosyal kanıt) yapılandırılmış JSON olarak iletilir.
* **Backend intake + ML:** `POST /api/analyze` ile extension verisi alınır; CatBoost modelleri `/predict/anomaly` ve `/predict/churn` üzerinden anomali ve churn tahmini sunar (Sprint 1: %97.42 / %86.35 AUC).
* **Admin akışı:** Her taramaya `capture_id` atanır; kullanıcı isterse admin konsolunda detaya gider (`GET /api/capture/{capture_id}`).
* **Gizlilik:** E-posta, telefon, şifre, adres ve kart toplanmaz; hassas form alanları maskeleme kurallarıyla işlenir.
* **Admin konsey & dashboard *(yol haritası)*:** ML skorları, lane verileri, AI ajan yorumu ve Eski Hali / Yeni Hali simülasyonu.

## Repo Yapısı

```
YZTA-BOOTCAMP-2026/
├── chrome-extension/     # Veri toplayıcı (Siteyi Tara)
├── backend/              # FastAPI + CatBoost + extension intake
│   └── README.md         # Backend kurulum ve API detayı
└── README.md
```

### Modüller

| Modül | Görev | Klasör | Durum |
|-------|--------|--------|-------|
| Veri toplayıcı | Sayfa tarama, lane + persona, API'ye POST | `chrome-extension/` | ✅ |
| ML & intake API | `/api/analyze`, `/predict/*`, capture saklama | `backend/` | ✅ |
| Admin konsol | Detay, konsey, HTML/CSS düzeltme | — | ⏳ |

## Hızlı Başlangıç

**1. Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# models/anomaly_model.cbm ve churn_model.cbm dosyalarini backend/models/ altina koy
./run.sh
```

API: `http://127.0.0.1:8000` · Swagger: `/docs`  
Detaylı endpoint listesi → [backend/README.md](backend/README.md)

**2. Chrome eklentisi**

`chrome://extensions` → Geliştirici modu → **Paketlenmemiş öğe yükle** → `chrome-extension/` klasörünü seç.

**3. Tarama**

E-ticaret sayfasını aç → eklenti → **Siteyi Tara** → özet popup'ta görünür → **Admin konsolunda incele** (dashboard hazır olunca `capture_id` ile açılır).

## Hedef Kitle

* E-ticaret KOBİ'leri ve D2C markalar (Shopify, ikas, WooCommerce vb.)
* Pazaryeri satıcıları ve mağaza operasyon ekipleri
* UX/UI tasarımcıları ve ürün yöneticileri (Product Managers)
* QA / growth ekipleri — checkout sürtünmesi ve sepet terk oranını izleyenler
* Yazılım geliştirme ajansları (müşteri sitelerinde hızlı UX denetimi)

## Product Backlog URL

[Miro / Jira / Trello Backlog Board Linki](https://miro.com/app/board/uXjVOSSCpsI=/)

---

# Sprint 1

* **Backlog düzeni ve Story seçimleri**:
* **Backlog düzeni ve Story seçimleri:**
  Sprint 1 kapsamında, AgenticQA platformunun temel altyapısının kurulması hedeflenmiştir. Takım olarak Bucket System metodolojisini kullandık ve iş listemizi efor, belirsizlik ve teknik zorluk derecelerine göre gruplandırdık:
  * **ML Altyapısı:** CatBoost ile Anomali ve Churn modellerinin eğitimi, hiperparametre optimizasyonu (class_weights ve best_iteration takipleri) -> **Bucket: 13**
  * **Backend:** FastAPI mimarisinin kurulması, endpoint şemalarının (Pydantic) oluşturulması -> **Bucket: 2**
  * **Feature Extraction:** Regex tabanlı URL ve HTTP POST body özellik çıkarım fonksiyonlarının yazılması -> **Bucket: 5**
  * **Entegrasyon & Debugging:** Uvicorn sunucu kilitlenmeleri, yerel klasör yolları ve file senkronizasyon hatalarının çözülmesi -> **Bucket: 8**
  * **Chrome eklentisi (veri toplayıcı):** Canlı DOM/CSS/sepet yakalama, üç analiz hattı, persona simülasyonu, backend'e POST -> **Bucket: 6**
  * **Backend intake:** Eklenti payload'ı için `/api/analyze`, `capture_id` üretimi, capture saklama ve ML köprüsü -> **Bucket: 4**

* **Daily Scrum**:
* Sprint boyunca haftada 3 gün, 15'er dakikalık Daily Scrum toplantıları yapılmıştır.
Öne Çıkan Gelişmeler: Veri bilimi bacağında CatBoost modellerinin %97.42 (Anomali) ve %86.35 (Churn) AUC başarı metriklerine ulaşmasıyla ilk büyük milat tamamlanmıştır. Geliştirme ekibi tarafında AgenticQA Chrome eklentisi (v1.8.4) ile modüler FastAPI backend intake katmanı tamamlanmış; eklenti `POST /api/analyze` üzerinden tarama paketini backend'e iletebilir hale gelmiştir.  
Karşılaşılan Engeller (Impediments): Google Colab ile Drive arasındaki dosya yazma/okuma senkronizasyon problemleri ve Uvicorn'un arka planda modelleri yüklerken test isteklerinde fırlattığı Connection refused hataları takımı kısa süreli bloke etmiştir. Eklenti tarafında Uvicorn `--reload` döngüsü (`.venv` izleme) ve service worker'da config destructuring kaynaklı tarama hataları giderilmiştir.

* **Sprint board update**: Sprint board screenshotları:
* <img width="3315" height="1907" alt="sprint_1_board" src="https://github.com/user-attachments/assets/6468543c-32fd-4523-b8a8-8ab1bc67a628" />
* Sprint 1 sonunda, çalışan ve canlı testleri başarıyla geçerek `{'status': 'ok'}` yanıtı veren kararlı bir tahmin API'si (Product Increment) elde edilmiştir.
  * **ML API:** `/predict/anomaly` ve `/predict/churn` endpoint'leri üzerinden gerçek zamanlı veri kabul etmeye hazırdır.
  * **Extension intake API:** `/api/analyze` eklenti JSON'unu alır; `capture_id`, lane özeti ve ML skorlarını döner. `/api/capture/{capture_id}` admin/dashboard için saklanan taramayı sunar.
* Sprint Başlangıcı: Tüm story'ler To Do sütununda Bucket puanlarıyla etiketlendi.
Sprint Ortası: Özellik çıkarımı ve model eğitimleri tamamlanarak In Progress (Yapılıyor) sütunundan Review/QA aşamasına aktarıldı. Eklenti lane mimarisi ve backend modüler yapısı paralel ilerledi.
Sprint Sonu: FastAPI backend entegrasyonunun ve yerel testlerin başarıyla tamamlanmasıyla ML bacağındaki tüm görevler Done (Tamamlandı) sütununa çekildi. Chrome eklentisi ve extension intake backend'i de Sprint 1 increment'ine dahil edildi.

* **Geliştirme ekibi — teslim edilenler (Extension + Backend intake)**:

  **Chrome eklentisi (`chrome-extension/`, v1.8.4)**
  * Manifest V3 service worker; popup kapansa bile arka planda tarama devam eder.
  * Canlı sayfa yakalama: DOM iskeleti, CSS özeti, sepet, e-ticaret sinyalleri (kargo/ödeme/güven), kontrast ve UX metrikleri.
  * PII maskeleme: e-posta, telefon, şifre, adres ve kart alanları toplanmaz.
  * **Üç analiz hattı:** Güven · UX/Churn · Satış Hunisi — her biri için feature set, risk skoru (0 = iyi, 100 = kötü) ve tespit özeti.
  * **Persona simülasyonu:** Aceleci Alışverişçi, Erişilebilirlik Hassas Kullanıcı, Kötü Niyetli Saldırgan — payload'a `agent_simulation` olarak eklenir.
  * Tarama pipeline: hızlı metrikler → persona → ağır DOM/CSS → `POST http://localhost:8000/api/analyze`.
  * Sade popup: Site / platform, sayfa tipi, ön risk, paket boyutu, `capture_id`; **Admin konsolunda incele** butonu.

  **Backend genişletmesi (`backend/`)**
  * Modüler FastAPI: `routers/` (health, analyze, predict), `services/` (capture, ml, feature_extraction), `schemas/`.
  * `POST /api/analyze` — eklenti verisini alır, özet + ML skoru üretir.
  * `GET /api/capture/{capture_id}` — taramayı bellekte saklar (admin konsol için).
  * Mevcut CatBoost endpoint'leri korundu: `/predict/anomaly`, `/predict/churn`.
  * `run.sh` — uvicorn reload yalnızca `app/` izler (`.venv` döngüsü giderildi).
  * Kurulum ve API dokümantasyonu: [backend/README.md](backend/README.md)

* **Ürün Durumu**: Ekran görüntüleri:
<img width="550" height="126" alt="Ekran Resmi 2026-07-04 10 42 54" src="https://github.com/user-attachments/assets/df64e708-9c6f-402b-acde-c3e13f1656c1" />


  
* **Sprint Review**: Sprint 1 hedeflerine %100 oranında ulaşılmıştır. Paydaşlara ve takım üyelerine çalışan API mimarisi sunulmuş, CatBoost modellerinin validasyon başarıları gösterilmiştir. Yapılan interaktif testlerde API'nin tıkır tıkır çalıştığı ve model dosyalarını başarıyla yüklediği doğrulanmıştır. Extension → backend intake akışı demo edilmiş; eklentinin mağaza sayfasından veri toplayıp backend'e ilettiği gösterilmiştir. Bir sonraki sprintte admin konsol/dashboard arayüzünün bu `capture_id` akışına bağlanması onaylanmıştır.
* **Sprint Retrospective:**
* **Ne İyi Gitti? :**
Büyük veri kümelerini chunk'lar halinde işleme stratejimiz çok başarılı oldu; RAM patlaması yaşamadan veri setini kararlı hale getirdik.
CatBoost modellerimizin validasyon başarıları (Anomali için %97.42, Churn için %86.35 AUC) hedeflediğimiz metriklerin çok üzerinde geldi.  
FastAPI entegrasyonu sayesinde backend mimarisini çok hızlı bir şekilde ayağa kaldırdık ve sorunsuz çalışan `{'status': 'ok'}` çıktısını aldık.
Chrome eklentisinde lane tabanlı analiz ve persona simülasyonu tek payload'da birleştirildi; popup sade tutularak asıl detay admin katmanına bırakıldı.
* **Ne Geliştirilebilir? :**
Google Colab'in sanal Linux dosya sistemi ve dinamik klasör yolları sunucuyu başlatırken yerel senkronizasyon gecikmelerine ve zaman kayıplarına yol açtı.  
Gelecek sprintlerde, API ayağa kaldırma ve test süreçlerini doğrudan yerel terminal ortamında (VS Code veya PyCharm üzerinden) yürüterek bulut tabanlı dosya yolu karmaşasının önüne geçebiliriz.
Capture store şu an bellekte; admin konsol gelince kalıcı depolama (DB veya dosya) eklenmeli. Admin dashboard henüz yok — Sprint 2 kapsamında.

---

# Sprint 2

* **Backlog düzeni ve Story seçimleri**: 
* **Daily Scrum**: 
* **Sprint board update**: Sprint board screenshotları:
* **Ürün Durumu**: Ekran görüntüleri:
* **Sprint Review**: 
* **Sprint Retrospective:**

---

# Sprint 3

* **Backlog düzeni ve Story seçimleri**: 
* **Daily Scrum**: 
* **Sprint board update**: Sprint board screenshotları:
* **Ürün Durumu**: Ekran görüntüleri:
* **Sprint Review**: 
* **Sprint Retrospective:**

---
