import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  Droplets, Scissors, FlaskConical, Eye, Bell, Sprout, Network, Package,
  AlertTriangle, Bot, Plus, NotebookPen, CloudSun, Check, ChevronRight, LayoutDashboard
} from "lucide-react";

const tipoIcon: Record<string, React.ReactNode> = {
  riego: <Droplets size={16} />,
  fertilizacion: <FlaskConical size={16} />,
  poda: <Scissors size={16} />,
  observacion: <Eye size={16} />,
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, alerts, diary, seedBank, climateLogs, completeAlert } = useApp();
  const { user } = useAuth();

  const today = new Date();
  const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);

  // Tareas: alertas no completadas, vencidas o de hoy, ordenadas por fecha
  const tareas = useMemo(() =>
    alerts
      .filter(a => !a.completada)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 6),
    [alerts]);

  // Requiere atención
  const semillasEstrat = useMemo(() =>
    seedBank.filter(s => s.estado === 'estratificando'), [seedBank]);
  const cruzasProceso = useMemo(() =>
    crosses.filter(c => c.estado === 'en_proceso'), [crosses]);
  const plantasRiesgo = useMemo(() =>
    plants.filter(p => p.estado === 'regular' || p.estado === 'critico'), [plants]);

  const actividad = useMemo(() =>
    [...diary].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 4),
    [diary]);

  const alertasPendientes = alerts.filter(a => !a.completada).length;
  const lastClimate = climateLogs[0];
  const climaData = useMemo(() =>
    [...climateLogs].slice(0, 12).reverse().map(c => ({ t: c.temp_max })), [climateLogs]);

  const fmtFecha = (f: string) => {
    const d = new Date(f);
    const venc = d.getTime() < today.getTime();
    return { txt: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), venc };
  };

  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );

  const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode; action?: () => void }> = ({ icon, children, action }) => (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-brand-primary">
        {icon} {children}
      </h3>
      {action && <button onClick={action} className="text-brand-dark/30 hover:text-brand-dark/60"><ChevronRight size={18} /></button>}
    </div>
  );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <LayoutIcon />
        <div>
          <h1 className="font-accent text-3xl font-bold text-brand-dark leading-none">Dashboard</h1>
          <p className="text-[12px] text-brand-dark/50 font-medium mt-1">
            Hola {user?.label?.split(' ')[0] || ''}, esto es lo que necesita tu colección hoy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== Columna principal ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tareas de hoy */}
          <Card>
            <SectionTitle icon={<Bell size={15} />} action={() => navigate('/alerts')}>Tareas de hoy</SectionTitle>
            <div className="divide-y divide-app-border">
              {tareas.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] text-brand-dark/40">Sin tareas pendientes. ¡Todo al día! 🌿</p>
              )}
              {tareas.map(a => {
                const f = fmtFecha(a.fecha);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-primary/8 text-brand-primary flex items-center justify-center shrink-0">
                      {tipoIcon[a.tipo?.toLowerCase()] || <Bell size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-brand-dark truncate">{a.mensaje}</p>
                      <p className="text-[11px] text-brand-dark/50 truncate">{a.planta}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${f.venc ? 'bg-red-50 text-red-600' : 'bg-app-bg text-brand-dark/60'}`}>
                      {f.venc ? 'Vencida' : f.txt}
                    </span>
                    <button
                      onClick={() => completeAlert(a.id)}
                      className="w-8 h-8 rounded-lg bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary hover:text-white flex items-center justify-center transition-colors shrink-0"
                      title="Marcar como hecha"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Requiere atención */}
          <Card>
            <SectionTitle icon={<AlertTriangle size={15} />}>Requiere atención</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-app-border">
              <AttentionCol icon={<Package size={16} />} label="Estratificando" items={semillasEstrat.map(s => s.nombre)} empty="Sin lotes activos" onClick={() => navigate('/seed-bank')} />
              <AttentionCol icon={<Network size={16} />} label="Cruzas en proceso" items={cruzasProceso.map(c => c.nombre)} empty="Sin cruzas activas" onClick={() => navigate('/crosses')} />
              <AttentionCol icon={<Sprout size={16} />} label="Plantas en riesgo" items={plantasRiesgo.map(p => p.nombre)} empty="Todas saludables" onClick={() => navigate('/plants')} danger />
            </div>
          </Card>

          {/* Actividad reciente */}
          <Card>
            <SectionTitle icon={<NotebookPen size={15} />} action={() => navigate('/diary')}>Actividad reciente</SectionTitle>
            <div className="divide-y divide-app-border">
              {actividad.length === 0 && (
                <p className="px-5 py-8 text-center text-[13px] text-brand-dark/40">Sin entradas en el diario todavía</p>
              )}
              {actividad.map(e => {
                const img = e.imagen || e.imagenes?.[0];
                return (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-11 h-11 rounded-lg bg-app-bg overflow-hidden shrink-0 flex items-center justify-center">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <NotebookPen size={16} className="text-brand-dark/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-brand-dark truncate">{e.planta_nombre}</p>
                      <p className="text-[11px] text-brand-dark/50 truncate capitalize">{e.tipo} · {e.descripcion}</p>
                    </div>
                    <span className="text-[11px] text-brand-dark/40">{new Date(e.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction icon={<Plus size={18} />} label="Nueva planta" primary onClick={() => navigate('/add')} />
            <QuickAction icon={<NotebookPen size={18} />} label="Nueva entrada" onClick={() => navigate('/diary')} />
            <QuickAction icon={<Bot size={18} />} label="CarniBot" onClick={() => navigate('/ai')} />
          </div>
        </div>

        {/* ===== Panel derecho ===== */}
        <div className="space-y-6">
          {/* Clima de hoy */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-brand-primary mb-3">
              <CloudSun size={15} /> Clima de hoy
            </h3>
            {lastClimate ? (
              <>
                <div className="flex items-end gap-4 mb-3">
                  <div>
                    <p className="text-3xl font-black text-brand-dark leading-none">{Math.round(lastClimate.temp_max)}°<span className="text-lg">C</span></p>
                    <p className="text-[11px] text-brand-dark/50 mt-1">Temperatura</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-brand-secondary leading-none">{lastClimate.humidity}<span className="text-lg">%</span></p>
                    <p className="text-[11px] text-brand-dark/50 mt-1">Humedad</p>
                  </div>
                </div>
                {climaData.length > 1 && (
                  <div className="h-16 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={climaData}>
                        <defs>
                          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="t" stroke="var(--color-brand-primary)" strokeWidth={2} fill="url(#g)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/climate')} className="text-[12px] text-brand-primary font-bold">Registrar clima →</button>
            )}
          </Card>

          {/* Números */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox value={plants.length} label="Plantas" icon={<Sprout size={16} />} onClick={() => navigate('/plants')} />
            <StatBox value={cruzasProceso.length} label="Cruzas activas" icon={<Network size={16} />} onClick={() => navigate('/crosses')} />
            <StatBox value={semillasEstrat.length} label="Estratificando" icon={<Package size={16} />} onClick={() => navigate('/seed-bank')} />
            <StatBox value={alertasPendientes} label="Alertas" icon={<Bell size={16} />} danger={alertasPendientes > 0} onClick={() => navigate('/alerts')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const LayoutIcon = () => (
  <div className="w-11 h-11 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
    <LayoutDashboard size={22} />
  </div>
);

const AttentionCol: React.FC<{ icon: React.ReactNode; label: string; items: string[]; empty: string; onClick: () => void; danger?: boolean }> =
  ({ icon, label, items, empty, onClick, danger }) => (
    <button onClick={onClick} className="bg-app-card text-left p-4 hover:bg-app-bg/50 transition-colors">
      <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wide mb-2 ${danger ? 'text-red-600' : 'text-brand-secondary'}`}>
        {icon} {label}
        <span className="ml-auto text-base font-black">{items.length}</span>
      </div>
      <div className="space-y-1">
        {items.length === 0
          ? <p className="text-[11px] text-brand-dark/35">{empty}</p>
          : items.slice(0, 3).map((n, i) => <p key={i} className="text-[12px] text-brand-dark/70 truncate">· {n}</p>)}
        {items.length > 3 && <p className="text-[11px] text-brand-dark/40">+{items.length - 3} más</p>}
      </div>
    </button>
  );

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }> =
  ({ icon, label, onClick, primary }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[13px] transition-all active:scale-95 ${primary
        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:brightness-110'
        : 'bg-app-card border border-app-border text-brand-dark hover:bg-app-bg'}`}
    >
      {icon} {label}
    </button>
  );

const StatBox: React.FC<{ value: number; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }> =
  ({ value, label, icon, onClick, danger }) => (
    <button onClick={onClick} className="bg-app-card border border-app-border rounded-2xl p-4 text-left hover:bg-app-bg/50 transition-colors">
      <div className={`${danger ? 'text-red-500' : 'text-brand-secondary'} mb-2`}>{icon}</div>
      <p className="text-2xl font-black text-brand-dark leading-none">{value}</p>
      <p className="text-[11px] text-brand-dark/50 font-medium mt-1">{label}</p>
    </button>
  );

export default Dashboard;
