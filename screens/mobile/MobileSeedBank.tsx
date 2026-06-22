import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SeedBatch } from '../../types';
import { ChevronDown, Hash, Leaf, Boxes, CalendarDays, Snowflake, Activity, MapPin, NotebookPen, Check, X, Trash2, Minus, Plus, ChevronRight } from 'lucide-react';

const inp = "w-full h-12 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const ESTADOS = [['almacenada', 'Almacenada'], ['estratificando', 'En estratificación'], ['sembrada', 'Sembrada'], ['agotada', 'Agotada']];
const estLabel: Record<string, string> = { almacenada: 'Almacenada', estratificando: 'En estratificación', sembrada: 'Sembrada', agotada: 'Agotada' };
const loteId = (id: number) => `SRA-${new Date().getFullYear()}-${String(id).slice(-3).padStart(3, '0')}`;

const MobileSeedBank: React.FC = () => {
  const { seedBank, addSeedBatch, updateSeedBatch, deleteSeedBatch } = useApp();
  const [f, setF] = useState({ especie: '', cantidad: '', fecha_ingreso: new Date().toISOString().split('T')[0], estado: 'almacenada', ubicacion: '', notas: '' });
  const [estratHoy, setEstratHoy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  // Edición de un lote existente (hoja inferior)
  const [editing, setEditing] = useState<SeedBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [delArm, setDelArm] = useState(false);
  const upd = (patch: Partial<SeedBatch>) => setEditing(e => e ? { ...e, ...patch } : e);

  const all = useMemo(() => [...seedBank].sort((a, b) => (b.id || 0) - (a.id || 0)), [seedBank]);

  const openEdit = (b: SeedBatch) => { setEditing({ ...b }); setDelArm(false); };
  const saveEdit = async () => {
    if (!editing || busy) return;
    setBusy(true);
    try { await updateSeedBatch(editing); setEditing(null); }
    finally { setBusy(false); }
  };
  const removeEdit = async () => {
    if (!editing || busy) return;
    if (!delArm) { setDelArm(true); setTimeout(() => setDelArm(false), 3000); return; }
    setBusy(true);
    try { await deleteSeedBatch(editing.id); setEditing(null); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (saving) return;
    if (!f.especie.trim()) { alert('Ingresá la especie o cruce'); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString();
      // Respetar la fecha de cosecha elegida (antes se ignoraba y usaba hoy)
      const fechaCosecha = f.fecha_ingreso ? new Date(f.fecha_ingreso).toISOString() : today;
      const payload: any = {
        nombre: f.especie.trim(), especie: f.especie.trim(), cantidad: Number(f.cantidad) || 0,
        fecha_ingreso: fechaCosecha, origen: 'propia',
        estado: estratHoy ? 'estratificando' : f.estado,
        inicio_estratificacion: estratHoy ? today : null, fin_estratificacion: null,
        ubicacion: f.ubicacion, notas: f.notas,
      };
      const r = await addSeedBatch(payload);
      if (r) { setOk(true); setTimeout(() => setOk(false), 1400); setF({ ...f, especie: '', cantidad: '', ubicacion: '', notas: '' }); setEstratHoy(false); }
    } finally { setSaving(false); }
  };

  return (
    <>
      <MobileHeader title="Banco de semillas" subtitle="Registrar un lote nuevo" />
      <div className="px-5 space-y-3.5">
        <Field icon={<Hash size={15} />} label="Lote ID"><div className={inp + ' flex items-center text-brand-dark/40'}>{loteId(Date.now())} <span className="ml-auto text-[11px]">automático</span></div></Field>
        <Field icon={<Leaf size={15} />} label="Especie / cruce"><input value={f.especie} onChange={e => set('especie', e.target.value)} placeholder="Ej: Sarracenia leucophylla" className={inp} /></Field>
        <Field icon={<Boxes size={15} />} label="Cantidad de semillas"><input type="number" value={f.cantidad} onChange={e => set('cantidad', e.target.value)} placeholder="Ej: 250" className={inp} /></Field>
        <Field icon={<CalendarDays size={15} />} label="Fecha de cosecha"><input type="date" value={f.fecha_ingreso} onChange={e => set('fecha_ingreso', e.target.value)} className={inp} /></Field>

        <div className="flex items-center justify-between bg-app-card border border-app-border rounded-xl px-4 py-3">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-brand-dark"><Snowflake size={16} className="text-sky-500" /> Iniciar estratificación hoy</span>
          <button onClick={() => setEstratHoy(v => !v)} className={`w-11 h-6 rounded-full relative transition-colors ${estratHoy ? 'bg-brand-secondary' : 'bg-app-border'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${estratHoy ? 'left-[22px]' : 'left-0.5'}`} /></button>
        </div>

        {!estratHoy && (
          <Field icon={<Activity size={15} />} label="Estado">
            <div className="relative"><select value={f.estado} onChange={e => set('estado', e.target.value)} className={inp + ' appearance-none pr-9 font-semibold cursor-pointer'}>{ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" /></div>
          </Field>
        )}
        <Field icon={<MapPin size={15} />} label="Ubicación"><input value={f.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ej: Invernadero A · Estante 1" className={inp} /></Field>
        <Field icon={<NotebookPen size={15} />} label="Notas (opcional)"><input value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Observaciones…" className={inp} /></Field>

        <button onClick={save} disabled={saving} className="w-full bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar lote'}</button>

        {/* Todos los lotes (tocá para editar) */}
        <div className="pt-1 pb-4">
          <p className="text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2">Lotes guardados {all.length > 0 && <span className="text-brand-dark/35">· {all.length}</span>}</p>
          <div className="space-y-2">
            {all.length === 0 && <p className="text-[12.5px] text-brand-dark/35">Sin lotes todavía</p>}
            {all.map(b => (
              <button key={b.id} onClick={() => openEdit(b)} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5 text-left active:scale-[0.99] transition-transform">
                <span className="text-2xl">🌰</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-brand-dark truncate">{b.especie || b.nombre}</p>
                  <p className="text-[11.5px] text-brand-dark/45">{b.cantidad} semillas{b.ubicacion ? ` · ${b.ubicacion}` : ''}</p>
                </div>
                <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${b.estado === 'estratificando' ? 'bg-sky-50 text-sky-600' : b.estado === 'sembrada' ? 'bg-emerald-50 text-emerald-700' : b.estado === 'agotada' ? 'bg-app-bg text-brand-dark/40' : 'bg-[#C9A24B]/15 text-[#9a7b2f]'}`}>{estLabel[b.estado] || b.estado}</span>
                <ChevronRight size={16} className="text-brand-dark/25 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hoja de edición del lote */}
      {editing && (
        <div className="fixed inset-0 z-[110] bg-brand-dark/40 backdrop-blur-sm flex items-end" onClick={() => !busy && setEditing(null)}>
          <div className="w-full bg-app-card rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[88vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-accent text-[20px] font-bold text-brand-dark">Editar lote</h2>
              <button onClick={() => !busy && setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button>
            </div>

            <div className="space-y-3.5">
              <Field icon={<Leaf size={15} />} label="Especie / cruce"><input value={editing.especie || editing.nombre || ''} onChange={e => upd({ especie: e.target.value })} className={inp} /></Field>

              <Field icon={<Boxes size={15} />} label="Cantidad de semillas">
                <div className="flex items-center gap-3">
                  <button onClick={() => upd({ cantidad: Math.max(0, (editing.cantidad || 0) - 10) })} className="w-11 h-11 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/60 active:scale-95"><Minus size={18} /></button>
                  <input type="number" value={editing.cantidad ?? 0} onChange={e => upd({ cantidad: Math.max(0, parseInt(e.target.value, 10) || 0) })} className={inp + ' text-center font-bold'} />
                  <button onClick={() => upd({ cantidad: (editing.cantidad || 0) + 10 })} className="w-11 h-11 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/60 active:scale-95"><Plus size={18} /></button>
                </div>
              </Field>

              <Field icon={<Activity size={15} />} label="Estado">
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS.map(([v, l]) => (
                    <button key={v} onClick={() => upd({ estado: v as SeedBatch['estado'], inicio_estratificacion: v === 'estratificando' && !editing.inicio_estratificacion ? new Date().toISOString() : editing.inicio_estratificacion })}
                      className={`rounded-xl border py-2.5 text-[12.5px] font-bold transition-all ${editing.estado === v ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-app-border text-brand-dark/55'}`}>{l}</button>
                  ))}
                </div>
              </Field>

              <Field icon={<MapPin size={15} />} label="Ubicación"><input value={editing.ubicacion || ''} onChange={e => upd({ ubicacion: e.target.value })} placeholder="Ej: Invernadero A · Estante 1" className={inp} /></Field>
              <Field icon={<NotebookPen size={15} />} label="Notas"><input value={editing.notas || ''} onChange={e => upd({ notas: e.target.value })} placeholder="Observaciones…" className={inp} /></Field>

              <button onClick={saveEdit} disabled={busy} className="w-full bg-brand-primary text-white rounded-xl py-3.5 text-[14.5px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Check size={17} /> {busy ? 'Guardando…' : 'Guardar cambios'}</button>
              <button onClick={removeEdit} disabled={busy} className={`w-full rounded-xl py-3 text-[13.5px] font-bold active:scale-95 transition-all flex items-center justify-center gap-2 ${delArm ? 'bg-rose-500 text-white' : 'border border-rose-200 text-rose-500'}`}><Trash2 size={15} /> {delArm ? 'Tocá de nuevo para eliminar' : 'Eliminar lote'}</button>
            </div>
          </div>
        </div>
      )}
      {ok && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-brand-secondary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-scale-in"><Check size={18} /><span className="text-[13px] font-bold">Lote guardado</span></div>}
    </>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div><p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>{children}</div>
);

export default MobileSeedBank;
