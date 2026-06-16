import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import {
  Bell, Plus, ChevronDown, Flag, Leaf, CalendarDays, RotateCcw, Check, Trash2,
  Droplets, FlaskConical, Bug, Scissors, Clock3, AlertTriangle, CheckCircle2, Hourglass, X
} from 'lucide-react';

type Prioridad = 'alta' | 'media' | 'baja';

const tipoConf: Record<string, { label: string; icon: React.ReactNode }> = {
  riego: { label: 'Riego', icon: <Droplets size={16} /> },
  fertilizacion: { label: 'Fertilización', icon: <FlaskConical size={16} /> },
  control_plagas: { label: 'Control de plagas', icon: <Bug size={16} /> },
  poda: { label: 'Poda', icon: <Scissors size={16} /> },
  otro: { label: 'Recordatorio', icon: <Bell size={16} /> },
};

const prioConf: Record<Prioridad, { label: string; dot: string; text: string; bg: string }> = {
  alta: { label: 'Alta', dot: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
  media: { label: 'Media', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  baja: { label: 'Baja', dot: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
};

const alertTypes = [
  { value: 'riego', label: 'Riego' },
  { value: 'fertilizacion', label: 'Fertilización' },
  { value: 'control_plagas', label: 'Control de plagas' },
  { value: 'poda', label: 'Poda' },
  { value: 'otro', label: 'Otro' },
];

const fmtDate = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const relTime = (f: string) => {
  const diff = new Date(f).getTime() - Date.now();
  const abs = Math.abs(diff); const d = Math.floor(abs / 86400000); const h = Math.floor(abs / 3600000); const m = Math.floor(abs / 60000);
  const txt = d > 0 ? `${d} d` : h > 0 ? `${h} h` : `${m} min`;
  return diff < 0 ? `Venció hace ${txt}` : `En ${txt}`;
};

const AlertsScreen: React.FC = () => {
  const { alerts, plants, addAlert, completeAlert, deleteAlert } = useApp();

  const [fEstado, setFEstado] = useState<'todos' | 'pendientes' | 'completadas'>('pendientes');
  const [fPrioridad, setFPrioridad] = useState<'todas' | Prioridad>('todas');
  const [fPlanta, setFPlanta] = useState('todas');
  const [fFecha, setFFecha] = useState<'todas' | 'vencidas' | 'hoy' | 'proximas'>('todas');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ plantaId: '', tipo: 'riego', mensaje: '', prioridad: 'media' as Prioridad, fecha: '' });

  const now = Date.now();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  const in7 = now + 7 * 86400000;

  const plantBy = (nombre: string) => plants.find(p => p.nombre === nombre);

  const stats = useMemo(() => {
    const pend = alerts.filter(a => !a.completada);
    return {
      pendientes: pend.length,
      vencidas: pend.filter(a => new Date(a.fecha).getTime() < startToday.getTime()).length,
      proximas: pend.filter(a => { const t = new Date(a.fecha).getTime(); return t >= startToday.getTime() && t <= in7; }).length,
      completadas: alerts.filter(a => a.completada).length,
    };
  }, [alerts]);

  const filtered = useMemo(() => alerts.filter(a => {
    if (fEstado === 'pendientes' && a.completada) return false;
    if (fEstado === 'completadas' && !a.completada) return false;
    if (fPrioridad !== 'todas' && a.prioridad !== fPrioridad) return false;
    if (fPlanta !== 'todas' && a.planta !== fPlanta) return false;
    const t = new Date(a.fecha).getTime();
    if (fFecha === 'vencidas' && !(t < startToday.getTime())) return false;
    if (fFecha === 'hoy' && !(t >= startToday.getTime() && t <= endToday.getTime())) return false;
    if (fFecha === 'proximas' && !(t > endToday.getTime() && t <= in7)) return false;
    return true;
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [alerts, fEstado, fPrioridad, fPlanta, fFecha]);

  const sections = useMemo(() => {
    const vencidas: typeof filtered = [], hoy: typeof filtered = [], prox: typeof filtered = [], completadas: typeof filtered = [], futuras: typeof filtered = [];
    filtered.forEach(a => {
      if (a.completada) { completadas.push(a); return; }
      const t = new Date(a.fecha).getTime();
      if (t < startToday.getTime()) vencidas.push(a);
      else if (t <= endToday.getTime()) hoy.push(a);
      else if (t <= in7) prox.push(a);
      else futuras.push(a);
    });
    return { vencidas, hoy, prox, futuras, completadas };
  }, [filtered]);

  const resetFilters = () => { setFEstado('pendientes'); setFPrioridad('todas'); setFPlanta('todas'); setFFecha('todas'); };

  const saveAlert = () => {
    if (!form.mensaje || !form.fecha) return;
    const plant = plants.find(p => p.id === Number(form.plantaId));
    addAlert({
      tipo: form.tipo, planta: plant ? plant.nombre : 'General', mensaje: form.mensaje,
      prioridad: form.prioridad, fecha: new Date(form.fecha).toISOString(), completada: false,
      icon: form.tipo, color: 'from-blue-500 to-blue-600',
    } as any);
    setShowModal(false);
    setForm({ plantaId: '', tipo: 'riego', mensaje: '', prioridad: 'media', fecha: '' });
  };

  const Row: React.FC<{ a: any }> = ({ a }) => {
    const tc = tipoConf[a.tipo] || tipoConf.otro; const pc = prioConf[a.prioridad as Prioridad] || prioConf.media;
    const p = plantBy(a.planta); const vencida = !a.completada && new Date(a.fecha).getTime() < startToday.getTime();
    return (
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-app-bg/50 transition-colors">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pc.bg} ${pc.text}`}>{tc.icon}</span>
        <div className="min-w-0 w-56">
          <p className="text-[13.5px] font-bold text-brand-dark truncate">{a.mensaje}</p>
          <p className="text-[11.5px] text-brand-dark/45 truncate">{tc.label}</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 w-48 min-w-0">
          {a.planta && a.planta !== 'General' ? (
            <>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={p?.especie || ''} size={18} />}
              </div>
              <span className="text-[12px] italic text-brand-dark/55 truncate">{p?.especie || a.planta}</span>
            </>
          ) : <span className="text-[12px] text-brand-dark/35">General</span>}
        </div>
        <div className="hidden md:block w-28">
          <p className="text-[12px] text-brand-dark/60">{fmtDate(a.fecha)}</p>
          <p className={`text-[10.5px] ${vencida ? 'text-rose-500 font-semibold' : 'text-brand-dark/35'}`}>{relTime(a.fecha)}</p>
        </div>
        <div className="hidden sm:block w-20">
          <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${pc.text}`}><span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} /> {pc.label}</span>
        </div>
        <div className="flex-1" />
        {a.completada ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1"><CheckCircle2 size={13} /> Completada</span>
        ) : (
          <button onClick={() => completeAlert(a.id)} className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-brand-secondary border border-app-border rounded-lg px-3 py-1.5 hover:bg-brand-secondary hover:text-white transition-colors shrink-0"><Check size={13} /> Completar</button>
        )}
        <button onClick={() => { if (confirm('¿Eliminar esta alerta?')) deleteAlert(a.id); }} className="text-brand-dark/30 hover:text-rose-500 shrink-0"><Trash2 size={15} /></button>
      </div>
    );
  };

  const Section: React.FC<{ title: string; n: number; tone: string; items: any[] }> = ({ title, n, tone, items }) =>
    items.length === 0 ? null : (
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-app-border">
          <span className={`text-[11px] font-black uppercase tracking-wider ${tone}`}>{title}</span>
          <span className="text-[10px] font-black bg-app-bg text-brand-dark/50 rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{n}</span>
        </div>
        <div className="divide-y divide-app-border">{items.map(a => <Row key={a.id} a={a} />)}</div>
      </div>
    );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-alerts" size={26} />
        </div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Alertas</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Gestiona y da seguimiento a las tareas importantes de tu colección</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-5 py-2 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95">
          <Plus size={16} /> Nueva alerta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <FilterSelect icon={<CalendarDays size={14} />} label="Fecha" value={fFecha} onChange={v => setFFecha(v as any)}
          options={[['todas', 'Todas'], ['vencidas', 'Vencidas'], ['hoy', 'Hoy'], ['proximas', 'Próximas']]} />
        <FilterSelect icon={<Flag size={14} />} label="Prioridad" value={fPrioridad} onChange={v => setFPrioridad(v as any)}
          options={[['todas', 'Todas'], ['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']]} />
        <FilterSelect icon={<Leaf size={14} />} label="Planta" value={fPlanta} onChange={setFPlanta}
          options={[['todas', 'Todas'], ...plants.map(p => [p.nombre, p.nombre] as [string, string])]} />
        <FilterSelect icon={<Bell size={14} />} label="Estado" value={fEstado} onChange={v => setFEstado(v as any)}
          options={[['todos', 'Todos'], ['pendientes', 'Pendientes'], ['completadas', 'Completadas']]} />
        <button onClick={resetFilters} className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/50 hover:text-brand-dark px-3 py-2"><RotateCcw size={13} /> Limpiar filtros</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Hourglass size={18} />} value={stats.pendientes} label="Pendientes" sub="Requieren atención" tone="text-[#C9A24B]" />
        <StatCard icon={<AlertTriangle size={18} />} value={stats.vencidas} label="Vencidas" sub="Atención urgente" tone="text-rose-500" danger />
        <StatCard icon={<Clock3 size={18} />} value={stats.proximas} label="Próximas" sub="En los próximos 7 días" tone="text-amber-500" />
        <StatCard icon={<CheckCircle2 size={18} />} value={stats.completadas} label="Completadas" sub="En total" tone="text-emerald-500" />
      </div>

      {/* Secciones */}
      <div className="space-y-5">
        <Section title="Vencidas" n={sections.vencidas.length} tone="text-rose-600" items={sections.vencidas} />
        <Section title="Hoy" n={sections.hoy.length} tone="text-amber-600" items={sections.hoy} />
        <Section title="Próximos 7 días" n={sections.prox.length} tone="text-brand-secondary" items={sections.prox} />
        <Section title="Más adelante" n={sections.futuras.length} tone="text-brand-dark/50" items={sections.futuras} />
        <Section title="Completadas" n={sections.completadas.length} tone="text-emerald-600" items={sections.completadas} />
        {filtered.length === 0 && (
          <div className="bg-app-card border border-app-border rounded-2xl py-16 text-center">
            <Bell size={32} className="mx-auto text-brand-dark/20 mb-3" />
            <p className="text-[14px] font-bold text-brand-dark/50">Sin alertas</p>
            <p className="text-[12px] text-brand-dark/35">No hay tareas que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {/* Modal Nueva alerta */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-accent text-[22px] font-bold text-brand-dark">Nueva alerta</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Asociar a planta</label>
                <select value={form.plantaId} onChange={e => setForm({ ...form, plantaId: e.target.value })} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13.5px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer">
                  <option value="">General (sin planta)</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Fecha y hora *</label>
                <input type="datetime-local" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13.5px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Tipo de tarea</label>
                <div className="grid grid-cols-3 gap-2">
                  {alertTypes.map(t => (
                    <button key={t.value} onClick={() => setForm({ ...form, tipo: t.value })}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[12px] font-semibold transition-all ${form.tipo === t.value ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-app-border text-brand-dark/60 hover:bg-app-bg'}`}>
                      <span className="text-[#C9A24B]">{(tipoConf[t.value] || tipoConf.otro).icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Mensaje / tarea *</label>
                <input value={form.mensaje} onChange={e => setForm({ ...form, mensaje: e.target.value })} placeholder="Ej: Regar con agua destilada" className="w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13.5px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">Prioridad</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baja', 'media', 'alta'] as Prioridad[]).map(p => (
                    <button key={p} onClick={() => setForm({ ...form, prioridad: p })}
                      className={`rounded-xl border px-3 py-2 text-[12.5px] font-semibold capitalize transition-all ${form.prioridad === p ? `border-transparent ${prioConf[p].bg} ${prioConf[p].text}` : 'border-app-border text-brand-dark/55 hover:bg-app-bg'}`}>
                      {prioConf[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg">Cancelar</button>
                <button onClick={saveAlert} disabled={!form.mensaje || !form.fecha} className="flex-1 rounded-xl bg-brand-primary text-white py-2.5 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all disabled:opacity-50">Guardar alerta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{ icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; options: [string, string][] }> = ({ icon, label, value, onChange, options }) => (
  <div className="relative flex items-center gap-2 bg-app-card border border-app-border rounded-xl pl-3 pr-2 py-1.5">
    <span className="text-[#C9A24B]">{icon}</span>
    <div className="leading-tight">
      <p className="text-[10px] text-brand-dark/40">{label}</p>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-transparent pr-5 text-[12.5px] font-semibold text-brand-dark focus:outline-none cursor-pointer">
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; value: number; label: string; sub: string; tone: string; danger?: boolean }> = ({ icon, value, label, sub, tone, danger }) => (
  <div className={`bg-app-card border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 ${danger ? 'border-rose-200' : 'border-app-border'}`}>
    <div className="flex items-center justify-between mb-1">
      <span className={`text-[11px] font-black uppercase tracking-wider ${tone}`}>{label}</span>
      <span className={tone}>{icon}</span>
    </div>
    <p className="text-[30px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[11px] text-brand-dark/45 mt-1">{sub}</p>
  </div>
);

export default AlertsScreen;
