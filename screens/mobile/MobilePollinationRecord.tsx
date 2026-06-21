import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { Cross, PollinationChecklist } from '../../types';
import { statusConf, polStatus, fmtDayLong, estimarCosecha, fw } from '../../utils/pollination';
import { compressImage } from '../../utils/imageHelpers';
import { Camera, Thermometer, Droplets, NotebookPen, Sprout, Check } from 'lucide-react';

const inp = "w-full h-11 rounded-xl bg-app-card border border-app-border px-3 text-[14px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20";

const CHECKS: { key: keyof PollinationChecklist; label: string }[] = [
  { key: 'polen_aplicado', label: 'Polen aplicado' },
  { key: 'estigma_receptivo', label: 'Estigma receptivo' },
  { key: 'pincel_limpio', label: 'Pincel limpio' },
  { key: 'etiqueta_colocada', label: 'Etiqueta colocada' },
  { key: 'aislamiento_aplicado', label: 'Aislamiento aplicado' },
];

const PASOS = [
  'Seleccioná la cruza', 'Verificá estado del estigma', 'Aplicá polen con pincel limpio',
  'Aislá la flor', 'Registrá la información', 'Marcá como hecha',
];

const MobilePollinationRecord: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { crosses, updateCross } = useApp();
  const c = crosses.find(x => x.id === Number(id));
  const fileRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const [foto, setFoto] = useState<string | null>(c?.fotos?.[0] || null);
  const [fecha, setFecha] = useState((c?.fecha_polinizacion ? new Date(c.fecha_polinizacion) : now).toISOString().split('T')[0]);
  const [hora, setHora] = useState(c?.hora_polinizacion || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const [check, setCheck] = useState<PollinationChecklist>(c?.checklist || {});
  const [temp, setTemp] = useState<string>(c?.temp != null ? String(c.temp) : '');
  const [humedad, setHumedad] = useState<string>(c?.humedad != null ? String(c.humedad) : '');
  const [notas, setNotas] = useState(c?.notas || '');
  const [expectativa, setExpectativa] = useState(c?.expectativa_capsula || '');
  const [saving, setSaving] = useState(false);

  if (!c) {
    return (<><MobileHeader title="Registrar polinización" back /><div className="px-5 py-16 text-center text-brand-dark/45 text-[13px]">Cruza no encontrada.</div></>);
  }
  const sc = statusConf[polStatus(c)];

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) setFoto(await compressImage(f)); if (e.target) e.target.value = '';
  };

  const persist = async (marcarHecha: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const fechaISO = new Date(`${fecha}T${hora || '00:00'}`).toISOString();
      const fotos = foto ? Array.from(new Set([foto, ...(c.fotos || [])])) : c.fotos;
      const upd: Cross = {
        ...c,
        fecha_polinizacion: fechaISO, hora_polinizacion: hora,
        checklist: check,
        temp: temp === '' ? null : Number(temp),
        humedad: humedad === '' ? null : Number(humedad),
        notas, expectativa_capsula: expectativa, fotos,
      };
      if (marcarHecha) {
        upd.estado_polinizacion = 'hecha';
        upd.estado = 'completada';
        upd.capsula_estado = c.capsula_estado || 'desarrollo';
        upd.cosecha_estimada = c.cosecha_estimada || estimarCosecha(fechaISO) || undefined;
      } else if (polStatus(c) === 'programada') {
        upd.estado_polinizacion = 'pendiente';
      }
      await updateCross(upd);
      navigate(`/crosses/${c.id}`);
    } finally { setSaving(false); }
  };

  return (
    <>
      <MobileHeader title="Registrar polinización" subtitle="Evento del día" back />
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="px-5 space-y-4 pb-28">
        {/* Resumen de la cruza */}
        <div className="bg-app-card border border-app-border rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-bold text-brand-dark truncate">{fw(c.madre_nombre)} × {fw(c.padre_nombre)}</p>
            <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${sc.cls}`}>{sc.label}</span>
          </div>
          <p className="text-[11px] text-brand-dark/45 mt-0.5">{c.ubicacion || 'Sin invernadero'} · Programada {fmtDayLong(c.fecha_programada)}</p>
        </div>

        {/* Foto */}
        <div onClick={() => fileRef.current?.click()} className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[16/10] flex items-center justify-center">
          {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-brand-dark/35"><Camera size={30} /><span className="text-[12.5px] mt-1">Foto del evento</span></div>}
          <span className="absolute bottom-2 right-2 bg-brand-primary text-white text-[11px] font-bold rounded-full px-3 py-1.5 flex items-center gap-1"><Camera size={13} /> Tomar foto</span>
        </div>

        {/* Fecha + hora */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inp} /></Field>
          <Field label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inp} /></Field>
        </div>

        {/* Checklist */}
        <div>
          <p className="text-[12px] font-semibold text-brand-dark/55 mb-2">Verificación</p>
          <div className="grid grid-cols-1 gap-2">
            {CHECKS.map(({ key, label }) => {
              const on = !!check[key];
              return (
                <button key={key} onClick={() => setCheck(c => ({ ...c, [key]: !on }))}
                  className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-3 py-2.5">
                  <span className={`w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${on ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-app-border text-transparent'}`}><Check size={14} /></span>
                  <span className={`text-[13.5px] font-semibold ${on ? 'text-brand-dark' : 'text-brand-dark/55'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Condiciones ambientales */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Temperatura (°C)"><div className="relative"><Thermometer size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A24B]" /><input type="number" value={temp} onChange={e => setTemp(e.target.value)} placeholder="24" className={inp + ' pl-9'} /></div></Field>
          <Field label="Humedad (%)"><div className="relative"><Droplets size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9A24B]" /><input type="number" value={humedad} onChange={e => setHumedad(e.target.value)} placeholder="65" className={inp + ' pl-9'} /></div></Field>
        </div>

        {/* Notas + expectativa */}
        <Field label="Notas rápidas"><div className="relative"><NotebookPen size={15} className="absolute left-3 top-3 text-[#C9A24B]" /><textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} maxLength={300} placeholder="Polen abundante, estigma receptivo" className={inp.replace('h-11', 'min-h-[64px] py-2') + ' pl-9 resize-none'} /></div></Field>
        <Field label="Expectativa de cápsula"><input value={expectativa} onChange={e => setExpectativa(e.target.value)} maxLength={120} placeholder="Alta — planta vigorosa" className={inp} /></Field>

        {/* Flujo de trabajo */}
        <div className="bg-app-bg/60 border border-app-border rounded-xl p-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-brand-primary mb-2">Flujo de trabajo</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {PASOS.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A24B]/15 text-[#9a7b2f] text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-[11px] text-brand-dark/60 leading-tight">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <button onClick={() => persist(true)} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50">
          <Sprout size={18} /> {saving ? 'Guardando…' : 'Marcar como hecha'}
        </button>
        <button onClick={() => persist(false)} disabled={saving} className="w-full rounded-xl border border-app-border py-3 text-[14px] font-bold text-brand-dark active:scale-95 transition-all disabled:opacity-50">
          Guardar borrador
        </button>
      </div>
    </>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div><p className="text-[12px] font-semibold text-brand-dark/55 mb-1.5">{label}</p>{children}</div>
);

export default MobilePollinationRecord;
