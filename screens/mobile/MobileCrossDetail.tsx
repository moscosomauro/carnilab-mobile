import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { Plant, Cross } from '../../types';
import { polStatus, statusConf, fmtDayLong, progresoCapsula, fw } from '../../utils/pollination';
import {
  CalendarClock, FlaskConical, MapPin, NotebookPen, Sprout, CheckCircle2,
  Circle, FlaskRound, Copy, Pencil, History, Bell, Image as ImageIcon
} from 'lucide-react';

const saludDe = (p?: Plant) =>
  !p ? '—' : p.estado === 'saludable' ? 'Excelente' : p.estado === 'regular' ? 'Regular' : 'Crítico';

const MobileCrossDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { crosses, plants, addCross } = useApp();
  const c = crosses.find(x => x.id === Number(id));

  if (!c) {
    return (
      <>
        <MobileHeader title="Detalle de cruza" back />
        <div className="px-5 py-16 text-center text-brand-dark/45 text-[13px]">Cruza no encontrada.</div>
      </>
    );
  }

  const madre = plants.find(p => p.nombre === c.madre_nombre);
  const padre = plants.find(p => p.nombre === c.padre_nombre);
  const st = polStatus(c);
  const sc = statusConf[st];
  const cap = progresoCapsula(c);
  const hecha = st === 'hecha';

  const steps = [
    { label: 'Programada', date: c.fecha_programada, done: true },
    { label: 'Polinizada', date: c.fecha_polinizacion, done: hecha },
    { label: 'Cápsula en desarrollo', date: cap.cosecha, done: !!c.capsula_estado && c.capsula_estado !== 'cosechada' ? false : c.capsula_estado === 'cosechada', active: c.capsula_estado === 'desarrollo' || c.capsula_estado === 'maduro' },
    { label: 'Cosecha', date: cap.cosecha, done: c.capsula_estado === 'cosechada' },
  ];

  const duplicar = async () => {
    const { id: _id, isSyncing, _updatedAt, ...rest } = c as any;
    await addCross({
      ...rest,
      nombre: `${c.nombre} (copia)`,
      estado: 'en_proceso', estado_polinizacion: 'programada',
      fecha_polinizacion: undefined, capsula_estado: undefined,
      semillas_obtenidas: 0, plantas_germinadas: 0,
    } as Omit<Cross, 'id'>);
    navigate('/crosses');
  };

  return (
    <>
      <MobileHeader title="Detalle de cruza" subtitle="Ficha y seguimiento" back />
      <div className="px-5 space-y-4 pb-28">
        {/* Encabezado */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-accent text-[22px] font-bold text-brand-dark leading-tight">{fw(c.madre_nombre)} × {fw(c.padre_nombre)}</h2>
            <p className="text-[12px] text-brand-dark/50 italic truncate">{c.madre_especie} × {c.padre_especie}</p>
          </div>
          <span className={`text-[11px] font-bold rounded-full px-3 py-1 shrink-0 ${sc.cls}`}>{sc.label}</span>
        </div>

        {/* Info rápida */}
        <div className="grid grid-cols-2 gap-2.5">
          <InfoCell icon={<CalendarClock size={14} />} label="Programada" value={fmtDayLong(c.fecha_programada)} />
          <InfoCell icon={<FlaskConical size={14} />} label="Polinizada" value={c.fecha_polinizacion ? fmtDayLong(c.fecha_polinizacion) : 'Pendiente'} />
          <InfoCell icon={<MapPin size={14} />} label="Invernadero" value={c.ubicacion || '—'} />
          <InfoCell icon={<NotebookPen size={14} />} label="Notas rápidas" value={c.notas || '—'} />
        </div>

        {/* Madre / Padre */}
        <div className="grid grid-cols-2 gap-2.5">
          <ParentCard role="Planta madre" plant={madre} nombre={c.madre_nombre} especie={c.madre_especie} img={c.madre_imagen} salud={saludDe(madre)} />
          <ParentCard role="Planta padre" plant={padre} nombre={c.padre_nombre} especie={c.padre_especie} img={c.padre_imagen} salud={saludDe(padre)} />
        </div>

        {/* Línea de tiempo */}
        <div className="bg-app-card border border-app-border rounded-xl p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-brand-primary mb-3">Seguimiento</p>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={s.done ? 'text-emerald-500' : (s as any).active ? 'text-[#C9A24B]' : 'text-brand-dark/25'}>
                  {s.done ? <CheckCircle2 size={18} /> : (s as any).active ? <FlaskRound size={18} /> : <Circle size={18} />}
                </span>
                <span className={`flex-1 text-[13px] font-semibold ${s.done || (s as any).active ? 'text-brand-dark' : 'text-brand-dark/40'}`}>{s.label}</span>
                <span className="text-[11px] text-brand-dark/40">{s.date ? fmtDayLong(s.date) : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Origen del polen + recordatorio */}
        <div className="grid grid-cols-2 gap-2.5">
          <InfoCell icon={<FlaskConical size={14} />} label="Origen del polen" value={c.fuente_polen || fw(c.padre_nombre)} />
          <InfoCell icon={<Bell size={14} />} label="Recordatorio" value={c.recordatorio ? 'Activo' : 'No'} />
        </div>

        {/* Fotos vinculadas */}
        {c.fotos && c.fotos.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark/55 mb-1.5"><ImageIcon size={14} className="text-[#C9A24B]" /> Fotos vinculadas</p>
            <div className="flex gap-2 overflow-x-auto">
              {c.fotos.slice(0, 6).map((f, i) => <img key={i} src={f} alt="" className="w-16 h-16 rounded-lg object-cover border border-app-border shrink-0" />)}
            </div>
          </div>
        )}

        {/* Acciones secundarias */}
        <div className="grid grid-cols-3 gap-2">
          <SecBtn icon={<Pencil size={15} />} label="Editar" onClick={() => navigate(`/crosses/${c.id}/edit`)} />
          <SecBtn icon={<Copy size={15} />} label="Duplicar" onClick={duplicar} />
          <SecBtn icon={<History size={15} />} label="Historial" onClick={() => navigate('/crosses/history')} />
        </div>

        {/* Acción principal */}
        {!hecha ? (
          <button onClick={() => navigate(`/crosses/${c.id}/pollinate`)} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all">
            <FlaskConical size={18} /> Registrar polinización
          </button>
        ) : (
          <button onClick={() => navigate('/crosses/capsules')} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-brand-primary/20 active:scale-95 transition-all">
            <Sprout size={18} /> Seguimiento de cápsula
          </button>
        )}
      </div>
    </>
  );
};

const InfoCell: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-3">
    <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-brand-dark/45 mb-0.5"><span className="text-[#C9A24B]">{icon}</span> {label}</p>
    <p className="text-[12.5px] font-bold text-brand-dark truncate">{value}</p>
  </div>
);

const ParentCard: React.FC<{ role: string; plant?: Plant; nombre: string; especie: string; img?: string | null; salud: string }> = ({ role, plant, nombre, especie, img, salud }) => (
  <div className="bg-app-card border border-app-border rounded-xl overflow-hidden">
    <div className="aspect-[4/3] bg-app-bg flex items-center justify-center overflow-hidden">
      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={especie} size={34} />}
    </div>
    <div className="p-2.5">
      <p className="text-[9px] font-black uppercase tracking-wider text-brand-primary/70">{role}</p>
      <p className="text-[13px] font-bold text-brand-dark truncate">{nombre}</p>
      <p className="text-[10.5px] text-brand-dark/45 italic truncate">{especie}</p>
      <p className="text-[10.5px] text-brand-dark/55 mt-1">Salud: <b className="text-brand-dark">{salud}</b></p>
      {plant?.ubicacion && <p className="text-[10.5px] text-brand-dark/45 truncate">{plant.ubicacion}</p>}
    </div>
  </div>
);

const SecBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 bg-app-card border border-app-border rounded-xl py-2.5 text-brand-dark/70 active:scale-95 transition-all">
    <span className="text-[#C9A24B]">{icon}</span>
    <span className="text-[11px] font-semibold">{label}</span>
  </button>
);

export default MobileCrossDetail;
