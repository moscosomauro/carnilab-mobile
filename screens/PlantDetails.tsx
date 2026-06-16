import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/planHelpers';
import { DiaryEntry } from '../types';
import { AssetIcon } from '../components/AssetIcon';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { TechnicalSheet } from '../components/TechnicalSheet';
import { QRLabel } from '../components/QRLabel';
import ImageLightbox from '../components/ImageLightbox';
import { QRCodeSVG } from 'qrcode.react';
import {
  ChevronLeft, ChevronDown, Pencil, Trash2, ScanLine, Maximize2, Star,
  User, Leaf, CalendarDays, MapPin, DollarSign, FileText, NotebookPen,
  Droplets, FlaskConical, Scissors, Eye, Ruler, Sprout, Sun, Thermometer,
  Wind, QrCode, Printer, Download, Image as ImageIcon, Plus
} from 'lucide-react';

const estadoMeta: Record<string, { label: string; dot: string; text: string }> = {
  saludable: { label: 'Saludable', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  regular: { label: 'Regular', dot: 'bg-amber-500', text: 'text-amber-600' },
  critico: { label: 'Crítico', dot: 'bg-rose-500', text: 'text-rose-600' },
};

const diaryConf: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  riego: { label: 'Riego realizado', icon: <Droplets size={14} />, color: '#3B82F6' },
  fertilizacion: { label: 'Fertilización', icon: <FlaskConical size={14} />, color: '#10B981' },
  poda: { label: 'Poda', icon: <Scissors size={14} />, color: '#F97316' },
  observacion: { label: 'Observación', icon: <Eye size={14} />, color: '#8B5CF6' },
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtTime = (d?: string) =>
  d ? new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';

type Tab = 'resumen' | 'galeria' | 'historial' | 'qr';

const PlantDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { plants, diary, deletePlant } = useApp();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('resumen');
  const [showActions, setShowActions] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string[] | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const canPrint = hasAccess(user?.plan, 'elite') || true;
  const plant = useMemo(() => plants.find(p => p.id === Number(id)), [plants, id]);

  const plantDiary = useMemo(() =>
    plant ? diary.filter(e => e.planta_nombre === plant.nombre)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) : [],
    [diary, plant]);

  const images = useMemo(() => {
    if (!plant) return [];
    if (plant.images?.length) return plant.images.map(i => i.image_url);
    return plant.imagen ? [plant.imagen] : [];
  }, [plant]);

  if (!plant) {
    return (
      <div className="px-8 py-20 text-center">
        <div className="text-5xl mb-3">🥀</div>
        <h2 className="font-accent text-2xl font-bold text-brand-dark mb-2">Planta no encontrada</h2>
        <button onClick={() => navigate('/plants')} className="text-brand-primary font-bold underline text-sm">Volver a Plantas</button>
      </div>
    );
  }

  const m = estadoMeta[plant.estado] || estadoMeta.saludable;
  const lastAltura = plantDiary.find(e => e.altura != null)?.altura;
  const lastHojas = plantDiary.find(e => e.hojas != null)?.hojas;
  const lastRiego = plantDiary.find(e => e.tipo === 'riego')?.fecha;

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar "${plant.nombre}"? Esta acción no se puede deshacer.`)) {
      deletePlant(plant.id);
      navigate('/plants');
    }
  };

  const openLightbox = (idx: number) => { setLightbox(images); setLightboxIdx(idx); };

  const infoRows: [React.ReactNode, string, string][] = [
    [<User size={14} />, 'Nombre', plant.nombre],
    [<Leaf size={14} />, 'Especie', plant.especie],
    [<CalendarDays size={14} />, 'Fecha de adquisición', fmtDate(plant.fecha_adquisicion)],
    [<Sprout size={14} />, 'Origen', plant.origen || '—'],
    [<DollarSign size={14} />, 'Precio', plant.precio ? `$${plant.precio.toFixed(2)} USD` : '—'],
    [<MapPin size={14} />, 'Ubicación actual', plant.ubicacion || '—'],
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Barra superior */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/plants')}
          className="w-9 h-9 rounded-lg border border-app-border bg-app-card flex items-center justify-center text-brand-dark/60 hover:bg-app-bg transition-colors shrink-0">
          <ChevronLeft size={18} />
        </button>
        <AssetIcon name="icon-plants" size={26} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-accent text-[30px] font-bold text-brand-dark leading-none truncate">
            {plant.nombre} <Star size={18} className="text-[#C9A24B]/50 shrink-0" />
          </h1>
          <p className="text-[13px] italic text-brand-dark/50 mt-0.5">{plant.especie}</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowActions(v => !v)}
            className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-app-bg transition-colors">
            Acciones <ChevronDown size={13} className="text-brand-dark/40" />
          </button>
          {showActions && (
            <div className="absolute right-0 z-30 mt-2 w-52 bg-app-card border border-app-border rounded-xl shadow-lg p-1.5">
              <button onClick={() => navigate('/ai', { state: { initialImage: images[0], initialPrompt: `Analiza mi ${plant.nombre} (${plant.especie}). ¿Diagnóstico de salud o plagas?` } })}
                className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] font-medium text-brand-dark/70 hover:bg-app-bg"><ScanLine size={15} /> Escanear con CarniBot</button>
              <button onClick={() => setShowSheet(true)} className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] font-medium text-brand-dark/70 hover:bg-app-bg"><FileText size={15} /> Ficha técnica</button>
              <button onClick={handleDelete} className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg text-[13px] font-medium text-rose-600 hover:bg-rose-50"><Trash2 size={15} /> Eliminar planta</button>
            </div>
          )}
        </div>
        <button onClick={() => navigate('/add', { state: plant })}
          className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-5 py-2 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95">
          <Pencil size={15} /> Editar planta
        </button>
      </div>

      {/* Fila superior: héroe + info + historial */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Héroe */}
        <div className="xl:col-span-5">
          <div className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[4/3]">
            {images[heroIdx]
              ? <img src={images[heroIdx]} alt={plant.nombre} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><SpeciesIcon species={plant.especie} size={90} /></div>}
            <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 bg-app-card/90 backdrop-blur rounded-full px-3 py-1 text-[11px] font-semibold ${m.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> Planta {m.label.toLowerCase()}
            </span>
            {images.length > 0 && (
              <button onClick={() => openLightbox(heroIdx)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-app-card/90 backdrop-blur flex items-center justify-center text-brand-dark/60 hover:bg-app-card">
                <Maximize2 size={15} />
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${i === heroIdx ? 'border-[#C9A24B]' : 'border-app-border opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información general */}
        <div className="xl:col-span-4">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 h-full">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-4">
              <span className="text-[#C9A24B]"><FileText size={14} /></span> Información general
            </h3>
            <div className="space-y-3">
              {infoRows.map(([icon, k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2 text-brand-dark/45 shrink-0"><span className="text-[#C9A24B]/70">{icon}</span>{k}</span>
                  <span className="font-semibold text-brand-dark text-right truncate">{v}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex items-center gap-2 text-brand-dark/45 shrink-0"><span className="text-[#C9A24B]/70"><Leaf size={14} /></span>Estado de salud</span>
                <span className={`inline-flex items-center gap-1.5 font-semibold ${m.text}`}><span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}</span>
              </div>
            </div>
            {plant.notas && (
              <div className="mt-4 pt-4 border-t border-app-border">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-brand-dark/40 mb-1"><NotebookPen size={12} /> Notas</p>
                <p className="text-[12.5px] text-brand-dark/65 italic leading-relaxed">{plant.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial reciente */}
        <div className="xl:col-span-3">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary">
                <span className="text-[#C9A24B]"><NotebookPen size={14} /></span> Historial
              </h3>
              <button onClick={() => navigate('/diary')} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary">Ver todo</button>
            </div>
            <div className="relative pl-5 border-l border-app-border space-y-4">
              {plantDiary.length === 0 && <p className="text-[12px] text-brand-dark/35">Sin registros todavía</p>}
              {plantDiary.slice(0, 5).map(e => {
                const c = diaryConf[e.tipo] || diaryConf.observacion;
                return (
                  <div key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-0 w-6 h-6 rounded-full border-2 border-app-card flex items-center justify-center text-white" style={{ backgroundColor: c.color }}>
                      <span className="scale-75">{c.icon}</span>
                    </span>
                    <p className="text-[12.5px] font-bold text-brand-dark leading-tight">{c.label}</p>
                    {e.descripcion && <p className="text-[11.5px] text-brand-dark/55 leading-snug">{e.descripcion}</p>}
                    <p className="text-[10.5px] text-brand-dark/35 mt-0.5">{fmtDate(e.fecha)} {fmtTime(e.fecha) && `· ${fmtTime(e.fecha)}`}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-5">
        <div className="flex items-center gap-1 px-3 pt-3 border-b border-app-border overflow-x-auto">
          {([['resumen', 'Resumen', <Ruler size={14} />], ['galeria', 'Galería', <ImageIcon size={14} />], ['historial', 'Historial', <NotebookPen size={14} />], ['qr', 'Etiqueta QR', <QrCode size={14} />]] as [Tab, string, React.ReactNode][]).map(([t, label, icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-dark/45 hover:text-brand-dark/70'}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'resumen' && (
            <div className="space-y-5">
              <div>
                <p className="font-accent text-[18px] font-bold text-brand-dark mb-3">Resumen rápido</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <BigStat icon={<Ruler size={18} />} value={lastAltura != null ? `${lastAltura} cm` : '—'} label="Altura" sub="Último registro" />
                  <BigStat icon={<Leaf size={18} />} value={lastHojas != null ? `${lastHojas}` : '—'} label="Hojas / trampas" sub="Último registro" />
                  <BigStat icon={<NotebookPen size={18} />} value={`${plantDiary.length}`} label="Registros" sub="En el diario" />
                  <BigStat icon={<Droplets size={18} />} value={lastRiego ? fmtDate(lastRiego) : '—'} label="Último riego" sub={lastRiego ? `Hace ${Math.floor((Date.now() - new Date(lastRiego).getTime()) / 86400000)} días` : 'Sin registros'} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Care icon={<Sun size={16} />} title="Luz recomendada" value="Luz directa" sub="6 - 8 horas al día" />
                <Care icon={<Thermometer size={16} />} title="Temperatura ideal" value="18 °C - 30 °C" sub="Rango óptimo" />
                <Care icon={<Wind size={16} />} title="Humedad ideal" value="40 % - 70 %" sub="Humedad óptima" />
              </div>
              <p className="text-center font-accent italic text-brand-dark/45 text-[14px] pt-2">
                «Cada trampa cuenta una historia de adaptación y belleza natural.» — Sarracenia M.A.R
              </p>
            </div>
          )}

          {tab === 'galeria' && (
            images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <button key={i} onClick={() => openLightbox(i)} className="aspect-square rounded-xl overflow-hidden border border-app-border hover:opacity-90 transition-opacity">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button onClick={() => navigate('/add', { state: plant })}
                  className="aspect-square rounded-xl border border-dashed border-app-border flex flex-col items-center justify-center gap-1 text-brand-dark/40 hover:bg-app-bg transition-colors">
                  <Plus size={20} /> <span className="text-[11px] font-semibold">Añadir foto</span>
                </button>
              </div>
            ) : <p className="text-[13px] text-brand-dark/35 text-center py-8">Esta planta no tiene fotos todavía</p>
          )}

          {tab === 'historial' && (
            <div className="relative pl-5 border-l border-app-border space-y-4">
              {plantDiary.length === 0 && <p className="text-[13px] text-brand-dark/35">Sin registros todavía</p>}
              {plantDiary.map((e: DiaryEntry) => {
                const c = diaryConf[e.tipo] || diaryConf.observacion;
                return (
                  <div key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-0 w-6 h-6 rounded-full border-2 border-app-card flex items-center justify-center text-white" style={{ backgroundColor: c.color }}>
                      <span className="scale-75">{c.icon}</span>
                    </span>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-brand-dark">{c.label}</p>
                      <span className="text-[11px] text-brand-dark/40">{fmtDate(e.fecha)} {fmtTime(e.fecha)}</span>
                    </div>
                    {e.descripcion && <p className="text-[12.5px] text-brand-dark/60">{e.descripcion}</p>}
                    {(e.altura || e.hojas) && (
                      <div className="flex gap-2 mt-1">
                        {e.altura != null && <span className="text-[10.5px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/60">📏 {e.altura} cm</span>}
                        {e.hojas != null && <span className="text-[10.5px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/60">🍃 {e.hojas}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'qr' && (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-xl border border-app-border">
                <QRCodeSVG value={`carnilab:plant:${plant.id}`} size={140} bgColor="#ffffff" fgColor="#7A1E2C" />
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-2 text-[13px] font-black uppercase tracking-wider text-brand-primary mb-1">
                  <span className="text-[#C9A24B]"><QrCode size={15} /></span> Etiqueta con código QR
                </p>
                <p className="text-[12.5px] text-brand-dark/50 mb-4 max-w-md">Genera e imprime la etiqueta para identificar tu planta físicamente. El código enlaza a esta ficha.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-brand-primary text-white rounded-lg px-4 py-2 text-[13px] font-bold hover:brightness-110 transition-all"><QrCode size={15} /> Generar etiqueta</button>
                  <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-app-card border border-app-border rounded-lg px-4 py-2 text-[13px] font-bold text-brand-dark hover:bg-app-bg transition-colors"><Printer size={15} /> Imprimir</button>
                  <button onClick={() => setShowSheet(true)} className="flex items-center gap-2 bg-app-card border border-app-border rounded-lg px-4 py-2 text-[13px] font-bold text-brand-dark hover:bg-app-bg transition-colors"><Download size={15} /> Ficha técnica</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQR && <QRLabel plant={plant} onClose={() => setShowQR(false)} canPrint={canPrint} />}
      {showSheet && <TechnicalSheet plant={plant} diaryEntries={plantDiary} onClose={() => setShowSheet(false)} canPrint={canPrint} />}
      {lightbox && <ImageLightbox images={lightbox} initialIndex={lightboxIdx} onClose={() => setLightbox(null)} />}
    </div>
  );
};

const BigStat: React.FC<{ icon: React.ReactNode; value: string; label: string; sub: string }> = ({ icon, value, label, sub }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 text-center">
    <span className="text-[#C9A24B] flex justify-center mb-1">{icon}</span>
    <p className="text-[18px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[12px] font-semibold text-brand-dark/60 mt-1">{label}</p>
    <p className="text-[10px] text-brand-dark/40">{sub}</p>
  </div>
);

const Care: React.FC<{ icon: React.ReactNode; title: string; value: string; sub: string }> = ({ icon, title, value, sub }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 flex items-center gap-3">
    <span className="w-9 h-9 rounded-lg bg-[#C9A24B]/12 flex items-center justify-center text-[#C9A24B] shrink-0">{icon}</span>
    <div>
      <p className="text-[11px] text-brand-dark/45">{title}</p>
      <p className="text-[13.5px] font-bold text-brand-dark leading-tight">{value}</p>
      <p className="text-[10.5px] text-brand-dark/40">{sub}</p>
    </div>
  </div>
);

export default PlantDetails;
