import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { polStatus, statusConf, fmtDayLong, isToday, fw, PolStatus } from '../../utils/pollination';
import { Search, CheckCircle2, Hourglass, AlertTriangle, Download } from 'lucide-react';

type Tab = 'todas' | 'hoy' | 'hechas' | 'pendientes' | 'vencidas';

const MobileCrossHistory: React.FC = () => {
  const navigate = useNavigate();
  const { crosses } = useApp();
  const [tab, setTab] = useState<Tab>('todas');
  const [q, setQ] = useState('');

  const withStatus = useMemo(() => crosses.map(c => ({ c, st: polStatus(c) })), [crosses]);

  const stats = useMemo(() => ({
    hechas: withStatus.filter(x => x.st === 'hecha').length,
    pendientes: withStatus.filter(x => x.st === 'pendiente' || x.st === 'programada').length,
    vencidas: withStatus.filter(x => x.st === 'vencida').length,
  }), [withStatus]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return withStatus.filter(({ c, st }) => {
      if (tab === 'hechas' && st !== 'hecha') return false;
      if (tab === 'vencidas' && st !== 'vencida') return false;
      if (tab === 'pendientes' && !(st === 'pendiente' || st === 'programada')) return false;
      if (tab === 'hoy' && !isToday(c.fecha_programada || c.fecha_cruza)) return false;
      if (ql && !(`${c.madre_nombre} ${c.padre_nombre} ${c.etiqueta || ''}`.toLowerCase().includes(ql))) return false;
      return true;
    }).sort((a, b) =>
      new Date(b.c.fecha_programada || b.c.fecha_cruza).getTime() - new Date(a.c.fecha_programada || a.c.fecha_cruza).getTime()
    );
  }, [withStatus, tab, q]);

  // Agrupar por día
  const groups = useMemo(() => {
    const m = new Map<string, { c: typeof crosses[number]; st: PolStatus }[]>();
    filtered.forEach(item => {
      const key = fmtDayLong(item.c.fecha_programada || item.c.fecha_cruza);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(item);
    });
    return Array.from(m.entries());
  }, [filtered]);

  const exportCSV = () => {
    const head = ['Cruza', 'Madre', 'Padre', 'Estado', 'Programada', 'Polinizada', 'Invernadero', 'Etiqueta', 'Semillas'];
    const rows = withStatus.map(({ c, st }) => [
      c.nombre, c.madre_nombre, c.padre_nombre, st,
      c.fecha_programada ? new Date(c.fecha_programada).toLocaleDateString('es-AR') : '',
      c.fecha_polinizacion ? new Date(c.fecha_polinizacion).toLocaleDateString('es-AR') : '',
      c.ubicacion || '', c.etiqueta || '', String(c.semillas_obtenidas || 0),
    ]);
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cruzas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <MobileHeader title="Historial" subtitle="Registro de cruzas" back />
      <div className="px-5 space-y-4 pb-28">
        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/35" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cruza, parental o etiqueta…" className="w-full h-11 rounded-xl bg-app-card border border-app-border pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-app-bg rounded-xl p-1 overflow-x-auto">
          {([['todas', 'Todas'], ['hoy', 'Hoy'], ['hechas', 'Hechas'], ['pendientes', 'Pendientes'], ['vencidas', 'Vencidas']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 whitespace-nowrap px-2.5 py-2 rounded-lg text-[11.5px] font-bold transition-colors ${tab === k ? 'bg-app-card text-brand-primary shadow-sm' : 'text-brand-dark/45'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<CheckCircle2 size={16} />} value={stats.hechas} label="Realizado" tone="text-emerald-600" />
          <Stat icon={<Hourglass size={16} />} value={stats.pendientes} label="Pendientes" tone="text-[#9a7b2f]" />
          <Stat icon={<AlertTriangle size={16} />} value={stats.vencidas} label="Vencidas" tone="text-rose-500" />
        </div>

        {/* Lista agrupada */}
        {groups.length === 0 && <p className="text-[13px] text-brand-dark/40 text-center py-10">Sin cruzas que coincidan.</p>}
        {groups.map(([day, items]) => (
          <div key={day}>
            <p className="text-[11px] font-bold text-brand-dark/45 mb-1.5">{day} <span className="text-brand-dark/30">· {items.length}</span></p>
            <div className="space-y-2">
              {items.map(({ c, st }) => {
                const sc = statusConf[st];
                return (
                  <div key={c.id} onClick={() => navigate(`/crosses/${c.id}`)} className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                      {c.madre_imagen ? <img src={c.madre_imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={c.madre_especie} size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-brand-dark truncate">{fw(c.madre_nombre)} × {fw(c.padre_nombre)}</p>
                      <p className="text-[10.5px] text-brand-dark/45 italic truncate">{c.madre_especie} × {c.padre_especie}</p>
                    </div>
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${sc.cls}`}>{sc.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Exportar */}
        <button onClick={exportCSV} className="w-full flex items-center justify-center gap-2 border border-app-border text-brand-dark rounded-xl py-3 text-[14px] font-bold active:scale-95 transition-all">
          <Download size={16} className="text-[#C9A24B]" /> Exportar historial (CSV)
        </button>
      </div>
    </>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string; tone: string }> = ({ icon, value, label, tone }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-3 text-center">
    <span className={`flex justify-center mb-1 ${tone}`}>{icon}</span>
    <p className="text-[20px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9.5px] text-brand-dark/45 mt-1 leading-tight">{label}</p>
  </div>
);

export default MobileCrossHistory;
