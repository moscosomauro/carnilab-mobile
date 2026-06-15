import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AssetIcon } from "../components/AssetIcon";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import {
  Droplets, Scissors, FlaskConical, Eye, ClipboardCheck, AlertTriangle,
  Leaf, Hourglass, Package, Bell, Plus, NotebookPen, Bot, ChevronDown, ChevronRight, Check
} from "lucide-react";
import { Plant } from "../types";

const tipoIcon: Record<string, React.ReactNode> = {
  riego: <Droplets size={15} />,
  fertilizacion: <FlaskConical size={15} />,
  poda: <Scissors size={15} />,
  observacion: <Eye size={15} />,
};
const tipoLabel: Record<string, string> = {
  riego: "Riego", fertilizacion: "Fertilización", poda: "Poda", observacion: "Observación",
};
const tipoBadge: Record<string, string> = {
  riego: "bg-sky-50 text-sky-600",
  fertilizacion: "bg-amber-50 text-amber-600",
  poda: "bg-rose-50 text-rose-600",
  observacion: "bg-emerald-50 text-emerald-600",
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, alerts, diary, seedBank, climateLogs, completeAlert } = useApp();

  const now = new Date();
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);

  const plantBy = (nombre: string) => plants.find(p => p.nombre?.trim() === nombre?.trim());

  const pendientes = useMemo(() => alerts.filter(a => !a.completada), [alerts]);
  const tareasHoy = useMemo(() =>
    pendientes.filter(a => new Date(a.fecha).getTime() >= startToday.getTime())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [pendientes]);
  const vencidas = useMemo(() =>
    pendientes.filter(a => new Date(a.fecha).getTime() < startToday.getTime())
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [pendientes]);

  const semillasEstrat = useMemo(() => seedBank.filter(s => s.estado === 'estratificando'), [seedBank]);
  const cruzasProceso = useMemo(() => crosses.filter(c => c.estado === 'en_proceso'), [crosses]);
  const plantasRiesgo = useMemo(() => plants.filter(p => p.estado === 'regular' || p.estado === 'critico'), [plants]);
  const actividad = useMemo(() =>
    [...diary].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 4), [diary]);

  const lastClimate = climateLogs[0];
  const climaData = useMemo(() => [...climateLogs].slice(0, 14).reverse().map(c => ({ t: c.temp_max })), [climateLogs]);

  const diasRestantes = (fin?: string) => {
    if (!fin) return null;
    return Math.max(0, Math.ceil((new Date(fin).getTime() - now.getTime()) / 86400000));
  };
  const fmtDM = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  const fmtFechaLarga = now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- sub-componentes ----
  const Avatar: React.FC<{ p?: Plant; fallback?: string }> = ({ p, fallback }) => (
    <div className="w-9 h-9 rounded-full bg-app-bg overflow-hidden shrink-0 flex items-center justify-center border border-app-border">
      {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" />
        : <span className="text-[12px] font-black text-brand-dark/30">{(fallback || p?.nombre || '?').charAt(0).toUpperCase()}</span>}
    </div>
  );

  const TaskRow: React.FC<{ a: any; overdue?: boolean }> = ({ a, overdue }) => {
    const p = plantBy(a.planta);
    const tipo = a.tipo?.toLowerCase();
    return (
      <div className="flex items-center gap-3 px-5 py-3">
        <Avatar p={p} fallback={a.planta} />
        <div className="w-40 min-w-0">
          <p className="text-[13px] font-bold text-brand-dark truncate">{a.planta}</p>
          <p className="text-[11px] italic text-brand-dark/45 truncate">{p?.especie || ''}</p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 w-32 text-brand-secondary">
          {tipoIcon[tipo] || <Bell size={15} />}
          <span className="text-[12px] font-semibold">{tipoLabel[tipo] || a.tipo}</span>
        </div>
        <div className="w-28 hidden lg:block">
          {overdue
            ? <span className="text-[11px] font-bold text-brand-accent">Vencida<br /><span className="font-normal opacity-70">desde {fmtDM(a.fecha)}</span></span>
            : <span className="text-[11px] font-bold text-brand-dark/60">Vence<br /><span className="font-normal">Hoy</span></span>}
        </div>
        <p className="flex-1 text-[12px] text-brand-dark/55 truncate hidden xl:block">{a.mensaje}</p>
        <button onClick={() => completeAlert(a.id)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-brand-secondary border border-app-border rounded-lg px-3 py-1.5 hover:bg-brand-secondary hover:text-white transition-colors shrink-0">
          <Check size={13} /> Marcar hecho
        </button>
      </div>
    );
  };

  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>
  );
  const Head: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-brand-primary">
      <span className="text-[#C9A24B]">{icon}</span> {title}
    </h3>
  );
  const VerTodas: React.FC<{ n: number; to: string }> = ({ n, to }) => (
    <button onClick={() => navigate(to)} className="flex items-center gap-1 text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary mt-2">
      Ver todas ({n}) <ChevronRight size={13} />
    </button>
  );

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-home" size={26} />
        </div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Dashboard</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Resumen del cultivo y tareas clave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Columna principal ===== */}
        <div className="xl:col-span-8 space-y-5">

          {/* Tareas de hoy */}
          <Card>
            <div className="px-5 pt-4 pb-3"><Head icon={<ClipboardCheck size={15} />} title="Tareas de hoy" /></div>

            <p className="px-5 pb-1 text-[11px] font-bold text-brand-dark/40 uppercase tracking-wide">Hoy — {fmtFechaLarga}</p>
            <div className="divide-y divide-app-border">
              {tareasHoy.length === 0
                ? <p className="px-5 py-5 text-center text-[12px] text-brand-dark/35">No hay tareas para hoy 🌿</p>
                : tareasHoy.map(a => <TaskRow key={a.id} a={a} />)}
            </div>

            {vencidas.length > 0 && (
              <>
                <p className="px-5 pt-3 pb-1 text-[11px] font-bold text-brand-accent/80 uppercase tracking-wide">Vencidas</p>
                <div className="divide-y divide-app-border">
                  {vencidas.map(a => <TaskRow key={a.id} a={a} overdue />)}
                </div>
              </>
            )}
          </Card>

          {/* Requiere atención */}
          <div>
            <div className="px-1 pb-3"><Head icon={<AlertTriangle size={15} />} title="Requiere atención" /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estratificación */}
              <Card className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-brand-secondary mb-3"><Leaf size={14} /> Semillas por terminar estratificación</p>
                <div className="space-y-2">
                  {semillasEstrat.length === 0 && <p className="text-[11px] text-brand-dark/35">Sin lotes activos</p>}
                  {semillasEstrat.slice(0, 3).map(s => {
                    const d = diasRestantes((s as any).fin_estratificacion);
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-brand-dark/75 truncate">· {s.nombre}</span>
                        {d != null && <span className="text-[10px] font-bold bg-app-bg text-brand-dark/60 rounded px-1.5 py-0.5 shrink-0">{d} días</span>}
                      </div>
                    );
                  })}
                </div>
                {semillasEstrat.length > 0 && <VerTodas n={semillasEstrat.length} to="/seed-bank" />}
              </Card>

              {/* Cruzas */}
              <Card className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-brand-secondary mb-3"><AssetIcon name="icon-crosses" size={14} /> Cruzas en proceso</p>
                <div className="space-y-2">
                  {cruzasProceso.length === 0 && <p className="text-[11px] text-brand-dark/35">Sin cruzas activas</p>}
                  {cruzasProceso.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-brand-dark/75 truncate">{c.nombre}</span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-600 rounded px-1.5 py-0.5 shrink-0">En proceso</span>
                    </div>
                  ))}
                </div>
                {cruzasProceso.length > 0 && <VerTodas n={cruzasProceso.length} to="/crosses" />}
              </Card>

              {/* Plantas riesgo */}
              <Card className="p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-black text-brand-accent mb-3"><AlertTriangle size={14} /> Plantas en estado regular / crítico</p>
                <div className="space-y-2">
                  {plantasRiesgo.length === 0 && <p className="text-[11px] text-brand-dark/35">Todas saludables</p>}
                  {plantasRiesgo.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-brand-dark/75 truncate">· {p.nombre}</span>
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 ${p.estado === 'critico' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        {p.estado === 'critico' ? 'Crítico' : 'Regular'}
                      </span>
                    </div>
                  ))}
                </div>
                {plantasRiesgo.length > 0 && <VerTodas n={plantasRiesgo.length} to="/plants" />}
              </Card>
            </div>
          </div>

          {/* Actividad + Accesos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <div className="px-5 pt-4 pb-3"><Head icon={<NotebookPen size={15} />} title="Actividad reciente" /></div>
              <div className="divide-y divide-app-border">
                {actividad.length === 0 && <p className="px-5 py-5 text-center text-[12px] text-brand-dark/35">Sin entradas todavía</p>}
                {actividad.map(e => {
                  const p = plantBy(e.planta_nombre);
                  const tipo = e.tipo?.toLowerCase();
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar p={p} fallback={e.planta_nombre} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-brand-dark truncate">{e.planta_nombre}</p>
                        <p className="text-[11px] italic text-brand-dark/45 truncate">{p?.especie || e.descripcion}</p>
                      </div>
                      <span className={`text-[10px] font-bold rounded-md px-2 py-1 ${tipoBadge[tipo] || 'bg-app-bg text-brand-dark/50'}`}>{tipoLabel[tipo] || e.tipo}</span>
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-brand-dark/55">{fmtDM(e.fecha)}</p>
                        <p className="text-[10px] text-brand-dark/35">{new Date(e.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate('/diary')} className="flex items-center gap-1 text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary px-5 py-3">
                Ver todas las entradas <ChevronRight size={13} />
              </button>
            </Card>

            <Card className="p-4">
              <div className="mb-3"><Head icon={<Plus size={15} />} title="Accesos rápidos" /></div>
              <div className="space-y-2.5">
                <button onClick={() => navigate('/add')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-secondary text-white font-bold text-[13px] shadow-md shadow-brand-secondary/20 hover:brightness-110 transition-all active:scale-95">
                  <Plus size={17} /> Nueva planta
                </button>
                <button onClick={() => navigate('/diary')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-app-card border border-app-border text-brand-dark font-bold text-[13px] hover:bg-app-bg transition-all active:scale-95">
                  <NotebookPen size={16} /> Nueva entrada
                </button>
                <button onClick={() => navigate('/ai')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-app-card border border-app-border text-brand-dark font-bold text-[13px] hover:bg-app-bg transition-all active:scale-95">
                  <Bot size={16} /> CarniBot
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* ===== Columna derecha ===== */}
        <div className="xl:col-span-4 space-y-5">
          {/* Clima */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Head icon={<AssetIcon name="icon-climate" size={15} />} title="Clima de hoy" />
              <span className="flex items-center gap-1 text-[10px] font-bold text-brand-dark/50 border border-app-border rounded-lg px-2 py-1">
                Mi cultivo <ChevronDown size={12} />
              </span>
            </div>
            {lastClimate ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-[34px] font-black text-brand-dark leading-none">{Math.round(lastClimate.temp_max)}°<span className="text-xl">C</span></p>
                    <p className="text-[11px] text-brand-dark/45 mt-1">Parcialmente nublado</p>
                  </div>
                  <div>
                    <p className="text-[34px] font-black text-brand-dark leading-none">{lastClimate.humidity}<span className="text-xl">%</span></p>
                    <p className="text-[11px] text-brand-dark/45 mt-1">Humedad relativa</p>
                  </div>
                </div>
                {climaData.length > 1 && (
                  <div className="h-20 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={climaData}>
                        <defs>
                          <linearGradient id="climaG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                        <Area type="monotone" dataKey="t" stroke="var(--color-brand-primary)" strokeWidth={2} fill="url(#climaG)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => navigate('/climate')} className="text-[12px] text-brand-primary font-bold">Registrar clima →</button>
            )}
          </Card>

          {/* Stats 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            <StatBox icon={<Leaf size={18} />} value={plants.length} label="Plantas" sub="En tu colección" onClick={() => navigate('/plants')} />
            <StatBox icon={<Hourglass size={18} />} value={cruzasProceso.length} label="Cruzas activas" sub="En progreso" onClick={() => navigate('/crosses')} />
            <StatBox icon={<Package size={18} />} value={semillasEstrat.length} label="Semillas en proceso" sub="En estratificación" onClick={() => navigate('/seed-bank')} />
            <StatBox icon={<Bell size={18} />} value={pendientes.length} label="Alertas pendientes" sub="Requieren tu atención" danger onClick={() => navigate('/alerts')} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ icon: React.ReactNode; value: number; label: string; sub: string; onClick: () => void; danger?: boolean }> =
  ({ icon, value, label, sub, onClick, danger }) => (
    <button onClick={onClick} className="bg-app-card border border-app-border rounded-2xl p-4 text-center hover:bg-app-bg/40 transition-colors flex flex-col items-center">
      <span className={`${danger ? 'text-brand-accent' : 'text-brand-secondary'} mb-1`}>{icon}</span>
      <p className="text-[12px] text-brand-dark/55 font-medium">{label}</p>
      <p className="text-[30px] font-black text-brand-dark leading-tight my-0.5">{value}</p>
      <p className={`text-[10px] font-semibold ${danger ? 'text-brand-accent' : 'text-brand-secondary'}`}>{sub}</p>
    </button>
  );

export default Dashboard;
