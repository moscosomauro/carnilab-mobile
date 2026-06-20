import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cloudConfigured, cloudReady, getCloudLastSync, syncCloudNow } from '../../db/syncCloud';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import {
  Droplets, FlaskConical, Scissors, Eye, Bug, Bell, Leaf, Dna, Bot,
  Hourglass, Snowflake, Cloud, CloudOff, RefreshCw, ChevronRight, Check, Star
} from 'lucide-react';

const tipoConf: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  riego: { label: 'Riego', icon: <Droplets size={13} />, color: '#3B82F6' },
  fertilizacion: { label: 'Fertilización', icon: <FlaskConical size={13} />, color: '#10B981' },
  poda: { label: 'Poda', icon: <Scissors size={13} />, color: '#F97316' },
  observacion: { label: 'Observación', icon: <Eye size={13} />, color: '#8B5CF6' },
  control_plagas: { label: 'Control de plagas', icon: <Bug size={13} />, color: '#A8323E' },
  otro: { label: 'Recordatorio', icon: <Bell size={13} />, color: '#9a7b2f' },
};

const timing = (fecha: string) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const d = Math.round((new Date(fecha).setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
  if (d < 0) return { label: `Vencido · ${Math.abs(d)} ${Math.abs(d) === 1 ? 'día' : 'días'}`, cls: 'bg-rose-50 text-rose-600' };
  if (d === 0) return { label: 'Hoy', cls: 'bg-amber-50 text-amber-600' };
  if (d === 1) return { label: 'Mañana', cls: 'bg-sky-50 text-sky-600' };
  return { label: `En ${d} días`, cls: 'bg-app-bg text-brand-dark/50' };
};

const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, seedBank, alerts, fetchData } = useApp();
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? '¡Buenos días, cultivador! 🌿' : h < 19 ? '¡Buenas tardes, cultivador! 🌿' : '¡Buenas noches, cultivador! 🌿'; })();

  const pend = useMemo(() => alerts.filter(a => !a.completada).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [alerts]);
  const cruzasAct = crosses.filter(c => c.estado === 'en_proceso').length;
  const estrat = seedBank.filter(s => s.estado === 'estratificando').length;
  const plantBy = (n: string) => plants.find(p => p.nombre === n);

  const actions = [
    { label: 'Nueva entrada', icon: <Droplets size={20} />, color: '#3B82F6', to: '/diary' },
    { label: 'Agregar planta', icon: <Leaf size={20} />, color: '#10B981', to: '/add' },
    { label: 'Registrar cruza', icon: <Dna size={20} />, color: '#A8323E', to: '/crosses' },
    { label: 'CarniBot', icon: <Bot size={20} />, color: '#8B5CF6', to: '/ai' },
  ];

  return (
    <>
      <MobileHeader title="Inicio" subtitle={greeting} />
      <div className="px-5 -mt-1 mb-3 text-[11.5px] text-brand-dark/40">{new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div className="px-5 space-y-5">
        {/* Tareas de hoy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><Bell size={14} /></span> Tareas de hoy</p>
            <button onClick={() => navigate('/alerts')} className="text-[11px] font-bold text-brand-primary/70">Ver todas</button>
          </div>
          <div className="space-y-2">
            {pend.length === 0 && <p className="text-[12.5px] text-brand-dark/35 bg-app-card border border-app-border rounded-xl px-4 py-3">No hay tareas pendientes 🌿</p>}
            {pend.slice(0, 4).map(a => {
              const tc = tipoConf[a.tipo] || tipoConf.otro; const p = plantBy(a.planta); const t = timing(a.fecha);
              return (
                <button key={a.id} onClick={() => navigate('/alerts')} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5 text-left">
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                    {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={p?.especie || ''} size={26} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-brand-dark truncate">{a.planta}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: tc.color }}>{tc.icon} {tc.label}</span>
                  </div>
                  <span className={`text-[10.5px] font-semibold rounded-full px-2 py-1 shrink-0 ${t.cls}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2"><span className="text-[#C9A24B]"><Star size={14} /></span> Acciones rápidas</p>
          <div className="grid grid-cols-4 gap-2">
            {actions.map(a => (
              <button key={a.to} onClick={() => navigate(a.to)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
                <span className="w-14 h-14 rounded-2xl bg-app-card border border-app-border flex items-center justify-center" style={{ color: a.color }}>{a.icon}</span>
                <span className="text-[10px] font-semibold text-brand-dark/65 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2"><span className="text-[#C9A24B]"><Leaf size={14} /></span> Resumen</p>
          <div className="grid grid-cols-4 gap-2">
            <Mini icon={<Leaf size={16} />} value={plants.length} label="Total plantas" />
            <Mini icon={<Hourglass size={16} />} value={cruzasAct} label="Cruzas activas" />
            <Mini icon={<Snowflake size={16} />} value={estrat} label="En estratificación" />
            <Mini icon={<Bell size={16} />} value={pend.length} label="Alertas" danger />
          </div>
        </div>

        {/* Sincronización con la nube */}
        <div>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2"><span className="text-[#C9A24B]"><Cloud size={14} /></span> Sincronización</p>
          <SyncCard onManage={() => navigate('/sync')} onSynced={fetchData} />
        </div>
      </div>
    </>
  );
};

// Tarjeta de sincronización con la nube: muestra estado, última sync y un botón
// "Sincronizar ahora" con confirmación visible (lo que pedía faltar en el móvil).
const SyncCard: React.FC<{ onManage: () => void; onSynced: () => void }> = ({ onManage, onSynced }) => {
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [last, setLast] = useState(getCloudLastSync());
  const [msg, setMsg] = useState<string | null>(null);
  const ready = cloudReady();

  const fmt = (t: number) => t ? new Date(t).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca';

  const doSync = async () => {
    if (!ready || state === 'busy') return;
    setState('busy'); setMsg(null);
    const r = await syncCloudNow();
    if (r.ok) {
      setLast(getCloudLastSync());
      setState('ok'); setMsg('Sincronizado con la nube');
      onSynced();
      setTimeout(() => setState('idle'), 3500);
    } else {
      setState('err'); setMsg(r.error || 'No se pudo sincronizar');
      setTimeout(() => setState('idle'), 5000);
    }
  };

  if (!cloudConfigured) {
    return (
      <button onClick={onManage} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-4 py-3">
        <CloudOff size={18} className="text-brand-dark/40 shrink-0" />
        <span className="flex-1 text-left text-[12.5px] font-bold text-brand-dark/60">Sincronización por Wi-Fi</span>
        <ChevronRight size={16} className="text-brand-dark/30" />
      </button>
    );
  }

  return (
    <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
      <button onClick={onManage} className="w-full flex items-center gap-3 px-4 py-3">
        <Cloud size={18} className={`shrink-0 ${ready ? 'text-emerald-600' : 'text-[#C9A24B]'}`} />
        <div className="flex-1 text-left min-w-0">
          <p className="text-[12.5px] font-bold text-brand-dark">{ready ? 'Conectado a la nube' : 'Sin código de espacio'}</p>
          <p className="text-[11px] text-brand-dark/45 truncate">Última sync: {fmt(last)}</p>
        </div>
        {ready
          ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-1 shrink-0"><Check size={12} /> Activo</span>
          : <ChevronRight size={16} className="text-brand-dark/30" />}
      </button>
      <div className="border-t border-app-border px-3 py-2.5">
        <button onClick={doSync} disabled={!ready || state === 'busy'}
          className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50
            ${state === 'ok' ? 'bg-emerald-50 text-emerald-700' : state === 'err' ? 'bg-rose-50 text-rose-600' : 'bg-brand-primary text-white'}`}>
          {state === 'busy' ? <><RefreshCw size={15} className="animate-spin" /> Sincronizando…</>
            : state === 'ok' ? <><Check size={15} /> {msg}</>
            : state === 'err' ? <>{msg}</>
            : <><RefreshCw size={15} /> Sincronizar ahora</>}
        </button>
      </div>
    </div>
  );
};

const Mini: React.FC<{ icon: React.ReactNode; value: number; label: string; danger?: boolean }> = ({ icon, value, label, danger }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-2.5 text-center">
    <span className={`flex justify-center mb-0.5 ${danger ? 'text-brand-accent' : 'text-brand-secondary'}`}>{icon}</span>
    <p className="text-[18px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9px] text-brand-dark/45 mt-0.5 leading-tight">{label}</p>
  </div>
);

export default MobileHome;
