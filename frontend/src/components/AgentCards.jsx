import React from 'react';
import { User, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

// Backend'den gelen gerçek persona şeması (bkz. chrome-extension/lib/personaSimulator.js):
// { id, label, lane, status, would_abandon, friction_score, events: [{t, type, result?}], findings: [] }

function getPersonaMeta(id, wouldAbandon) {
  if (wouldAbandon) {
    return { badgeColor: 'bg-red-100 text-red-800 border-red-200', status: 'Terk Etti', icon: ShieldAlert, iconBg: 'bg-red-50 text-red-600' };
  }
  if (id === 'malicious_actor') {
    return { badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', status: 'Engellendi', icon: ShieldCheck, iconBg: 'bg-emerald-50 text-emerald-600' };
  }
  return { badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', status: 'Geziniyor', icon: User, iconBg: 'bg-amber-50 text-amber-600' };
}

export default function AgentCards({ personas = [] }) {
  if (personas.length === 0) {
    return (
      <div className="my-6 bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
        Henüz persona simülasyon verisi yok. Bir tarama tamamlandığında ajan kartları burada görünecek.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
      {personas.map((agent) => {
        const meta = getPersonaMeta(agent.id, agent.would_abandon);
        const IconComponent = meta.icon;
        const lastEvent = agent.events?.[agent.events.length - 1];
        const currentAction = agent.findings?.[0]
          || (lastEvent ? `[${lastEvent.t}ms] ${lastEvent.type} -> ${lastEvent.result ?? lastEvent.page_type ?? 'ok'}` : 'Aksiyon kaydı yok');

        return (
          <div key={agent.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${meta.iconBg}`}>
                  <IconComponent size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">{agent.label}</h3>
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${meta.badgeColor}`}>
                {meta.status}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                {agent.findings?.[0] ? 'Ajan Tespiti' : 'Son Aksiyon'}
              </p>
              <p className="text-sm text-slate-700 font-mono line-clamp-2">{currentAction}</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <AlertTriangle size={12} />
              Sürtünme Skoru: <span className="font-semibold text-slate-600">{agent.friction_score}/100</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}