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

--AgenticQA--

## Ürün Açıklaması

* AgenticQA, yazılım şirketlerinin (e-ticaret platformları, SaaS girişimleri, dijital bankacılık vb.) canlıya aldıkları sistemlerdeki kullanıcı deneyimi hatalarını ve sistem açıklarını tespit eden yapay zeka tabanlı bir B2B kaos simülasyonu ve canlı davranış testi platformudur.

Geleneksel manuel test süreçlerinin yavaşlığını ve statik otomasyon kodlarının (Selenium/Cypress) öngörülemez insan davranışlarını yakalayamama kısıtını tamamen ortadan kaldırır. Hedef web sitelerine entegre edilen hafif bir izleme eklentisi/script'i (JS snippet) aracılığıyla çalışan platform, arka planda farklı insan personalarını taklit eden bağımsız bir AI Agent Ordusu kurarak siteleri otonom bir şekilde test eder. Yazılım ekipleri her sabah panellerini açtığında, yapay zekanın sistemlerini nasıl çökertmeye çalıştığını, nerede hata bulduğunu ve matematiksel olarak hesaplanmış kullanıcı deneyimi açıklarını izlerler.

## Ürün Özellikleri

* Çoklu AI Agent Orkestrasyonu (Multi-Agent): Farklı kullanıcı personalarını (Aceleci Alışverişçi, Teknoloji Özürlü Yaşlı, Kötü Niyetli Saldırgan) taklit eden, hafızaya (memory) sahip bağımsız ajanların web sitelerinde özgürce gezinmesi.
* Makine Öğrenmesi ile Darboğaz Tahmini: Ajanların sitede gezinirken ürettiği logları ve tıklama rotalarını (clickstream) işleyerek kullanıcı terk riskini (Churn) ve sistemsel çökmeleri (Anomaly Detection) matematiksel olarak tahmin etme.
* Canlı Takip ve UX Skorlama (Real-time Dashboard): Kritik hata anlarının logları, yapay zekanın ürettiği dinamik Kullanıcı Deneyim Puanı (UX Score) ve anlık kaos analizlerinin görselleştirilmesi.
* Sıfır Kod Entegrasyonu: Şirketlerin kendi kod tabanlarına ekstra test kodu yazmak zorunda kalmadan, sadece tek satırlık bir script entegrasyonuyla sistem analizi başlatabilmesi.

## Hedef Kitle

* E-Ticaret Şirketleri (Trendyol, Hepsiburada vb.)
* SaaS (Yazılım Servisi) Girişimleri ve Dijital Bankalar
* Yazılım Geliştirme Ajansları ve QA (Kalite Güvence) Ekipleri
* Ürün Yöneticileri (Product Managers) ve UX/UI Tasarımcıları
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

* **Daily Scrum**:
* Sprint boyunca haftada 3 gün, 15'er dakikalık Daily Scrum toplantıları yapılmıştır.
Öne Çıkan Gelişmeler: Veri bilimi bacağında CatBoost modellerinin %97.42 (Anomali) ve %86.35 (Churn) AUC başarı metriklerine ulaşmasıyla ilk büyük milat tamamlanmıştır.  
Karşılaşılan Engeller (Impediments): Google Colab ile Drive arasındaki dosya yazma/okuma senkronizasyon problemleri ve Uvicorn'un arka planda modelleri yüklerken test isteklerinde fırlattığı Connection refused hataları takımı kısa süreli bloke etmiştir. Bu engeller, timeout sürelerinin esnetilmesi ve model yollarının kod içinde dinamik hale getirilmesiyle aşılmıştır.

* **Sprint board update**: Sprint board screenshotları:
* <img width="3315" height="1907" alt="sprint_1_board" src="https://github.com/user-attachments/assets/6468543c-32fd-4523-b8a8-8ab1bc67a628" />
* Sprint 1 sonunda, çalışan ve canlı testleri başarıyla geçerek {'status': 'ok'} yanıtı veren kararlı bir tahmin API'si (Product Increment) elde edilmiştir.
API Endpoint'leri: /predict/anomaly ve /predict/churn endpoint'leri üzerinden gerçek zamanlı veri kabul etmeye hazırdır.
* Sprint Başlangıcı: Tüm story'ler To Do sütununda Bucket puanlarıyla etiketlendi.
Sprint Ortası: Özellik çıkarımı ve model eğitimleri tamamlanarak In Progress (Yapılıyor) sütunundan Review/QA aşamasına aktarıldı.
Sprint Sonu: FastAPI backend entegrasyonunun ve yerel testlerin başarıyla tamamlanmasıyla ML bacağındaki tüm görevler Done (Tamamlandı) sütununa çekildi.

* **Ürün Durumu**: Ekran görüntüleri:
<img width="550" height="126" alt="Ekran Resmi 2026-07-04 10 42 54" src="https://github.com/user-attachments/assets/df64e708-9c6f-402b-acde-c3e13f1656c1" />


  
* **Sprint Review**: Sprint 1 hedeflerine %100 oranında ulaşılmıştır. Paydaşlara ve takım üyelerine çalışan API mimarisi sunulmuş, CatBoost modellerinin validasyon başarıları gösterilmiştir. Yapılan interaktif testlerde API'nin tıkır tıkır çalıştığı ve model dosyalarını başarıyla yüklediği doğrulanmıştır. Bir sonraki sprintte bu API'nin frontend/dashboard arayüzüne bağlanması onaylanmıştır.
* **Sprint Retrospective:**
* **Ne İyi Gitti? :**
Büyük veri kümelerini chunk'lar halinde işleme stratejimiz çok başarılı oldu; RAM patlaması yaşamadan veri setini kararlı hale getirdik.
CatBoost modellerimizin validasyon başarıları (Anomali için %97.42, Churn için %86.35 AUC) hedeflediğimiz metriklerin çok üzerinde geldi.  
FastAPI entegrasyonu sayesinde backend mimarisini çok hızlı bir şekilde ayağa kaldırdık ve sorunsuz çalışan {'status': 'ok'} çıktısını aldık.
* **Ne Geliştirilebilir? :**
Google Colab'in sanal Linux dosya sistemi ve dinamik klasör yolları sunucuyu başlatırken yerel senkronizasyon gecikmelerine ve zaman kayıplarına yol açtı.  
Gelecek sprintlerde, API ayağa kaldırma ve test süreçlerini doğrudan yerel terminal ortamında (VS Code veya PyCharm üzerinden) yürüterek bulut tabanlı dosya yolu karmaşasının önüne geçebiliriz.

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
