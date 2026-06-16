import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AssetIcon } from '../components/AssetIcon';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Thermometer, Droplets, Plus, X, ChevronDown, ChevronLeft, ChevronRight, Cloud } from 'lucide-react';

const fmtDT = (f: string) => new Date(f).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const fmtD = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

// Punto de rocío (Magnus) y VPD (kPa)
const dewPoint = (T: number, RH: number) => { const a = 17.27, b = 237.7; const g = (a * T) / (b + T) + Math.log(Math.max(1, RH) / 100); return (b * g) / (a - g); };
const vpd = (T: number, RH: number) => { const svp = 0.6108 * Math.exp((17.27 * T) / (T + 237.3)); return svp * (1 - RH / 100); };

const ClimateScreen: React.FC = () => {
  const { climateLogs, addClimateLog } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], temp_max: '', temp_min: '', humidity: '', notes: '' });
  const [page, setPage] = useState(1);
  const perPage = 10;

  const sorted = useMemo(() => [...climateLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [climateLogs]);
  const chartData = useMemo(() => [...sorted].slice(0, 30).reverse().map(c => ({ t: fmtD(c.date), temp: c.temp_max, hum: c.humidity })), [sorted]);

  const tStats = useMemo(() => {
    if (!sorted.length) return null;
    const arr = sorted.map(c => c.temp_max);
    return { actual: sorted[0].temp_max, prom: arr.reduce((a, b) => a + b, 0) / arr.length, max: Math.max(...arr), min: Math.min(...arr) };
  }, [sorted]);
  const hStats = useMemo(() => {
    if (!sorted.length) return null;
    const arr = sorted.map(c => c.humidity);
    return { actual: sorted[0].humidity, prom: arr.reduce((a, b) => a + b, 0) / arr.length, max: Math.max(...arr), min: Math.min(...arr) };
  }, [sorted]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageItems = sorted.slice((page - 1) * perPage, page * perPage);

  const save = async () => {
    if (!form.temp_max || !form.temp_min || !form.humidity) return;
    await addClimateLog({ date: new Date(form.date).toISOString(), temp_max: Number(form.temp_max), temp_min: Number(form.temp_min), humidity: Number(form.humidity), notes: form.notes } as any);
    setShowModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], temp_max: '', temp_min: '', humidity: '', notes: '' });
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-climate" size={26} /></div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Clima</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Monitorea el histórico de temperatura y humedad de tu cultivo</p>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-[12px] font-semibold text-brand-dark/55 border border-app-border rounded-lg px-3 py-2">Mi cultivo <ChevronDown size={13} /></span>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-5 py-2 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95"><Plus size={16} /> Registrar lectura</button>
      </div>

      {!sorted.length ? (
        <div className="bg-app-card border border-app-border rounded-2xl py-20 text-center">
          <Cloud size={36} className="mx-auto text-brand-dark/20 mb-3" />
          <p className="text-[14px] font-bold text-brand-dark/50">Sin registros de clima</p>
          <p className="text-[12px] text-brand-dark/35">Registra tu primera lectura de temperatura y humedad.</p>
        </div>
      ) : (
        <>
          {/* Stat groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-black text-brand-dark mb-4"><Thermometer size={16} className="text-rose-500" /> Temperatura (°C)</h3>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Valor actual" value={tStats!.actual.toFixed(1)} unit="°C" big />
                <Stat label="Promedio" value={tStats!.prom.toFixed(1)} unit="°C" />
                <Stat label="Máximo" value={tStats!.max.toFixed(1)} unit="°C" />
                <Stat label="Mínimo" value={tStats!.min.toFixed(1)} unit="°C" />
              </div>
            </div>
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-black text-brand-dark mb-4"><Droplets size={16} className="text-sky-500" /> Humedad relativa (%)</h3>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Valor actual" value={Math.round(hStats!.actual)} unit="%" big />
                <Stat label="Promedio" value={Math.round(hStats!.prom)} unit="%" />
                <Stat label="Máximo" value={Math.round(hStats!.max)} unit="%" />
                <Stat label="Mínimo" value={Math.round(hStats!.min)} unit="%" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <ChartCard title="Temperatura (°C)" data={chartData} dataKey="temp" color="#e11d48" gid="tg" />
            <ChartCard title="Humedad relativa (%)" data={chartData} dataKey="hum" color="#5F603E" gid="hg" />
          </div>

          {/* Tabla histórica */}
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <p className="px-5 pt-4 pb-2 flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary"><span className="text-[#C9A24B]"><AssetIcon name="icon-climate" size={14} /></span> Datos históricos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase tracking-wider text-brand-dark/40 border-y border-app-border">
                  <th className="font-bold px-5 py-2.5">Fecha y hora</th><th className="font-bold px-3 py-2.5">Temp. (°C)</th><th className="font-bold px-3 py-2.5">Humedad (%)</th><th className="font-bold px-3 py-2.5 hidden md:table-cell">Punto de rocío</th><th className="font-bold px-3 py-2.5 hidden lg:table-cell">VPD (kPa)</th><th className="font-bold px-3 py-2.5 hidden xl:table-cell">Fuente</th>
                </tr></thead>
                <tbody className="divide-y divide-app-border">
                  {pageItems.map(c => (
                    <tr key={c.id} className="hover:bg-app-bg/50">
                      <td className="px-5 py-2.5 text-[12px] text-brand-dark/70">{fmtDT(c.date)}</td>
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-brand-dark">{c.temp_max.toFixed(1)} <span className="text-brand-dark/35 font-normal">/ {c.temp_min.toFixed(1)}</span></td>
                      <td className="px-3 py-2.5"><span className="text-[12px] font-semibold text-sky-600 bg-sky-50 rounded px-2 py-0.5">{Math.round(c.humidity)}%</span></td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/60 hidden md:table-cell">{dewPoint(c.temp_max, c.humidity).toFixed(1)} °C</td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/60 hidden lg:table-cell">{vpd(c.temp_max, c.humidity).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-brand-dark/45 hidden xl:table-cell">{c.notes || 'Manual'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-app-border">
              <span className="text-[12px] text-brand-dark/45">Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, sorted.length)} de {sorted.length} registros</span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 disabled:opacity-30 hover:bg-app-bg"><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 rounded-lg text-[12px] font-bold ${page === i + 1 ? 'bg-brand-primary text-white' : 'text-brand-dark/55 hover:bg-app-bg'}`}>{i + 1}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 disabled:opacity-30 hover:bg-app-bg"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Registrar lectura */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="font-accent text-[22px] font-bold text-brand-dark">Registrar lectura</h2><button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button></div>
            <div className="space-y-3">
              <L label="Fecha"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inp} /></L>
              <div className="grid grid-cols-2 gap-3">
                <L label="Temp. máxima (°C)"><input type="number" value={form.temp_max} onChange={e => setForm({ ...form, temp_max: e.target.value })} placeholder="28" className={inp} /></L>
                <L label="Temp. mínima (°C)"><input type="number" value={form.temp_min} onChange={e => setForm({ ...form, temp_min: e.target.value })} placeholder="14" className={inp} /></L>
              </div>
              <L label="Humedad (%)"><input type="number" value={form.humidity} onChange={e => setForm({ ...form, humidity: e.target.value })} placeholder="68" className={inp} /></L>
              <L label="Notas / fuente"><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Sensor invernadero" className={inp} /></L>
            </div>
            <div className="flex gap-3 pt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg">Cancelar</button>
              <button onClick={save} disabled={!form.temp_max || !form.temp_min || !form.humidity} className="flex-1 rounded-xl bg-brand-primary text-white py-2.5 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 disabled:opacity-50">Guardar lectura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inp = "w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const L: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (<div><label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">{label}</label>{children}</div>);

const Stat: React.FC<{ label: string; value: React.ReactNode; unit: string; big?: boolean }> = ({ label, value, unit, big }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-3">
    <p className="text-[9px] font-bold uppercase tracking-wide text-brand-dark/40 mb-1">{label}</p>
    <p className={`font-black text-brand-dark leading-none ${big ? 'text-[26px]' : 'text-[20px]'}`}>{value}<span className="text-[12px] font-semibold text-brand-dark/45 ml-0.5">{unit}</span></p>
  </div>
);

const ChartCard: React.FC<{ title: string; data: any[]; dataKey: string; color: string; gid: string }> = ({ title, data, dataKey, color, gid }) => (
  <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
    <h3 className="text-[13px] font-black text-brand-dark mb-3">{title}</h3>
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-app-border)" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--color-brand-dark)', opacity: 0.4 }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-brand-dark)', opacity: 0.4 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-app-border)', fontSize: 12 }} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gid})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default ClimateScreen;
