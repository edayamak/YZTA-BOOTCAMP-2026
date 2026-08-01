import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Radio, FileText, Settings, Terminal, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import AgentCards from '../components/AgentCards';
import ReportsLogs from '../components/ReportsLogs';
import LiveFeed from '../components/LiveFeed';
import SettingsPanel from '../components/SettingsPanel';

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

  const fetchCaptureById = async (captureId) => {
    const detailRes = await fetch(`${API_BASE}/api/capture/${captureId}`);
    if (!detailRes.ok) {
      throw new Error(`Capture bulunamadı (HTTP ${detailRes.status})`);
    }
    return detailRes.json();
  };

  const fetchCaptures = async () => {
    setLoading(true);
    setError(null);
    try {
      const captureId = getCaptureIdFromUrl();

      if (captureId) {
        const data = await fetchCaptureById(captureId);
        setSelectedCapture(data);
        return;
      }

      const res = await fetch(`${API_BASE}/api/captures`);
      if (!res.ok) {
        throw new Error(`Capture listesi alınamadı (HTTP ${res.status})`);
      }
      const idsData = await res.json();
      const ids = idsData?.capture_ids || [];

      if (ids && ids.length > 0) {
        const latestId = ids[ids.length - 1];
        const data = await fetchCaptureById(latestId);
        setSelectedCapture(data);
      }
    } catch (err) {
      console.error("Backend bağlantı hatası.", err);
      setError(err.message || 'Backend’e bağlanılamadı. Servisin çalıştığından emin ol.');
    } finally {
      setLoading(false);
    }
  };

  const openCapture = async (captureId) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('capture_id', captureId);
      window.history.pushState({}, '', url);
      const data = await fetchCaptureById(captureId);
      setSelectedCapture(data);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Capture açılırken hata.", err);
      setError(err.message || 'Tarama açılamadı.');
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
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 max-w-md min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-xs font-semibold text-slate-600 font-mono truncate">
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
          {activeTab === 'live' ? (
            <LiveFeed />
          ) : activeTab === 'reports' ? (
            <ReportsLogs onOpenCapture={openCapture} />
          ) : activeTab === 'dashboard' ? (
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
          ) : activeTab === 'settings' ? (
            <SettingsPanel />
          ) : null}
        </div>
      </main>
    </div>
  );
}