import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { Cross } from '../../types';
import {
  CalendarClock, CheckCircle2, Hourglass, Plus, FlaskConical, History,
  Check, Dna, Sprout
} from 'lucide-react';

type PolStatus = 'programada' | 'pendiente' | 'hecha' | 'vencida';

// Estado de polinización mostrado: usa el campo nuevo y, si no, deduce del legado.
const polStatus = (c: Cross): PolStatus => {
  if (c.estado_polinizacion) {
    if (c.estado_polinizacion !== 'hecha' && c.fecha_programada &&
        new Date(c.fecha_programada).setHours(23, 59, 59, 999) < Date.now()) return 'vencida';
    return c.estado_polinizacion;
  }
  if (c.estado === 'completada') return 'hecha';
  return 'pendiente';
};

const statusConf: Record<PolStatus, { label: string; cls: string }> = {
  programada: { label: 'Programada', cls: 'bg-[#C9A24B]/15 text-[#9a7b2f]' },
  pendiente: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-600' },
  hecha: { label: 'Hecha', cls: 'bg-brand-primary/10 text-brand-primary' },
  vencida: { label: 'Vencida', cls: 'bg-rose-50 text-rose-600' },
};

const isToday = (d?: string) => !!d && new Date(d).toDateString() === new Date().toDateString();
const fmtDay = (d?: string) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—';

const MobilePollinationList: React.FC = () => {
  const navigate = useNavigate();
  const { crosses, updateCross } = useApp();
  const [tab, setTab] = useState<'hoy' | 'pendientes' | 'hechas'>('pendientes');

  const withStatus = useMemo(() => crosses.map(c => ({ c, st: polStatus(c) })), [crosses]);

  const stats = useMemo(() => ({
    programadas: withStatus.filter(x => x.st === 'programada').length,
    hechas: withStatus.filter(x => x.st === 'hecha').length,
    pendientes: withStatus.filter(x => x.st === 'pendiente' || x.st === 'vencida').length,
  }), [withStatus]);

  const list = useMemo(() => {
    const f = withStatus.filter(({ c, st }) => {
      if (tab === 'hechas') return st === 'hecha';
      if (tab === 'hoy') return st !== 'hecha' && isToday(c.fecha_programada || c.fecha_cruza);
      return st !== 'hecha'; // pendientes (incluye programadas y vencidas)
    });
    return f.sort((a, b) => {
      const da = new Date(a.c.fecha_programada || a.c.fecha_cruza).getTime();
      const db = new Date(b.c.fecha_programada || b.c.fecha_cruza).getTime();
      return tab === 'hechas' ? db - da : da - db;
    });
  }, [withStatus, tab]);

  const toggleDone = (c: Cross, e: React.MouseEvent) => {
    e.stopPropagation();
    const done = polStatus(c) === 'hecha';
    updateCross({
      ...c,
      estado_polinizacion: done ? 'pendiente' : 'hecha',
      estado: done ? 'en_proceso' : 'completada',
      fecha_polinizacion: done ? c.fecha_polinizacion : (c.fecha_polinizacion || new Date().toISOString()),
    } as Cross);
  };

  return (
    <>
      <MobileHeader title="Cruzas" subtitle="Gestión de polinización" />

      <div className="px-5 space-y-5 pb-28">
        {/* Contadores */}
        <div className="grid grid-cols-3 gap-2.5">
          <Stat icon={<CalendarClock size={17} />} value={stats.programadas} label="Programadas" tone="text-[#9a7b2f]" />
          <Stat icon={<CheckCircle2 size={17} />} value={stats.hechas} label="Hechas" tone="text-emerald-600" />
          <Stat icon={<Hourglass size={17} />} value={stats.pendientes} label="Pendientes" tone="text-amber-600" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-app-bg rounded-xl p-1">
          {([['hoy', 'Hoy'], ['pendientes', 'Pendientes'], ['hechas', 'Hechas']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2 rounded-lg text-[12.5px] font-bold transition-colors ${tab === k ? 'bg-app-card text-brand-primary shadow-sm' : 'text-brand-dark/45'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Listado */}
        <div className="space-y-2">
          {list.length === 0 && (
            <div className="bg-app-card border border-app-border rounded-xl py-10 text-center">
              <Sprout size={28} className="mx-auto text-brand-dark/20 mb-2" />
              <p className="text-[13px] font-bold text-brand-dark/50">Sin cruzas {tab === 'hechas' ? 'hechas' : tab === 'hoy' ? 'para hoy' : 'pendientes'}</p>
              <p className="text-[11.5px] text-brand-dark/35">Tocá “Nueva cruza” para planificar una.</p>
            </div>
          )}
          {list.map(({ c, st }) => {
            const sc = statusConf[st];
            return (
              <div key={c.id}
                className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5 text-left">
                <button onClick={e => toggleDone(c, e)}
                  className={`w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${st === 'hecha' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-app-border text-transparent'}`}>
                  <Check size={14} />
                </button>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                  {c.madre_imagen ? <img src={c.madre_imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={c.madre_especie} size={22} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-brand-dark truncate">{c.madre_nombre.split(' ')[0]} × {c.padre_nombre.split(' ')[0]}</p>
                  <p className="text-[11px] text-brand-dark/45 italic truncate">{c.madre_especie} × {c.padre_especie}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${sc.cls}`}>{sc.label}</span>
                  <span className="text-[10px] text-brand-dark/40">{fmtDay(c.fecha_programada || c.fecha_cruza)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acciones rápidas */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2">Acciones rápidas</p>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction icon={<Plus size={20} />} label="Nueva cruza" color="#10B981" onClick={() => navigate('/crosses/new')} />
            <QuickAction icon={<FlaskConical size={20} />} label="Registrar polinización" color="#A8323E" soon />
            <QuickAction icon={<History size={20} />} label="Ver historial" color="#9a7b2f" soon />
          </div>
        </div>

        {/* Botón principal */}
        <button onClick={() => navigate('/crosses/new')}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all">
          <Dna size={18} /> Nueva cruza
        </button>
      </div>
    </>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: number; label: string; tone: string }> = ({ icon, value, label, tone }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-3 text-center">
    <span className={`flex justify-center mb-1 ${tone}`}>{icon}</span>
    <p className="text-[22px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9.5px] text-brand-dark/45 mt-1 leading-tight">{label}</p>
  </div>
);

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; color: string; onClick?: () => void; soon?: boolean }> = ({ icon, label, color, onClick, soon }) => (
  <button onClick={soon ? undefined : onClick} disabled={soon}
    className={`relative flex flex-col items-center gap-1.5 bg-app-card border border-app-border rounded-xl py-3 px-1 ${soon ? 'opacity-50' : 'active:scale-95'} transition-all`}>
    <span className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ color, background: `${color}1A` }}>{icon}</span>
    <span className="text-[10px] font-semibold text-brand-dark/65 text-center leading-tight">{label}</span>
    {soon && <span className="absolute top-1 right-1 text-[8px] font-black bg-app-bg text-brand-dark/40 rounded-full px-1.5 py-0.5">PRONTO</span>}
  </button>
);

export default MobilePollinationList;
