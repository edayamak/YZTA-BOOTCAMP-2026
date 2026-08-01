import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, ExternalLink, RefreshCw, AlertTriangle, Inbox } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function getRiskLevelBadge(level) {
  const lvl = (level || '').toUpperCase();
  if (lvl === 'HIGH' || lvl === 'YÜKSEK') return 'bg-red-50 text-red-700 border-red-200';
  if (lvl === 'LOW' || lvl === 'DÜŞÜK') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lvl === 'MEDIUM' || lvl === 'ORTA') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-500 border-slate-200';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch {
    return iso;
  }
}

export default function ReportsLogs({ onOpenCapture }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const idsRes = await fetch(`${API_BASE}/api/captures`);
      if (!idsRes.ok) throw new Error(`Capture listesi alınamadı (HTTP ${idsRes.status})`);
      const idsData = await idsRes.json();
      const ids = idsData?.capture_ids || [];

      const details = await Promise.all(
        (ids || []).map(async (id) => {
          try {
            const res = await fetch(`${API_BASE}/api/capture/${id}`);
            if (!res.ok) return null;
            return await res.json();
          } catch {
            return null;
          }
        })
      );

      const valid = details
        .filter(Boolean)
        .sort((a, b) => new Date(b.received_at || 0) - new Date(a.received_at || 0));

      setReports(valid);
    } catch (err) {
      console.error('Rapor listesi alınırken hata:', err);
      setError(err.message || 'Backend’e bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = (report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.capture_id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-600" />
          <h2 className="font-bold text-slate-800">Geçmiş Taramalar</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {reports.length} kayıt
          </span>
        </div>
        <button
          onClick={fetchReports}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Yenile"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {!error && !loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
          <Inbox size={32} />
          <p className="text-sm">Henüz kaydedilmiş bir tarama yok.</p>
        </div>
      )}

      {reports.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Site</th>
                <th className="px-6 py-3">Risk Skoru</th>
                <th className="px-6 py-3">Risk Durumu</th>
                <th className="px-6 py-3">Tarih</th>
                <th className="px-6 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.capture_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-700 truncate max-w-xs">
                      {r.summary?.url || r.payload?.page?.url || '—'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{r.capture_id}</div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-700">
                    {r.summary?.overall_risk_score ?? '--'}%
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRiskLevelBadge(r.summary?.overall_risk_level)}`}>
                      {r.summary?.overall_risk_level || 'Bilinmiyor'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(r.received_at)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onOpenCapture?.(r.capture_id)}
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-slate-400"
                        title="Dashboard'da aç"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(r)}
                        className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-slate-400"
                        title="JSON olarak indir"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}