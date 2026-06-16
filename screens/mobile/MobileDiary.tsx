import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { compressImage, uploadImage } from '../../utils/imageHelpers';
import { DiaryEntrySchema, validateData } from '../../utils/validationSchemas';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { Camera, RefreshCw, ChevronDown, Droplets, FlaskConical, Scissors, Eye, Check, ImageIcon } from 'lucide-react';

type Tipo = 'riego' | 'fertilizacion' | 'poda' | 'observacion';
const TIPOS: { id: Tipo; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { id: 'riego', label: 'Riego', icon: <Droplets size={18} />, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'fertilizacion', label: 'Fertilización', icon: <FlaskConical size={18} />, color: '#10B981', bg: '#ECFDF5' },
  { id: 'poda', label: 'Poda', icon: <Scissors size={18} />, color: '#F97316', bg: '#FFF7ED' },
  { id: 'observacion', label: 'Observación', icon: <Eye size={18} />, color: '#8B5CF6', bg: '#F5F3FF' },
];
const tipoLabel: Record<string, string> = { riego: 'Riego', fertilizacion: 'Fertilización', poda: 'Poda', observacion: 'Observación' };
const fmtRel = (f: string) => { const d = new Date(f); const today = new Date(); const isToday = d.toDateString() === today.toDateString(); return `${isToday ? 'Hoy' : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${/T\d/.test(f) ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}`; };

const MobileDiary: React.FC = () => {
  const { plants, diary, addDiaryEntry } = useApp();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [plantId, setPlantId] = useState('');
  const [tipo, setTipo] = useState<Tipo>('riego');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  const now = new Date();
  const recent = useMemo(() => [...diary].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 3), [diary]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) { setFile(f); setImg(await compressImage(f)); } if (e.target) e.target.value = '';
  };

  const save = async () => {
    if (saving) return;
    if (!plantId) { alert('Elegí una planta'); return; }
    const p = plants.find(x => x.id === Number(plantId));
    const fecha = new Date().toISOString();
    const data = { planta_nombre: p?.nombre || 'General', planta_especie: p?.especie || 'N/A', fecha, tipo, descripcion: nota || tipoLabel[tipo] };
    const v = validateData(DiaryEntrySchema, data);
    if (!v.success) { alert('❌ ' + v.errors?.join('\n')); return; }
    setSaving(true);
    try {
      let url: string | null = null;
      if (file && user?.key) url = await uploadImage(file, user.key);
      const ok = await addDiaryEntry({ ...data, imagen: url, imagenes: url ? [url] : undefined } as any);
      if (ok) { setOk(true); setTimeout(() => setOk(false), 1400); setImg(null); setFile(null); setNota(''); }
    } finally { setSaving(false); }
  };

  return (
    <>
      <MobileHeader title="Bitácora rápida" subtitle="Registrá una actividad en segundos" />
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="px-5 space-y-4">
        {/* 1. Foto */}
        <Section n={1} title="Foto de la planta">
          <div onClick={() => fileRef.current?.click()} className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[16/10] flex items-center justify-center">
            {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-brand-dark/35"><Camera size={28} /><span className="text-[12px] mt-1">Tocar para tomar foto</span></div>}
            {img && <span className="absolute bottom-2 right-2 bg-brand-dark/60 text-white text-[11px] font-semibold rounded-lg px-2 py-1 flex items-center gap-1"><RefreshCw size={12} /> Cambiar</span>}
          </div>
        </Section>

        {/* 2. Planta */}
        <Section n={2} title="Planta">
          <div className="relative">
            <select value={plantId} onChange={e => setPlantId(e.target.value)} className="w-full appearance-none h-12 rounded-xl bg-app-card border border-app-border pl-3 pr-9 text-[14px] font-semibold text-brand-dark focus:outline-none">
              <option value="">Seleccionar planta…</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
          </div>
        </Section>

        {/* 3. Tipo */}
        <Section n={3} title="Tipo de actividad">
          <div className="grid grid-cols-4 gap-2">
            {TIPOS.map(t => {
              const active = tipo === t.id;
              return (
                <button key={t.id} onClick={() => setTipo(t.id)} className="flex flex-col items-center gap-1 rounded-xl border py-2.5 transition-all"
                  style={active ? { borderColor: t.color, background: t.bg, color: t.color } : { borderColor: 'var(--color-app-border)', color: 'var(--color-brand-dark)' }}>
                  <span style={{ color: t.color }}>{t.icon}</span><span className="text-[10.5px] font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Nota */}
        <div>
          <p className="text-[12px] font-semibold text-brand-dark/55 mb-1.5">Nota rápida <span className="text-brand-dark/35">(opcional)</span></p>
          <textarea value={nota} maxLength={120} onChange={e => setNota(e.target.value)} rows={2} placeholder="Ej: Riego ligero, sustrato húmedo." className="w-full rounded-xl bg-app-card border border-app-border p-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
          <p className="text-right text-[11px] text-brand-dark/35">{nota.length}/120</p>
        </div>

        {/* Fecha/hora */}
        <div className="flex gap-2 text-[12px]">
          <span className="flex-1 flex items-center justify-center gap-1.5 bg-app-card border border-app-border rounded-xl py-2 text-brand-dark/60">📅 {now.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
          <span className="flex-1 flex items-center justify-center gap-1.5 bg-app-card border border-app-border rounded-xl py-2 text-brand-dark/60">🕐 {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-app-card border border-app-border rounded-xl py-2.5 text-[13px] font-bold text-brand-dark"><Camera size={16} /> Abrir cámara</button>
        </div>

        <button onClick={save} disabled={saving} className="w-full bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar entrada'}
        </button>

        {/* Recientes */}
        <div className="pt-1">
          <p className="text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2">Entradas recientes</p>
          <div className="space-y-2">
            {recent.length === 0 && <p className="text-[12.5px] text-brand-dark/35">Sin entradas todavía</p>}
            {recent.map(e => {
              const p = plants.find(x => x.nombre === e.planta_nombre); const tc = TIPOS.find(t => t.id === e.tipo) || TIPOS[3];
              return (
                <div key={e.id} className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl p-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                    {p?.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={e.planta_especie} size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-brand-dark truncate">{e.planta_nombre}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: tc.color }}>{tc.icon} {tipoLabel[e.tipo]}</span>
                  </div>
                  <span className="text-[11px] text-brand-dark/40 shrink-0">{fmtRel(e.fecha)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {ok && <Toast />}
    </>
  );
};

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div>
    <p className="flex items-center gap-2 text-[12px] font-bold text-brand-dark/60 mb-2">
      <span className="w-5 h-5 rounded-full bg-[#C9A24B]/15 text-[#9a7b2f] text-[11px] font-black flex items-center justify-center">{n}</span>{title}
    </p>
    {children}
  </div>
);
const Toast: React.FC = () => (
  <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-brand-secondary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-scale-in"><Check size={18} /><span className="text-[13px] font-bold">Entrada guardada</span></div>
);

export default MobileDiary;
