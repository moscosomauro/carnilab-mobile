import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { compressImage, uploadImage } from '../../utils/imageHelpers';
import { PlantSchema, validateData } from '../../utils/validationSchemas';
import { MobileHeader } from '../../components/MobileLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, RefreshCw, ChevronDown, Leaf, CalendarDays, Sprout, MapPin, Heart, QrCode, Check } from 'lucide-react';

const ESTADOS = [['saludable', 'Saludable'], ['regular', 'Regular'], ['critico', 'Crítico']];
const inp = "w-full h-12 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";

const MobileAddPlant: React.FC = () => {
  const navigate = useNavigate();
  const { addPlant } = useApp();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({ nombre: '', especie: '', fecha_adquisicion: new Date().toISOString().split('T')[0], origen: '', ubicacion: '', estado: 'saludable', notas: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => { const x = e.target.files?.[0]; if (x) { setFile(x); setImg(await compressImage(x)); } if (e.target) e.target.value = ''; };

  const save = async (after: 'list' | 'again') => {
    if (saving) return;
    const data = { nombre: f.nombre, especie: f.especie, fecha_adquisicion: f.fecha_adquisicion, origen: f.origen || '', precio: null, estado: f.estado, ubicacion: f.ubicacion || '', notas: f.notas || '', en_venta: false, precio_venta: null };
    const v = validateData(PlantSchema, data);
    if (!v.success) { alert('❌ ' + v.errors?.join('\n')); return; }
    setSaving(true);
    try {
      let url: string | null = null;
      if (file && user?.key) url = await uploadImage(file, user.key);
      const np = await addPlant({ ...v.data!, imagen: url, images: url ? [{ id: `img_${Date.now()}`, plant_id: 0, image_url: url, display_order: 0 }] : [] } as any);
      if (np) { if (after === 'list') navigate('/plants'); else { setF({ ...f, nombre: '', especie: '', origen: '', ubicacion: '', notas: '' }); setImg(null); setFile(null); } }
    } finally { setSaving(false); }
  };

  const canSave = !!f.nombre && !!f.especie && !saving;

  return (
    <>
      <MobileHeader title="Agregar planta" subtitle="Nuevo ejemplar en tu colección" right={<button className="w-9 h-9 rounded-full border border-app-border bg-app-card flex items-center justify-center text-brand-dark/50">＋</button>} />
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="px-5 space-y-4">
        {/* Foto */}
        <div onClick={() => fileRef.current?.click()} className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[16/10] flex items-center justify-center">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-brand-dark/35"><Camera size={30} /><span className="text-[12.5px] mt-1">Foto en vivo</span></div>}
          {img && <span className="absolute bottom-2 right-2 bg-brand-dark/60 text-white text-[11px] font-semibold rounded-lg px-2 py-1 flex items-center gap-1"><RefreshCw size={12} /> Cambiar</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-app-card border border-app-border rounded-xl py-2.5 text-[13px] font-bold text-brand-dark"><Camera size={16} /> Abrir cámara</button>
        </div>

        {/* Campos */}
        <Field icon={<Leaf size={15} />} label="Nombre"><input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Mi Sarracenia 01" className={inp} /></Field>
        <Field icon={<Leaf size={15} />} label="Especie"><input value={f.especie} onChange={e => set('especie', e.target.value)} placeholder="Ej: Sarracenia leucophylla" className={inp} /></Field>
        <Field icon={<CalendarDays size={15} />} label="Fecha"><input type="date" value={f.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)} className={inp} /></Field>
        <Field icon={<Sprout size={15} />} label="Origen"><input value={f.origen} onChange={e => set('origen', e.target.value)} placeholder="Ej: Vivero Las Carnívoras" className={inp} /></Field>
        <Field icon={<MapPin size={15} />} label="Ubicación"><input value={f.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ej: Invernadero · Estantería 2" className={inp} /></Field>
        <Field icon={<Heart size={15} />} label="Estado de salud">
          <div className="relative"><select value={f.estado} onChange={e => set('estado', e.target.value)} className={inp + ' appearance-none pr-9 font-semibold cursor-pointer'}>{ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" /></div>
        </Field>
        <Field icon={<Leaf size={15} />} label="Notas rápidas (opcional)"><input value={f.notas} maxLength={100} onChange={e => set('notas', e.target.value)} placeholder="Ej: Sustrato turba + perlita" className={inp} /></Field>

        {/* QR preview */}
        <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg border border-app-border"><QRCodeSVG value={`carnilab:new:${f.nombre || 'planta'}`} size={56} fgColor="#7A1E2C" /></div>
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider text-brand-primary"><QrCode size={13} /> Identificación (QR)</p>
            <p className="text-[11.5px] text-brand-dark/50 mt-0.5">Se generará al guardar para ver la ficha completa.</p>
          </div>
        </div>

        <button onClick={() => save('list')} disabled={!canSave} className="w-full bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar planta'}</button>
        <button onClick={() => save('again')} disabled={!canSave} className="w-full bg-app-card border border-app-border text-brand-dark rounded-xl py-3 text-[14px] font-bold active:scale-95 transition-all disabled:opacity-50">Guardar y seguir</button>
      </div>
    </>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div>
    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>
    {children}
  </div>
);

export default MobileAddPlant;
