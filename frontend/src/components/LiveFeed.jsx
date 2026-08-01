import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, AlertTriangle, Clock, WifiOff } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/api/ws/captures';
const RECONNECT_DELAY_MS = 3000;

function getRiskLevelColor(level) {
  const lvl = (level || '').toUpperCase();
  if (lvl === 'HIGH' || lvl === 'YÜKSEK') return 'border-l-red-500';
  if (lvl === 'LOW' || lvl === 'DÜŞÜK') return 'border-l-emerald-500';
  if (lvl === 'MEDIUM' || lvl === 'ORTA') return 'border-l-amber-500';
  return 'border-l-slate-300';
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return 'az önce';
  if (diffSec < 60) return `${diffSec} sn önce`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  return new Date(iso).toLocaleTimeString('tr-TR');
}

export default function LiveFeed() {
  const [feed, setFeed] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | open | closed
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isUnmountingRef = useRef(false);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('open');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_capture' && message.capture) {
          setFeed((prev) => {
            if (prev.some((c) => c.capture_id === message.capture.capture_id)) {
              return prev; // Aynı capture zaten listede (ör. StrictMode dev double-effect), tekrar ekleme
            }
            return [message.capture, ...prev].slice(0, 50);
          });
        }
      } catch (err) {
        console.error('WebSocket mesajı ayrıştırılamadı:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('closed');
      if (isUnmountingRef.current) return; // component kapanıyor, yeniden bağlanma
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    isUnmountingRef.current = false;
    connect();
    return () => {
      isUnmountingRef.current = true;
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Radio size={18} className={`${connectionStatus === 'open' ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`} />
          <h2 className="font-bold text-slate-800">Canlı Akış</h2>
          {connectionStatus === 'open' && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
              WebSocket bağlı
            </span>
          )}
          {connectionStatus === 'connecting' && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
              Bağlanıyor...
            </span>
          )}
          {connectionStatus === 'closed' && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 flex items-center gap-1">
              <WifiOff size={11} /> Bağlantı koptu, yeniden deneniyor
            </span>
          )}
        </div>
      </div>

      {connectionStatus === 'closed' && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
          <AlertTriangle size={14} className="flex-shrink-0" />
          Backend'e WebSocket üzerinden bağlanılamadı. Backend'in çalıştığından emin olun; birkaç saniyede bir otomatik yeniden denenecek.
        </div>
      )}

      <div className="p-6">
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <Radio size={32} />
            <p className="text-sm">Yeni bir tarama bekleniyor...</p>
            <p className="text-xs text-slate-300">Eklentiden bir tarama yaptığında burada anında görünecek.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {feed.map((capture) => (
              <li
                key={capture.capture_id}
                className={`border-l-4 ${getRiskLevelColor(capture.summary?.overall_risk_level)} bg-slate-50 rounded-r-lg px-4 py-3 flex items-center justify-between animate-[fadeIn_0.3s_ease-in]`}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {capture.summary?.url || capture.payload?.page?.url || '—'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{capture.capture_id}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-700">{capture.summary?.overall_risk_score ?? '--'}%</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                    <Clock size={10} /> {timeAgo(capture.received_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}