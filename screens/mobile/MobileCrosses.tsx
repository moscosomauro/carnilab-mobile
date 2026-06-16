import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { compressImage, uploadImage } from '../../utils/imageHelpers';
import { CrossSchema, validateData } from '../../utils/validationSchemas';
import { MobileHeader } from '../../components/MobileLayout';
import { Camera, RefreshCw, ChevronDown, Venus, Mars, CalendarDays, Target, NotebookPen, Monitor, Dna } from 'lucide-react';

const inp = "w-full h-12 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const mmYYYY = (f: string) => { const d = new Date(f); return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

const MobileCrosses: React.FC = () => {
  const navigate = useNavigate();
  const { plants, addCross } = useApp();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [madreId, setMadreId] = useState('');
  const [padreId, setPadreId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [objetivo, setObjetivo] = useState('');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  const madre = plants.find(p => p.id === Number(madreId));
  const padre = plants.find(p => p.id === Number(padreId));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => { const x = e.target.files?.[0]; if (x) { setFile(x); setImg(await compressImage(x)); } if (e.target) e.target.value = ''; };

  const save = async () => {
    if (saving) return;
    if (!madre || !padre) { alert('Elegí madre y padre'); return; }
    const nombre = `${madre.nombre.split(' ')[0]} × ${padre.nombre.split(' ')[0]} - ${mmYYYY(fecha)}`;
    const data = { nombre, madre_nombre: madre.nombre, madre_especie: madre.especie || 'Desconocida', padre_nombre: padre.nombre, padre_especie: padre.especie || 'Desconocida', fecha_cruza: fecha, objetivo, notas: nota, semillas_obtenidas: 0, plantas_germinadas: 0, estado: 'en_proceso' as const };
    const v = validateData(CrossSchema, data);
    if (!v.success) { alert('❌ ' + v.errors?.join('\n')); return; }
    setSaving(true);
    try {
      let url: string | null = null;
      if (file && user?.key) url = await uploadImage(file, user.key);
      const r = await addCross({ ...v.data!, madre_imagen: madre.imagen, padre_imagen: padre.imagen, hibrido_imagen: url, fecha_germinacion: null, padres_extra: [] } as any);
      if (r.success) navigate('/crosses'); else alert('❌ ' + (r.error || 'No se pudo guardar'));
    } finally { setSaving(false); }
  };

  return (
    <>
      <MobileHeader title="Registrar cruza" subtitle="El evento del día" />
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="px-5 space-y-4 pb-28">
        {/* Foto */}
        <div onClick={() => fileRef.current?.click()} className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[16/10] flex items-center justify-center">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-brand-dark/35"><Camera size={30} /><span className="text-[12.5px] mt-1">Foto de la cruza</span></div>}
          {img && <span className="absolute bottom-2 right-2 bg-brand-dark/60 text-white text-[11px] font-semibold rounded-lg px-2 py-1 flex items-center gap-1"><RefreshCw size={12} /> Cambiar</span>}
        </div>

        <PSelect icon={<Venus size={15} className="text-rose-400" />} label="Madre" plants={plants} value={madreId} onChange={setMadreId} />
        <PSelect icon={<Mars size={15} className="text-sky-500" />} label="Padre" plants={plants} value={padreId} onChange={setPadreId} />

        <Field icon={<CalendarDays size={15} />} label="Fecha de polinización"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} /></Field>
        <Field icon={<Target size={15} />} label="Objetivo (opcional)"><input value={objetivo} maxLength={80} onChange={e => setObjetivo(e.target.value)} placeholder="Crear híbrido con mejor coloración" className={inp} /></Field>
        <Field icon={<NotebookPen size={15} />} label="Nota breve (opcional)"><input value={nota} maxLength={120} onChange={e => setNota(e.target.value)} placeholder="Polen fresco, clima estable" className={inp} /></Field>

        {/* Callout escritorio */}
        <div className="flex items-start gap-3 rounded-xl border border-[#C9A24B]/30 bg-[#C9A24B]/10 p-3">
          <Monitor size={18} className="text-[#9a7b2f] mt-0.5 shrink-0" />
          <p className="text-[12px] text-brand-dark/65"><b className="text-brand-dark">Análisis avanzado en escritorio:</b> genealogía, estadísticas y Gen Lab están disponibles en la versión de PC.</p>
        </div>

        {/* Resumen + guardar */}
        <div className="flex items-center gap-2 bg-app-card border border-app-border rounded-xl p-3">
          <Dna size={18} className="text-brand-primary/50" />
          <p className="flex-1 text-[13px] font-bold text-brand-dark truncate">{madre ? madre.nombre.split(' ')[0] : 'Madre'} × {padre ? padre.nombre.split(' ')[0] : 'Padre'}</p>
        </div>
        <button onClick={save} disabled={saving || !madre || !padre} className="w-full bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar cruza'}</button>
      </div>
    </>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div><p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>{children}</div>
);
const PSelect: React.FC<{ icon: React.ReactNode; label: string; plants: any[]; value: string; onChange: (v: string) => void }> = ({ icon, label, plants, value, onChange }) => (
  <Field icon={icon} label={label}>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={inp + ' appearance-none pr-9 font-semibold cursor-pointer'}>
        <option value="">Seleccionar…</option>
        {plants.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
    </div>
  </Field>
);

export default MobileCrosses;
