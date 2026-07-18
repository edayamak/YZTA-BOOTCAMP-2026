import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Radio, FileText, Settings, Terminal, Activity, RefreshCw, AlertTriangle, Calendar } from 'lucide-react';
import AgentCards from '../components/AgentCards';

// TODO: production'da .env / import.meta.env.VITE_API_BASE_URL üzerinden yönet
const API_BASE = 'http://127.0.0.1:8000';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCaptureIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('capture_id');
  };

  const fetchCaptures = async () => {
    setLoading(true);
    setError(null);
    try {
      const captureId = getCaptureIdFromUrl();

      if (captureId) {
        const detailRes = await fetch(`${API_BASE}/api/capture/${captureId}`);
        if (!detailRes.ok) {
          throw new Error(`Capture bulunamadı (HTTP ${detailRes.status})`);
        }
        const data = await detailRes.json();
        setSelectedCapture(data);
        return;
      }

      const res = await fetch(`${API_BASE}/api/captures`);
      if (!res.ok) {
        throw new Error(`Capture listesi alınamadı (HTTP ${res.status})`);
      }
      const ids = await res.json();

      if (ids && ids.length > 0) {
        const latestId = ids[ids.length - 1];
        const detailRes = await fetch(`${API_BASE}/api/capture/${latestId}`);
        if (!detailRes.ok) {
          throw new Error(`Capture detayı alınamadı (HTTP ${detailRes.status})`);
        }
        const data = await detailRes.json();
        setSelectedCapture(data);
      }
    } catch (err) {
      console.error("Backend bağlantı hatası.", err);
      setError(err.message || 'Backend’e bağlanılamadı. Servisin çalıştığından emin ol.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptures();
  }, []);

  const getRiskLevelColor = (level) => {
    const lvl = (level || '').toUpperCase();
    if (lvl === 'HIGH' || lvl === 'YÜKSEK') return 'text-red-600';
    if (lvl === 'LOW' || lvl === 'DÜŞÜK') return 'text-emerald-600';
    if (lvl === 'MEDIUM' || lvl === 'ORTA') return 'text-amber-600';
    return 'text-slate-500';
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', name: 'Canlı Akış (Live Feed)', icon: Radio },
    { id: 'reports', name: 'Raporlar & Loglar', icon: FileText },
    { id: 'settings', name: 'Ayarlar', icon: Settings },
  ];

  // Sprint 3 Yol Haritası Metinleri
  const renderRoadmapContent = () => {
    switch (activeTab) {
      case 'live':
        return {
          title: "Canlı Akış (Live Feed) Modülü",
          description: "Bu modül Sprint 3 planlamasında aktif edilecektir.",
          details: [
            "Sistem loglarının WebSocket protokolü üzerinden gerçek zamanlı akışı sağlanacaktır.",
            "Anlık AI Ajan analizleri ve mikro-davranış takipleri arayüze entegre edilecektir.",
            "Kritik risk durumlarında canlı masaüstü ve tarayıcı bildirim altyapısı kurulacaktır."
          ]
        };
      case 'reports':
        return {
          title: "Raporlar & Loglar Modülü",
          description: "Bu modül Sprint 3 planlamasında aktif edilecektir.",
          details: [
            "Geçmişe dönük tüm simülasyon ve tarama kayıtları veri tabanında arşivlenecektir.",
            "Tek tıkla indirilebilir PDF Rapor Üretici mekanizması devreye alınacaktır.",
            "Ajan türüne, tarihe ve risk skoruna göre gelişmiş filtreleme bileşenleri eklenecektir."
          ]
        };
      case 'settings':
        return {
          title: "Sistem Ayarları Modülü",
          description: "Bu modül Sprint 3 planlamasında aktif edilecektir.",
          details: [
            "API Anahtarı (Credentials) ve hedef domain entegrasyon yönetimi eklenecektir.",
            "Webhook entegrasyonları ile CI/CD süreçlerine tetikleyici desteği verilecektir.",
            "LLM ve CatBoost model hassasiyet eşikleri (Threshold) panel üzerinden ayarlanabilir olacaktır."
          ]
        };
      default:
        return null;
    }
  };

  const roadmap = renderRoadmapContent();

  // NOT: GET /api/capture/{id} yanıtında extension payload'ı (page, cart, dom, css,
  // agent_simulation, ml_features...) `selectedCapture.payload` altında gelir.
  // `selectedCapture.summary` ve `selectedCapture.ml` backend tarafından ayrıca
  // türetilmiş özet alanlardır. Bkz. backend/app/services/capture_service.py
  const personas = selectedCapture?.payload?.agent_simulation?.personas || [];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sol Menü (Sidebar) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <Terminal className="text-indigo-400" size={24} />
            <span className="font-bold text-lg tracking-wider">AgenticQA</span>
          </div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          YZTA Bootcamp 2026 - v1.0.0
        </div>
      </aside>

      {/* Sağ İçerik Alanı */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-500 animate-pulse" size={20} />
            <h1 className="text-xl font-bold text-slate-800">Canlı Simülasyon Paneli</h1>
            <button onClick={fetchCaptures} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              Target: {selectedCapture?.summary?.url || selectedCapture?.payload?.page?.url || 'Tarama Bekleniyor...'}
            </span>
          </div>
        </header>

        {error && (
          <div className="mx-8 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'dashboard' ? (
            <>
              {/* Üst Özet Skorkartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Genel Risk Skoru</h3>
                    <p className="text-4xl font-extrabold text-slate-800 mt-2">
                      {selectedCapture?.summary?.overall_risk_score ?? '--'}%
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 mt-4 border-t pt-2">
                    Risk Durumu:{' '}
                    <span className={`font-semibold uppercase ${getRiskLevelColor(selectedCapture?.summary?.overall_risk_level)}`}>
                      {selectedCapture?.summary?.overall_risk_level || 'Bilinmiyor'}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yapay Zeka Lane Analizi</h3>
                    <p className="text-xl font-bold text-indigo-600 mt-3">
                      {selectedCapture?.summary?.agent_findings ?? '0'} Kritik Bulgu
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 mt-4 border-t pt-2">
                    Siteden Ayrılma Eğilimi: <span className={`font-semibold ${selectedCapture?.summary?.any_would_abandon ? 'text-red-500' : 'text-emerald-500'}`}>{selectedCapture?.summary?.any_would_abandon ? 'YÜKSEK' : 'DÜŞÜK'}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ML Tahmin Motoru</h3>
                    <p className="text-sm font-medium text-slate-500 mt-3 leading-relaxed">
                      {selectedCapture?.ml?.note || 'Sprint 1 Modelleri Aktif.'}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 mt-2 border-t pt-2">
                    Modeller Yüklendi: <span className="font-mono">{selectedCapture?.ml?.models_loaded ? 'TRUE' : 'FALSE'}</span>
                  </div>
                </div>
              </div>

              {/* CANLI YAPAY ZEKA AJAN ORDUSU */}
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>Aktif AI Ajan Ordusu</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-normal">Canlı Veri</span>
                </h2>

                <AgentCards personas={personas} />
              </div>
            </>
          ) : (
            /* Profesyonel Sprint 3 Yol Haritası Tasarımı */
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center gap-3 border-b pb-4 mb-6">
                <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{roadmap?.title}</h2>
                  <p className="text-sm text-amber-600 font-medium mt-0.5">{roadmap?.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sprint 3 Geliştirme Hedefleri</h3>
                <ul className="space-y-3">
                  {(roadmap?.details || []).map((detail, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}