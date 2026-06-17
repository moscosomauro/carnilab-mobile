import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plant } from '../types';
import { compressImage, uploadImage } from '../utils/imageHelpers';
import { PlantSchema, validateData } from '../utils/validationSchemas';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, UploadCloud, Eye, QrCode, Check, ImageIcon, Plus, ArrowRight
} from 'lucide-react';

// Grupos de especies (mismo catálogo que el selector clásico)
const SPECIES_GROUPS: [string, [string, string][]][] = [
  ['Dionaea (Venus Atrapamoscas)', [
    ["Dionaea muscipula", "Dionaea muscipula (Clásica)"],
    ["Dionaea muscipula 'Akai Ryu'", "Dionaea muscipula 'Akai Ryu' (Dragón Rojo)"],
    ["Dionaea muscipula 'B52'", "Dionaea muscipula 'B52'"],
    ["Dionaea muscipula 'King Henry'", "Dionaea muscipula 'King Henry'"],
    ["Dionaea muscipula 'Dentate'", "Dionaea muscipula 'Dentate'"],
  ]],
  ['Nepenthes (Plantas Jarro)', [
    ["Nepenthes alata", "Nepenthes alata"], ["Nepenthes ventricosa", "Nepenthes ventricosa"],
    ["Nepenthes rafflesiana", "Nepenthes rafflesiana"], ["Nepenthes mirabilis", "Nepenthes mirabilis"],
    ["Nepenthes ampullaria", "Nepenthes ampullaria"], ["Nepenthes bicalcarata", "Nepenthes bicalcarata"],
    ["Nepenthes rajah", "Nepenthes rajah (Gigante)"], ["Nepenthes truncata", "Nepenthes truncata"],
    ["Nepenthes hamata", "Nepenthes hamata"], ["Nepenthes lowii", "Nepenthes lowii"],
  ]],
  ['Sarracenia (Trompetas)', [
    ["Sarracenia purpurea", "Sarracenia purpurea (Púrpura)"], ["Sarracenia flava", "Sarracenia flava (Amarilla)"],
    ["Sarracenia leucophylla", "Sarracenia leucophylla (Blanca)"], ["Sarracenia rubra", "Sarracenia rubra (Roja)"],
    ["Sarracenia psittacina", "Sarracenia psittacina (Loro)"], ["Sarracenia minor", "Sarracenia minor"],
    ["Sarracenia oreophila", "Sarracenia oreophila"],
  ]],
  ['Drosera (Rocío de Sol)', [
    ["Drosera capensis", "Drosera capensis (Cabo)"], ["Drosera aliciae", "Drosera aliciae"],
    ["Drosera binata", "Drosera binata (Bifurcada)"], ["Drosera spatulata", "Drosera spatulata"],
    ["Drosera rotundifolia", "Drosera rotundifolia"], ["Drosera adelae", "Drosera adelae"],
    ["Drosera burmannii", "Drosera burmannii"], ["Drosera regia", "Drosera regia (Reina)"],
  ]],
  ['Pinguicula (Grasilla)', [
    ["Pinguicula moranensis", "Pinguicula moranensis"], ["Pinguicula agnata", "Pinguicula agnata"],
    ["Pinguicula esseriana", "Pinguicula esseriana"], ["Pinguicula grandiflora", "Pinguicula grandiflora"],
    ["Pinguicula cyclosecta", "Pinguicula cyclosecta"],
  ]],
  ['Otras / Híbridos', [
    ["Cephalotus follicularis", "Cephalotus follicularis (Jarro Australiano)"],
    ["Heliamphora nutans", "Heliamphora nutans"], ["Darlingtonia californica", "Darlingtonia californica (Cobra)"],
    ["Híbrido Sarracenia", "Híbrido Sarracenia"], ["Híbrido Nepenthes", "Híbrido Nepenthes"],
    ["Híbrido Drosera", "Híbrido Drosera"], ["Otra especie", "Otra especie"],
  ]],
];

const ILUMINACION_OPTS = ['Luz directa', 'Luz brillante indirecta', 'Sol pleno', 'Sombra parcial'];
const HUMEDAD_OPTS = ['40 - 60%', '60 - 80%', '80 - 100%'];

interface LocalImage { id: string; url: string; file?: File; isNew: boolean; }

const inputCls = "w-full h-11 rounded-xl bg-app-card border border-app-border px-4 text-[13.5px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const labelCls = "block text-[12px] font-semibold text-brand-dark/55 mb-1.5";

const AddPlant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPlant, updatePlant, plants } = useApp();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingPlant = location.state as Plant | undefined;
  const isEditing = !!editingPlant;

  const [formData, setFormData] = useState({
    nombre: '', especie: '', fecha_adquisicion: new Date().toISOString().split('T')[0],
    origen: '', precio: '', estado: 'saludable' as 'saludable' | 'regular' | 'critico',
    ubicacion: '', notas: '', en_venta: false, precio_venta: '',
    iluminacion: '', humedad: '', sustrato: '', tamano_maceta: '', en_floracion: false,
  });
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isCustomSpecies, setIsCustomSpecies] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const customSpecies = React.useMemo(() => {
    const known = new Set(SPECIES_GROUPS.flatMap(([, opts]) => opts.map(([v]) => v)));
    const s = new Set<string>();
    plants.forEach(p => { if (p.especie && !known.has(p.especie)) s.add(p.especie); });
    return Array.from(s);
  }, [plants]);

  useEffect(() => {
    if (editingPlant) {
      setFormData({
        nombre: editingPlant.nombre, especie: editingPlant.especie,
        fecha_adquisicion: editingPlant.fecha_adquisicion || '', origen: editingPlant.origen || '',
        precio: editingPlant.precio?.toString() || '', estado: editingPlant.estado,
        ubicacion: editingPlant.ubicacion || '', notas: editingPlant.notas || '',
        en_venta: !!editingPlant.en_venta, precio_venta: editingPlant.precio_venta?.toString() || '',
        iluminacion: editingPlant.iluminacion || '', humedad: editingPlant.humedad || '',
        sustrato: editingPlant.sustrato || '', tamano_maceta: editingPlant.tamano_maceta || '', en_floracion: !!editingPlant.en_floracion,
      });
      setEtiquetas(editingPlant.etiquetas || []);
      if (editingPlant.images?.length) setImages(editingPlant.images.map(i => ({ id: String(i.id), url: i.image_url, isNew: false })));
      else if (editingPlant.imagen) setImages([{ id: 'legacy', url: editingPlant.imagen, isNew: false }]);
    }
  }, [editingPlant]);

  const set = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: LocalImage[] = [];
    for (let i = 0; i < files.length; i++) {
      try { next.push({ id: `new_${Date.now()}_${i}`, url: await compressImage(files[i]), file: files[i], isNew: true }); }
      catch (e) { console.error('Error procesando imagen:', e); }
    }
    setImages(prev => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id));

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !etiquetas.includes(v)) setEtiquetas(prev => [...prev, v]);
    setTagInput('');
  };

  const handleSave = async (after: 'list' | 'detail') => {
    if (isSaving) return;
    setIsSaving(true); setSavingStep('Validando...');
    try {
      const toValidate = {
        nombre: formData.nombre, especie: formData.especie, fecha_adquisicion: formData.fecha_adquisicion,
        origen: formData.origen || '', precio: formData.precio ? Number(formData.precio) : null,
        estado: formData.estado, ubicacion: formData.ubicacion || '', notas: formData.notas || '',
        en_venta: formData.en_venta, precio_venta: formData.en_venta && formData.precio_venta ? Number(formData.precio_venta) : null,
        iluminacion: formData.iluminacion || '', humedad: formData.humedad || '',
        sustrato: formData.sustrato || '', tamano_maceta: formData.tamano_maceta || '', etiquetas,
        en_floracion: formData.en_floracion,
        fecha_floracion: formData.en_floracion ? (editingPlant?.fecha_floracion || new Date().toISOString()) : '',
      };
      const v = validateData(PlantSchema, toValidate);
      if (!v.success) { alert(`❌ Datos inválidos:\n\n${v.errors?.join('\n')}`); setIsSaving(false); return; }

      const finalImages: { url: string }[] = [];
      const newCount = images.filter(i => i.isNew).length;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.isNew && img.file && user?.key) {
          try { setSavingStep(`Procesando foto ${i + 1}/${newCount}...`); const u = await uploadImage(img.file, user.key); if (u) finalImages.push({ url: u }); }
          catch (e) { console.error('Error subiendo imagen', e); }
        } else finalImages.push({ url: img.url });
      }

      const plantData = {
        ...v.data!, imagen: finalImages[0]?.url || null,
        images: finalImages.map((img, idx) => ({ id: `img_${Date.now()}_${idx}`, plant_id: isEditing && editingPlant ? editingPlant.id : 0, image_url: img.url, display_order: idx })),
      };

      setSavingStep('Guardando planta...');
      let savedId: number | null = isEditing && editingPlant ? editingPlant.id : null;
      let ok = false;
      if (isEditing && editingPlant) ok = await updatePlant({ ...plantData, id: editingPlant.id });
      else { const np = await addPlant(plantData); if (np) { savedId = np.id; ok = true; } }

      if (ok) {
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); navigate(after === 'detail' && savedId ? `/plant/${savedId}` : '/plants'); }, 1100);
      } else alert('Error al guardar la planta.');
    } catch (e: any) {
      console.error('[AddPlant] error', e); alert('Error al guardar: ' + (e.message || 'desconocido'));
    } finally { setIsSaving(false); setSavingStep(''); }
  };

  const canSave = !!formData.nombre && !!formData.especie && !isSaving;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-plants" size={26} />
        </div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">{isEditing ? 'Editar planta' : 'Nueva planta'}</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">{isEditing ? 'Actualiza los datos de tu planta' : 'Registra una nueva planta en tu colección'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Formulario ===== */}
        <div className="xl:col-span-8 space-y-5">
          {/* 1. Información general */}
          <Section n={1} title="Información general">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className={labelCls}>Nombre de planta *</label>
                <input value={formData.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Scarlet Belle" className={inputCls} />
              </div>
              <div className="md:col-span-1">
                <label className={labelCls}>Especie *</label>
                {!isCustomSpecies ? (
                  <select value={formData.especie}
                    onChange={e => { if (e.target.value === '--new--') { setIsCustomSpecies(true); set('especie', ''); } else set('especie', e.target.value); }}
                    className={inputCls + ' cursor-pointer'}>
                    <option value="">Seleccionar especie</option>
                    <option value="--new--">✨ Añadir especie / híbrido propio…</option>
                    {customSpecies.length > 0 && (
                      <optgroup label="Mis especies">{customSpecies.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
                    )}
                    {SPECIES_GROUPS.map(([g, opts]) => (
                      <optgroup key={g} label={g}>{opts.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}</optgroup>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input autoFocus value={formData.especie} onChange={e => set('especie', e.target.value)} placeholder="Escribe la especie…" className={inputCls} />
                    <button onClick={() => { setIsCustomSpecies(false); set('especie', ''); }} className="w-11 h-11 rounded-xl border border-app-border flex items-center justify-center text-brand-dark/50 hover:bg-app-bg shrink-0"><X size={16} /></button>
                  </div>
                )}
              </div>
              <div className="md:col-span-1">
                <label className={labelCls}>Fecha de adquisición *</label>
                <input type="date" value={formData.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Origen</label>
                <input value={formData.origen} onChange={e => set('origen', e.target.value)} placeholder="Ej: California Carnivores" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Precio (USD)</label>
                <input type="number" value={formData.precio} onChange={e => set('precio', e.target.value)} placeholder="Ej: 95.00" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado de salud</label>
                <select value={formData.estado} onChange={e => set('estado', e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="saludable">Saludable</option>
                  <option value="regular">Regular</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelCls}>Ubicación actual</label>
                <input value={formData.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ej: Invernadero A1" className={inputCls} />
              </div>
            </div>
          </Section>

          {/* 2. Detalles de cultivo */}
          <Section n={2} title="Detalles de cultivo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Iluminación</label>
                <select value={formData.iluminacion} onChange={e => set('iluminacion', e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="">Seleccionar…</option>
                  {ILUMINACION_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Humedad</label>
                <select value={formData.humedad} onChange={e => set('humedad', e.target.value)} className={inputCls + ' cursor-pointer'}>
                  <option value="">Seleccionar…</option>
                  {HUMEDAD_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Sustrato</label>
                <input value={formData.sustrato} onChange={e => set('sustrato', e.target.value)} placeholder="Ej: Turba rubia + perlita" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tamaño de maceta</label>
                <input value={formData.tamano_maceta} onChange={e => set('tamano_maceta', e.target.value)} placeholder="Ej: 12 cm" className={inputCls} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-app-card border border-app-border px-4 h-11 self-end">
                <span className="text-[13px] font-semibold text-brand-dark/70">En floración</span>
                <button type="button" onClick={() => set('en_floracion', !formData.en_floracion)} className={`w-11 h-6 rounded-full relative transition-colors ${formData.en_floracion ? 'bg-[#C9A24B]' : 'bg-app-border'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${formData.en_floracion ? 'left-[22px]' : 'left-0.5'}`} /></button>
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Etiquetas</label>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Agregar etiqueta… (Enter para agregar)" className={inputCls} />
                {etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {etiquetas.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 bg-[#C9A24B]/12 text-brand-dark/70 rounded-full px-2.5 py-1 text-[11.5px] font-semibold">
                        {t} <button onClick={() => setEtiquetas(prev => prev.filter(x => x !== t))} className="text-brand-dark/40 hover:text-rose-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* 3. Notas */}
          <Section n={3} title="Notas">
            <textarea value={formData.notas} onChange={e => set('notas', e.target.value)} maxLength={2000} rows={3}
              placeholder="Agrega notas sobre esta planta, su historia, características especiales, etc."
              className="w-full rounded-xl bg-app-card border border-app-border p-4 text-[13.5px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
            <p className="text-right text-[11px] text-brand-dark/35 mt-1">{formData.notas.length} / 2000</p>
          </Section>

          {/* 4. Galería de fotos */}
          <Section n={4} title="Galería de fotos">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <button onClick={() => fileInputRef.current?.click()}
                className="col-span-2 sm:col-span-1 aspect-square rounded-xl border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-1.5 text-brand-dark/40 hover:bg-app-bg hover:border-brand-primary/30 transition-colors">
                <UploadCloud size={22} />
                <span className="text-[11px] font-semibold text-center px-2">Arrastra o haz clic</span>
                <span className="text-[9px] text-brand-dark/30">JPG, PNG · 10 MB</span>
              </button>
              {images.map((img, idx) => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-app-border group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">Portada</span>}
                  <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={11} /></button>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, i) => (
                <div key={`ph_${i}`} className="aspect-square rounded-xl border border-app-border bg-app-bg/40 flex flex-col items-center justify-center text-brand-dark/20">
                  <ImageIcon size={20} /><span className="text-[10px] mt-1">Foto {images.length + i + 1}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer acciones (mobile/inline) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-5 py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg transition-colors"><X size={15} /> Cancelar</button>
            <div className="flex-1" />
            <button disabled={!canSave} onClick={() => handleSave('list')} className="bg-app-card border border-app-border rounded-full px-5 py-2.5 text-[13px] font-bold text-brand-dark hover:bg-app-bg transition-colors disabled:opacity-40">{isSaving ? (savingStep || 'Guardando…') : 'Guardar planta'}</button>
            <button disabled={!canSave} onClick={() => handleSave('detail')} className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-6 py-2.5 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-40">
              {isSaving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {savingStep || 'Guardando…'}</span> : <>Guardar y continuar <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>

        {/* ===== Vista previa ===== */}
        <div className="xl:col-span-4 space-y-5">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 xl:sticky xl:top-20">
            <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3">
              <span className="text-[#C9A24B]"><Eye size={14} /></span> Vista previa
            </p>
            <div className="rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[4/3] mb-4">
              {images[0]?.url ? <img src={images[0].url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-brand-dark/20">{formData.especie ? <SpeciesIcon species={formData.especie} size={70} /> : <ImageIcon size={40} />}</div>}
            </div>
            <h3 className="flex items-center gap-1.5 font-accent text-[22px] font-bold text-brand-dark leading-tight">
              {formData.nombre || 'Nombre de la planta'} <span className="text-[#C9A24B]/50">★</span>
            </h3>
            <p className="text-[13px] italic text-brand-dark/50 mb-3">{formData.especie || 'Especie'}</p>
            <div className="space-y-2 text-[12.5px]">
              {[['Origen', formData.origen], ['Adquisición', formData.fecha_adquisicion ? new Date(formData.fecha_adquisicion).toLocaleDateString('es-AR') : ''], ['Ubicación', formData.ubicacion], ['Precio', formData.precio ? `$${formData.precio} USD` : '']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-brand-dark/45">{k}</span><span className="font-semibold text-brand-dark">{v || '—'}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-brand-dark/45">Estado de salud</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-dark capitalize">
                  <span className={`w-1.5 h-1.5 rounded-full ${formData.estado === 'saludable' ? 'bg-emerald-500' : formData.estado === 'regular' ? 'bg-amber-500' : 'bg-rose-500'}`} /> {formData.estado}
                </span>
              </div>
            </div>
          </div>

          {/* QR vista previa */}
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3">
              <span className="text-[#C9A24B]"><QrCode size={14} /></span> Etiqueta con código QR
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-brand-dark truncate">{formData.nombre || 'Nombre de la planta'}</p>
                <p className="text-[11.5px] italic text-brand-dark/45 truncate">{formData.especie || 'Especie'}</p>
                <p className="text-[11px] text-brand-dark/40 mt-1">ID: PLT-{new Date().getFullYear()}-####</p>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-app-border shrink-0 opacity-80">
                <QRCodeSVG value={`carnilab:new:${formData.nombre || 'planta'}`} size={70} bgColor="#ffffff" fgColor="#7A1E2C" />
              </div>
            </div>
            <p className="text-[11px] text-brand-dark/40 mt-3 leading-snug">ℹ️ El código y la etiqueta se generarán al guardar la planta.</p>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-app-bg/60 backdrop-blur-sm flex items-center justify-center z-[200] animate-fade-in">
          <div className="bg-brand-secondary w-20 h-20 rounded-full flex items-center justify-center shadow-2xl animate-scale-in">
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
    <h3 className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 rounded-full bg-[#C9A24B]/15 text-[#C9A24B] text-[12px] font-black flex items-center justify-center">{n}</span>
      <span className="font-accent text-[18px] font-bold text-brand-dark">{title}</span>
    </h3>
    {children}
  </div>
);

export default AddPlant;
