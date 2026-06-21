import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { CrossSchema, validateData } from '../../utils/validationSchemas';
import { Plant } from '../../types';
import {
  Venus, Mars, CalendarClock, Clock, MapPin, Target, NotebookPen, FlaskConical,
  Tag, Flag, Bell, ChevronDown, Dna, Flower2
} from 'lucide-react';

const inp = "w-full h-12 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20";
const mmYYYY = (f: string) => { const d = new Date(f); return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const firstWord = (s: string) => s.split(' ')[0];

const MobileCrossNew: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plants, crosses, addCross, updateCross, addAlert } = useApp();

  const editing = id ? crosses.find(c => c.id === Number(id)) : undefined;
  const idByName = (n?: string) => plants.find(p => p.nombre === n)?.id?.toString() || '';

  const [madreId, setMadreId] = useState(editing ? idByName(editing.madre_nombre) : '');
  const [padreId, setPadreId] = useState(editing ? idByName(editing.padre_nombre) : '');
  const [fecha, setFecha] = useState((editing?.fecha_programada || editing?.fecha_cruza || new Date().toISOString()).split('T')[0]);
  const [hora, setHora] = useState(editing?.hora_programada || '11:00');
  const [ubicacion, setUbicacion] = useState(editing?.ubicacion || '');
  const [extraId, setExtraId] = useState(editing?.padres_extra?.[0] ? idByName(editing.padres_extra[0].nombre) : '');
  const [objetivo, setObjetivo] = useState(editing?.objetivo || '');
  const [notas, setNotas] = useState(editing?.notas || '');
  const [fuentePolen, setFuentePolen] = useState(editing?.fuente_polen || '');
  const [etiqueta, setEtiqueta] = useState(editing?.etiqueta || '');
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta'>(editing?.prioridad || 'media');
  const [recordatorio, setRecordatorio] = useState(editing?.recordatorio ?? true);
  const [saving, setSaving] = useState(false);

  const madre = plants.find(p => p.id === Number(madreId));
  const padre = plants.find(p => p.id === Number(padreId));
  const extra = plants.find(p => p.id === Number(extraId));

  // Plantas en floración primero (son la fuente de las cruzas)
  const ordered = useMemo(() => {
    return [...plants].sort((a, b) => Number(!!b.en_floracion) - Number(!!a.en_floracion) || a.nombre.localeCompare(b.nombre));
  }, [plants]);

  const sugeridaEtiqueta = madre && padre
    ? `${firstWord(madre.nombre).slice(0, 2).toUpperCase()}-${firstWord(padre.nombre).slice(0, 2).toUpperCase()}`
    : '';

  const save = async () => {
    if (saving) return;
    if (!madre || !padre) { alert('Elegí planta madre y planta padre'); return; }
    const fechaISO = new Date(`${fecha}T${hora || '00:00'}`).toISOString();
    const nombre = `${firstWord(madre.nombre)} × ${firstWord(padre.nombre)} - ${mmYYYY(fecha)}`;
    const data = {
      nombre,
      madre_nombre: madre.nombre, madre_especie: madre.especie || 'Desconocida',
      padre_nombre: padre.nombre, padre_especie: padre.especie || 'Desconocida',
      padres_extra: extra ? [{ nombre: extra.nombre, especie: extra.especie || 'Desconocida' }] : [],
      fecha_cruza: fechaISO,
      objetivo, notas,
      semillas_obtenidas: 0, plantas_germinadas: 0,
      estado: 'en_proceso' as const,
      // Planificación de polinización
      estado_polinizacion: 'programada' as const,
      fecha_programada: fechaISO, hora_programada: hora,
      ubicacion, prioridad, recordatorio,
      fuente_polen: fuentePolen, etiqueta: etiqueta || sugeridaEtiqueta,
    };
    const v = validateData(CrossSchema, data);
    if (!v.success) { alert('❌ ' + (v.errors?.join('\n') || 'Datos inválidos')); return; }
    setSaving(true);
    try {
      if (editing) {
        // Edición: preserva estado/cápsula/semillas; actualiza la planificación
        await updateCross({
          ...editing, ...v.data!,
          estado_polinizacion: editing.estado_polinizacion || 'programada',
          madre_imagen: madre.imagen, padre_imagen: padre.imagen,
        } as any);
        navigate(`/crosses/${editing.id}`);
        return;
      }
      const r = await addCross({
        ...v.data!,
        madre_imagen: madre.imagen, padre_imagen: padre.imagen,
        hibrido_imagen: null, fecha_germinacion: null,
      } as any);
      if (!r.success) { alert('❌ ' + (r.error || 'No se pudo guardar')); return; }
      // Recordatorio → alerta (dispara la notificación local el día programado)
      if (recordatorio) {
        await addAlert({
          tipo: 'otro', planta: madre.nombre,
          mensaje: `Polinizar ${firstWord(madre.nombre)} × ${firstWord(padre.nombre)}`,
          prioridad, fecha: fechaISO, completada: false, icon: 'otro',
        } as any);
      }
      navigate('/crosses');
    } finally { setSaving(false); }
  };

  return (
    <>
      <MobileHeader title={editing ? 'Editar cruza' : 'Nueva cruza'} subtitle="Planificar polinización" back />
      <div className="px-5 space-y-4 pb-28">
        {/* Madre / Padre */}
        <PlantPicker icon={<Venus size={15} className="text-rose-400" />} label="Planta madre" plants={ordered} value={madreId} onChange={setMadreId} selected={madre} />
        <PlantPicker icon={<Mars size={15} className="text-sky-500" />} label="Planta padre" plants={ordered} value={padreId} onChange={setPadreId} selected={padre} />

        {/* Fecha + hora */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<CalendarClock size={15} />} label="Fecha programada"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} /></Field>
          <Field icon={<Clock size={15} />} label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inp} /></Field>
        </div>

        {/* Ubicación + parental extra */}
        <Field icon={<MapPin size={15} />} label="Ubicación / invernadero"><input value={ubicacion} maxLength={60} onChange={e => setUbicacion(e.target.value)} placeholder="Invernadero 2" className={inp} /></Field>
        <PlantPicker icon={<Flower2 size={15} className="text-fuchsia-500" />} label="Parental extra (opcional)" plants={ordered} value={extraId} onChange={setExtraId} selected={extra} optional />

        {/* Objetivo + notas */}
        <Field icon={<Target size={15} />} label="Objetivo"><input value={objetivo} maxLength={100} onChange={e => setObjetivo(e.target.value)} placeholder="Híbrido con mejor coloración" className={inp} /></Field>
        <Field icon={<NotebookPen size={15} />} label="Notas (opcional)"><input value={notas} maxLength={200} onChange={e => setNotas(e.target.value)} placeholder="Polen fresco, clima estable" className={inp} /></Field>

        {/* Fuente de polen + etiqueta */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<FlaskConical size={15} />} label="Fuente de polen"><input value={fuentePolen} maxLength={60} onChange={e => setFuentePolen(e.target.value)} placeholder="Padre seleccionado" className={inp} /></Field>
          <Field icon={<Tag size={15} />} label="Etiqueta"><input value={etiqueta} onChange={e => setEtiqueta(e.target.value.toUpperCase())} placeholder={sugeridaEtiqueta || 'SC-VG'} maxLength={20} className={inp + ' font-mono'} /></Field>
        </div>

        {/* Prioridad */}
        <Field icon={<Flag size={15} />} label="Prioridad">
          <div className="grid grid-cols-3 gap-2">
            {(['baja', 'media', 'alta'] as const).map(p => (
              <button key={p} onClick={() => setPrioridad(p)}
                className={`rounded-xl border py-2.5 text-[13px] font-bold capitalize transition-all ${prioridad === p
                  ? p === 'alta' ? 'border-rose-300 bg-rose-50 text-rose-600' : p === 'media' ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-sky-300 bg-sky-50 text-sky-600'
                  : 'border-app-border text-brand-dark/55'}`}>
                {p}
              </button>
            ))}
          </div>
        </Field>

        {/* Recordatorio */}
        <button onClick={() => setRecordatorio(r => !r)} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-4 py-3">
          <Bell size={17} className="text-[#C9A24B] shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-[13px] font-bold text-brand-dark">Recordatorio</p>
            <p className="text-[11px] text-brand-dark/45">Avisarme el día programado</p>
          </div>
          <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${recordatorio ? 'bg-emerald-500' : 'bg-app-border'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${recordatorio ? 'translate-x-5' : ''}`} />
          </span>
        </button>

        {/* Vista previa */}
        <div className="flex items-center gap-3 rounded-xl border border-[#C9A24B]/30 bg-[#C9A24B]/8 p-3">
          <PreviewMini plant={madre} fallbackIcon={<Venus size={18} className="text-rose-400" />} />
          <span className="text-brand-dark/40 font-bold">×</span>
          <PreviewMini plant={padre} fallbackIcon={<Mars size={18} className="text-sky-500" />} />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[12.5px] font-bold text-brand-dark truncate">{madre ? firstWord(madre.nombre) : 'Madre'} × {padre ? firstWord(padre.nombre) : 'Padre'}</p>
            <span className="text-[10px] font-bold text-[#9a7b2f] bg-[#C9A24B]/15 rounded-full px-2 py-0.5">Programada</span>
          </div>
        </div>

        <button onClick={save} disabled={saving || !madre || !padre}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">
          <Dna size={18} /> {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar cruza'}
        </button>
      </div>
    </>
  );
};

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div><p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>{children}</div>
);

const PlantPicker: React.FC<{
  icon: React.ReactNode; label: string; plants: Plant[]; value: string; onChange: (v: string) => void; selected?: Plant; optional?: boolean;
}> = ({ icon, label, plants, value, onChange, selected, optional }) => (
  <Field icon={icon} label={label}>
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={inp + ' appearance-none pr-9 font-semibold cursor-pointer'}>
        <option value="">{optional ? 'Sin parental extra' : 'Seleccionar…'}</option>
        {plants.map(p => <option key={p.id} value={p.id}>{p.en_floracion ? '🌸 ' : ''}{p.nombre}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
    </div>
    {selected && (
      <div className="flex items-center gap-3 mt-2 bg-app-card border border-app-border rounded-xl p-2.5">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
          {selected.imagen ? <img src={selected.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={selected.especie} size={26} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-brand-dark truncate">{selected.nombre}</p>
          <p className="text-[11px] text-brand-dark/45 italic truncate">{selected.especie || 'Especie desconocida'}</p>
        </div>
        {selected.en_floracion && <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 rounded-full px-2 py-0.5 shrink-0 flex items-center gap-1"><Flower2 size={11} /> En floración</span>}
      </div>
    )}
  </Field>
);

const PreviewMini: React.FC<{ plant?: Plant; fallbackIcon: React.ReactNode }> = ({ plant, fallbackIcon }) => (
  <div className="w-10 h-10 rounded-lg overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
    {plant?.imagen ? <img src={plant.imagen} alt="" className="w-full h-full object-cover" /> : plant ? <SpeciesIcon species={plant.especie} size={22} /> : fallbackIcon}
  </div>
);

export default MobileCrossNew;
