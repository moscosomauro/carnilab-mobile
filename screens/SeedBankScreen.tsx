import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SeedBatch } from '../types';
import { AssetIcon } from '../components/AssetIcon';
import {
  Search, Filter, ChevronDown, Plus, X, Check, Trash2, Pencil,
  CalendarDays, MapPin, Thermometer, Boxes, Percent, FileText, Clock, Circle
} from 'lucide-react';

const estadoMeta: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  almacenada: { label: 'Almacenada', dot: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  estratificando: { label: 'En curso', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  sembrada: { label: 'Sembrada', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  agotada: { label: 'Agotada', dot: 'bg-brand-dark/30', text: 'text-brand-dark/40', bg: 'bg-app-bg' },
};

const fmtDate = (f?: string | null) => f ? new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const loteId = (b: SeedBatch) => `SRA-${new Date(b.fecha_ingreso || Date.now()).getFullYear()}-${String(b.id).slice(-3).padStart(3, '0')}`;
const daysBetween = (a: number, b: number) => Math.max(0, Math.round((a - b) / 86400000));

const germTone = (g?: number) => g == null ? { text: 'text-brand-dark/40', label: '—' }
  : g >= 70 ? { text: 'text-emerald-600', label: 'Alta' } : g >= 30 ? { text: 'text-amber-600', label: 'Media' } : { text: 'text-rose-600', label: 'Baja' };

const blank = { nombre: '', especie: '', cantidad: '', origen: 'propia' as 'propia' | 'externa', estado: 'almacenada' as SeedBatch['estado'], inicio_estratificacion: '', fin_estratificacion: '', ubicacion: '', germinacion: '', notas: '' };

const SeedBankScreen: React.FC = () => {
  const { seedBank, addSeedBatch, updateSeedBatch, deleteSeedBatch } = useApp();

  const [search, setSearch] = useState('');
  const [fEstado, setFEstado] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });

  const filtered = useMemo(() => seedBank.filter(b => {
    const q = search.toLowerCase();
    const ms = !q || b.nombre.toLowerCase().includes(q) || (b.especie || '').toLowerCase().includes(q) || loteId(b).toLowerCase().includes(q);
    const me = fEstado === 'todos' || b.estado === fEstado;
    return ms && me;
  }), [seedBank, search, fEstado]);

  useEffect(() => {
    if ((selectedId === null || !seedBank.some(b => b.id === selectedId)) && seedBank.length > 0) setSelectedId(seedBank[0].id);
  }, [seedBank, selectedId]);

  const selected = useMemo(() => seedBank.find(b => b.id === selectedId) || null, [seedBank, selectedId]);

  const openNew = () => { setEditId(null); setForm({ ...blank }); setShowModal(true); };
  const openEdit = (b: SeedBatch) => {
    setEditId(b.id);
    setForm({
      nombre: b.nombre, especie: b.especie || '', cantidad: String(b.cantidad || ''), origen: b.origen || 'propia',
      estado: b.estado, inicio_estratificacion: (b.inicio_estratificacion || '').slice(0, 10), fin_estratificacion: (b.fin_estratificacion || '').slice(0, 10),
      ubicacion: b.ubicacion || '', germinacion: b.germinacion != null ? String(b.germinacion) : '', notas: b.notas || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) { alert('⚠️ Ingresa un nombre / cruce para el lote'); return; }
    const payload: any = {
      nombre: form.nombre.trim(), especie: form.especie, cantidad: Number(form.cantidad) || 0,
      origen: form.origen, estado: form.estado,
      inicio_estratificacion: form.inicio_estratificacion || null, fin_estratificacion: form.fin_estratificacion || null,
      ubicacion: form.ubicacion, germinacion: form.germinacion ? Number(form.germinacion) : undefined, notas: form.notas,
    };
    if (editId) { const b = seedBank.find(x => x.id === editId)!; await updateSeedBatch({ ...b, ...payload }); }
    else { payload.fecha_ingreso = new Date().toISOString(); await addSeedBatch(payload); }
    setShowModal(false);
  };

  const progress = (b: SeedBatch) => {
    if (!b.inicio_estratificacion || !b.fin_estratificacion) return null;
    const ini = new Date(b.inicio_estratificacion).getTime(), fin = new Date(b.fin_estratificacion).getTime();
    const total = daysBetween(fin, ini); const trans = Math.min(total, daysBetween(Date.now(), ini));
    return { total, trans, pct: total > 0 ? Math.min(100, Math.round((trans / total) * 100)) : 0 };
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-bank-seed" size={26} /></div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Banco de semillas</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Gestiona y haz seguimiento de tus lotes de semillas y su estratificación</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por lote ID, especie o cruce…" className="w-full bg-app-card border border-app-border rounded-full pl-9 pr-4 py-2 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>
        <div className="relative">
          <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-app-bg"><Filter size={14} className="text-[#C9A24B]" /> Filtros <ChevronDown size={13} className="text-brand-dark/40" /></button>
          {showFilters && (
            <div className="absolute z-30 mt-2 w-48 bg-app-card border border-app-border rounded-xl shadow-lg p-1.5">
              {[['todos', 'Todos'], ['almacenada', 'Almacenadas'], ['estratificando', 'En curso'], ['sembrada', 'Sembradas'], ['agotada', 'Agotadas']].map(([v, l]) => (
                <button key={v} onClick={() => { setFEstado(v); setShowFilters(false); }} className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-[13px] font-medium ${fEstado === v ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-dark/70 hover:bg-app-bg'}`}>{l} {fEstado === v && <Check size={14} />}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <button onClick={openNew} className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-5 py-2 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95"><Plus size={16} /> Nuevo lote</button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Tabla ===== */}
        <div className="xl:col-span-8">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-[12px] font-bold text-brand-dark/45">Total: {filtered.length} lotes</p>
              <div className="hidden md:flex items-center gap-3 text-[11px] text-brand-dark/50">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Alta (≥70%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Media (30-69%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Baja (&lt;30%)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-[10px] uppercase tracking-wider text-brand-dark/40 border-y border-app-border">
                  <th className="font-bold px-5 py-2.5">Lote ID</th><th className="font-bold px-3 py-2.5 hidden md:table-cell">Especie / cruce</th><th className="font-bold px-3 py-2.5">Cantidad</th><th className="font-bold px-3 py-2.5">Estado</th><th className="font-bold px-3 py-2.5 hidden lg:table-cell">Inicio estrat.</th><th className="font-bold px-3 py-2.5 hidden xl:table-cell">Fin estimado</th><th className="font-bold px-3 py-2.5">Germ.</th>
                </tr></thead>
                <tbody className="divide-y divide-app-border">
                  {filtered.map(b => {
                    const m = estadoMeta[b.estado] || estadoMeta.almacenada; const g = germTone(b.germinacion); const active = b.id === selectedId;
                    return (
                      <tr key={b.id} onClick={() => setSelectedId(b.id)} className={`cursor-pointer ${active ? 'bg-brand-primary/[0.06]' : 'hover:bg-app-bg/60'}`}>
                        <td className="px-5 py-2.5"><div className="flex items-center gap-2 relative">{active && <span className="absolute left-0 w-1 h-6 rounded-r bg-[#C9A24B] -ml-5" />}<Circle size={8} className={active ? 'text-brand-primary fill-brand-primary' : 'text-brand-dark/20'} /><span className="text-[12.5px] font-bold text-brand-dark">{loteId(b)}</span></div></td>
                        <td className="px-3 py-2.5 hidden md:table-cell"><span className="text-[12px] italic text-brand-dark/55">{b.especie || b.nombre}</span></td>
                        <td className="px-3 py-2.5"><span className="text-[12px] text-brand-dark/70">{b.cantidad.toLocaleString('es-AR')} semillas</span></td>
                        <td className="px-3 py-2.5"><span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${m.text}`}><span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}</span></td>
                        <td className="px-3 py-2.5 hidden lg:table-cell"><span className="text-[12px] text-brand-dark/55">{fmtDate(b.inicio_estratificacion)}</span></td>
                        <td className="px-3 py-2.5 hidden xl:table-cell"><span className="text-[12px] text-brand-dark/55">{fmtDate(b.fin_estratificacion)}</span></td>
                        <td className="px-3 py-2.5"><span className={`text-[12px] font-bold ${g.text}`}>{b.germinacion != null ? `${b.germinacion}%` : '—'}</span></td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-[13px] text-brand-dark/35">No hay lotes 🌰</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===== Panel de detalle ===== */}
        <div className="xl:col-span-4">
          {selected ? (() => {
            const m = estadoMeta[selected.estado] || estadoMeta.almacenada; const g = germTone(selected.germinacion); const pr = progress(selected);
            return (
              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 xl:sticky xl:top-20">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-accent text-[22px] font-bold text-brand-dark">{loteId(selected)}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1 ${m.bg} ${m.text}`}><span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}</span>
                </div>
                <p className="text-[13px] italic text-brand-dark/50 mb-4">{selected.especie || selected.nombre}</p>

                {pr && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5"><span className="text-[12px] font-semibold text-brand-dark/55">Progreso de estratificación</span><span className="text-[14px] font-black text-[#9a7b2f]">{pr.pct}%</span></div>
                    <div className="h-2.5 rounded-full bg-app-bg overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#C9A24B] to-brand-secondary" style={{ width: `${pr.pct}%` }} /></div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-brand-dark/45"><span>Transcurrido: {pr.trans} días</span><span>Total estimado: {pr.total} días</span></div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <StatBox icon={<Boxes size={14} />} label="Cantidad" value={selected.cantidad.toLocaleString('es-AR')} sub="semillas" />
                  <StatBox icon={<CalendarDays size={14} />} label="Inicio" value={fmtDate(selected.inicio_estratificacion)} />
                  <StatBox icon={<CalendarDays size={14} />} label="Fin estimado" value={fmtDate(selected.fin_estratificacion)} />
                  <StatBox icon={<Percent size={14} />} label="Germinación" value={selected.germinacion != null ? `${selected.germinacion}%` : '—'} sub={g.label} valueClass={g.text} />
                  <StatBox icon={<MapPin size={14} />} label="Ubicación" value={selected.ubicacion || '—'} />
                  <StatBox icon={<Thermometer size={14} />} label="Temperatura" value="4 ±1 °C" sub="recomendado" />
                </div>

                {selected.notas && (
                  <div className="mb-4">
                    <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-dark/40 mb-1"><FileText size={12} /> Notas</p>
                    <p className="text-[12.5px] text-brand-dark/65 italic leading-relaxed">{selected.notas}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-dark/40 mb-2"><Clock size={12} /> Línea de tiempo</p>
                  <div className="relative pl-4 border-l border-app-border space-y-2.5">
                    <Timeline label="Lote creado" date={fmtDate(selected.fecha_ingreso)} desc="Semillas registradas" />
                    {selected.inicio_estratificacion && <Timeline label="Inicio de estratificación" date={fmtDate(selected.inicio_estratificacion)} desc="En cámara fría" />}
                    {selected.fin_estratificacion && <Timeline label="Fin estimado" date={fmtDate(selected.fin_estratificacion)} desc="Listas para siembra" />}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(selected)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-app-card border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg"><Pencil size={14} /> Editar lote</button>
                  <button onClick={() => { if (window.confirm('¿Eliminar este lote?')) { deleteSeedBatch(selected.id); setSelectedId(null); } }} className="rounded-xl border border-app-border px-3 text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })() : (
            <div className="bg-app-card border border-app-border rounded-2xl p-10 text-center text-[13px] text-brand-dark/35">Selecciona un lote para ver sus detalles</div>
          )}
        </div>
      </div>

      {/* Modal Nuevo / Editar lote */}
      {showModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-accent text-[22px] font-bold text-brand-dark">{editId ? 'Editar lote' : 'Nuevo lote'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <L label="Nombre / cruce *" full><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Scarlet × Rubra (Cosecha)" className={inp} /></L>
              <L label="Especie"><input value={form.especie} onChange={e => setForm({ ...form, especie: e.target.value })} placeholder="Sarracenia leucophylla" className={inp} /></L>
              <L label="Cantidad (semillas)"><input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} placeholder="0" className={inp} /></L>
              <L label="Origen"><select value={form.origen} onChange={e => setForm({ ...form, origen: e.target.value as any })} className={inp + ' cursor-pointer'}><option value="propia">Propia</option><option value="externa">Externa</option></select></L>
              <L label="Estado"><select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as any })} className={inp + ' cursor-pointer'}><option value="almacenada">Almacenada</option><option value="estratificando">En estratificación</option><option value="sembrada">Sembrada</option><option value="agotada">Agotada</option></select></L>
              <L label="Inicio estratificación"><input type="date" value={form.inicio_estratificacion} onChange={e => setForm({ ...form, inicio_estratificacion: e.target.value })} className={inp} /></L>
              <L label="Fin estimado"><input type="date" value={form.fin_estratificacion} onChange={e => setForm({ ...form, fin_estratificacion: e.target.value })} className={inp} /></L>
              <L label="Ubicación"><input value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Cámara fría 1 · Estante B" className={inp} /></L>
              <L label="Germinación (%)"><input type="number" value={form.germinacion} onChange={e => setForm({ ...form, germinacion: e.target.value })} placeholder="0" className={inp} /></L>
              <L label="Notas" full><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} placeholder="Notas del lote…" className={inp + ' resize-none h-auto py-2'} /></L>
            </div>
            <div className="flex gap-3 pt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-app-border py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg">Cancelar</button>
              <button onClick={save} disabled={!form.nombre.trim()} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-primary text-white py-2.5 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 disabled:opacity-50"><Check size={15} /> {editId ? 'Guardar cambios' : 'Crear lote'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inp = "w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const L: React.FC<{ label: string; full?: boolean; children: React.ReactNode }> = ({ label, full, children }) => (
  <div className={full ? 'col-span-2' : ''}><label className="block text-[12px] font-semibold text-brand-dark/55 mb-1.5">{label}</label>{children}</div>
);
const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; valueClass?: string }> = ({ icon, label, value, sub, valueClass }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-2.5">
    <p className="flex items-center gap-1 text-[10px] text-brand-dark/45 mb-0.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>
    <p className={`text-[13px] font-black leading-tight ${valueClass || 'text-brand-dark'}`}>{value}</p>
    {sub && <p className="text-[9.5px] text-brand-dark/40">{sub}</p>}
  </div>
);
const Timeline: React.FC<{ label: string; date: string; desc: string }> = ({ label, date, desc }) => (
  <div className="relative">
    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-secondary border-2 border-app-card" />
    <div className="flex items-center justify-between"><p className="text-[12px] font-bold text-brand-dark">{label}</p><span className="text-[10.5px] text-brand-dark/40">{date}</span></div>
    <p className="text-[11px] text-brand-dark/45">{desc}</p>
  </div>
);

export default SeedBankScreen;
