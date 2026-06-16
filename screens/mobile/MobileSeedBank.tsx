import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { ChevronDown, Hash, Leaf, Boxes, CalendarDays, Snowflake, Activity, MapPin, NotebookPen, Check } from 'lucide-react';

const inp = "w-full h-12 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const ESTADOS = [['almacenada', 'Almacenada'], ['estratificando', 'En estratificación'], ['sembrada', 'Sembrada'], ['agotada', 'Agotada']];
const estLabel: Record<string, string> = { almacenada: 'Almacenada', estratificando: 'En estratificación', sembrada: 'Sembrada', agotada: 'Agotada' };
const loteId = (id: number) => `SRA-${new Date().getFullYear()}-${String(id).slice(-3).padStart(3, '0')}`;

const MobileSeedBank: React.FC = () => {
  const { seedBank, addSeedBatch } = useApp();
  const [f, setF] = useState({ especie: '', cantidad: '', fecha_ingreso: new Date().toISOString().split('T')[0], estado: 'almacenada', ubicacion: '', notas: '' });
  const [estratHoy, setEstratHoy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const recent = useMemo(() => [...seedBank].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 3), [seedBank]);

  const save = async () => {
    if (saving) return;
    if (!f.especie.trim()) { alert('Ingresá la especie o cruce'); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString();
      const payload: any = {
        nombre: f.especie.trim(), especie: f.especie.trim(), cantidad: Number(f.cantidad) || 0,
        fecha_ingreso: today, origen: 'propia',
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

        {/* Recientes */}
        <div className="pt-1">
          <p className="text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2">Lotes recientes</p>
          <div className="space-y-2">
            {recent.length === 0 && <p className="text-[12.5px] text-brand-dark/35">Sin lotes todavía</p>}
            {recent.map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5">
                <span className="text-2xl">🌰</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-brand-dark truncate">{b.especie || b.nombre}</p>
                  <p className="text-[11.5px] text-brand-dark/45">{b.cantidad} semillas</p>
                </div>
                <span className="text-[11px] font-semibold text-brand-secondary">{estLabel[b.estado] || b.estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {ok && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-brand-secondary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-scale-in"><Check size={18} /><span className="text-[13px] font-bold">Lote guardado</span></div>}
    </>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div><p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>{children}</div>
);

export default MobileSeedBank;
