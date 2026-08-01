import React, { useState } from 'react';
import { Server, Info, Save, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'agenticqa_settings';

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // localStorage kapalı/erişilemez olabilir, sessizce varsayılana dön
  }
  return { apiBase: 'http://127.0.0.1:8000', pollIntervalSec: 6 };
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // sessizce yut, kritik değil
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <span>
          Backend tarafında henüz API anahtarı, webhook ve model eşiği (threshold) yönetimi için
          endpoint bulunmuyor. Bu panel şimdilik yalnızca frontend'in kendi tarayabildiği ayarları
          (tarayıcının yerel deposunda, sadece bu cihazda) saklar.
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Server size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Backend Bağlantısı</h2>
            <p className="text-xs text-slate-400">Dashboard'un veri çektiği API adresi</p>
          </div>
        </div>

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          API Base URL
        </label>
        <input
          type="text"
          value={settings.apiBase}
          onChange={(e) => setSettings((s) => ({ ...s, apiBase: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200"
          placeholder="http://127.0.0.1:8000"
        />

        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mt-5 mb-2">
          Canlı Akış yenileme aralığı (saniye)
        </label>
        <input
          type="number"
          min="3"
          max="60"
          value={settings.pollIntervalSec}
          onChange={(e) => setSettings((s) => ({ ...s, pollIntervalSec: Number(e.target.value) }))}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={16} />
            Kaydet
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> Kaydedildi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}