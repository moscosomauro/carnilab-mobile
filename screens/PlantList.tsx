import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plant } from '../types';
import { AssetIcon } from '../components/AssetIcon';
import { QRLabel } from '../components/QRLabel';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search, Filter, ChevronDown, Download, Plus, Star, Ruler, Leaf,
  NotebookPen, CalendarDays, QrCode, Printer, ChevronLeft, ChevronRight,
  Droplets, FlaskConical, Scissors, Eye, ImagePlus, ExternalLink, Check
} from 'lucide-react';

const estadoMeta: Record<string, { label: string; dot: string; text: string }> = {
  saludable: { label: 'Saludable', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  regular: { label: 'Regular', dot: 'bg-amber-500', text: 'text-amber-600' },
  critico: { label: 'Crítico', dot: 'bg-rose-500', text: 'text-rose-600' },
};

const diaryIcon: Record<string, React.ReactNode> = {
  riego: <Droplets size={13} />,
  fertilizacion: <FlaskConical size={13} />,
  poda: <Scissors size={13} />,
  observacion: <Eye size={13} />,
};
const diaryLabel: Record<string, string> = {
  riego: 'Riego', fertilizacion: 'Fertilización', poda: 'Poda', observacion: 'Observación',
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const PlantList: React.FC = () => {
  const navigate = useNavigate();
  const { plants, diary } = useApp();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qrLabelPlant, setQrLabelPlant] = useState<Plant | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const plantasFiltradas = useMemo(() => {
    return plants.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = p.nombre.toLowerCase().includes(q) || p.especie.toLowerCase().includes(q);
      let matchesEstado = true;
      if (filterEstado === 'venta') matchesEstado = !!p.en_venta;
      else if (filterEstado !== 'todos') matchesEstado = p.estado === filterEstado;
      return matchesSearch && matchesEstado;
    });
  }, [plants, searchTerm, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(plantasFiltradas.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);
  const pageStart = (page - 1) * perPage;
  const pageItems = plantasFiltradas.slice(pageStart, pageStart + perPage);

  // Selección por defecto: primera planta visible
  useEffect(() => {
    if ((selectedId === null || !plants.some(p => p.id === selectedId)) && plants.length > 0) {
      setSelectedId(plants[0].id);
    }
  }, [plants, selectedId]);

  const selected = useMemo(() => plants.find(p => p.id === selectedId) || null, [plants, selectedId]);
  const selectedDiary = useMemo(() =>
    selected ? diary.filter(e => e.planta_nombre === selected.nombre)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) : [],
    [diary, selected]);

  const lastConAltura = selectedDiary.find(e => e.altura != null);
  const lastConHojas = selectedDiary.find(e => e.hojas != null);
  const diasDesde = selected?.fecha_adquisicion
    ? Math.max(0, Math.floor((Date.now() - new Date(selected.fecha_adquisicion).getTime()) / 86400000))
    : null;

  const selectedImages = useMemo(() => {
    if (!selected) return [];
    if (selected.images?.length) return selected.images.map(i => i.image_url);
    return selected.imagen ? [selected.imagen] : [];
  }, [selected]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('CarniLab - Mi Colección', 14, 15);
    autoTable(doc, {
      head: [['Nombre', 'Especie', 'Estado', 'Ubicación', 'Precio']],
      body: plantasFiltradas.map(p => [p.nombre, p.especie, estadoMeta[p.estado]?.label || p.estado, p.ubicacion || '', p.precio ? `$${p.precio}` : '']),
      startY: 20,
    });
    doc.save('carnilab-coleccion.pdf');
    setShowExport(false);
  };
  const exportCSV = () => {
    const headers = ['Nombre', 'Especie', 'Estado', 'Ubicación', 'Precio'];
    const rows = plantasFiltradas.map(p => [p.nombre, p.especie, p.estado, p.ubicacion || '', p.precio || 0]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'carnilab-coleccion.csv';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setShowExport(false);
  };

  const filterOptions = [
    { id: 'todos', label: 'Todas' },
    { id: 'saludable', label: 'Saludables' },
    { id: 'regular', label: 'Regulares' },
    { id: 'critico', label: 'Críticas' },
    { id: 'venta', label: 'En venta' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center">
          <AssetIcon name="icon-plants" size={26} />
        </div>
        <div>
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Gestión de plantas</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Administra tu colección de plantas carnívoras</p>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
          <input
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Buscar plantas..."
            className="w-full bg-app-card border border-app-border rounded-full pl-9 pr-4 py-2 text-[13px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {/* Filtros */}
        <div className="relative">
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-app-bg transition-colors">
            <Filter size={14} className="text-[#C9A24B]" /> Filtros <ChevronDown size={13} className="text-brand-dark/40" />
          </button>
          {showFilters && (
            <div className="absolute z-30 mt-2 w-48 bg-app-card border border-app-border rounded-xl shadow-lg p-1.5">
              {filterOptions.map(o => (
                <button key={o.id}
                  onClick={() => { setFilterEstado(o.id); setShowFilters(false); setPage(1); }}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${filterEstado === o.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-dark/70 hover:bg-app-bg'}`}>
                  {o.label} {filterEstado === o.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Exportar */}
        <div className="relative">
          <button onClick={() => setShowExport(v => !v)}
            className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-app-bg transition-colors">
            <Download size={14} className="text-brand-dark/50" /> Exportar
          </button>
          {showExport && (
            <div className="absolute right-0 z-30 mt-2 w-40 bg-app-card border border-app-border rounded-xl shadow-lg p-1.5">
              <button onClick={exportPDF} className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium text-brand-dark/70 hover:bg-app-bg">Exportar PDF</button>
              <button onClick={exportCSV} className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium text-brand-dark/70 hover:bg-app-bg">Exportar CSV</button>
            </div>
          )}
        </div>

        {/* Nueva planta */}
        <button onClick={() => navigate('/add')}
          className="flex items-center gap-2 bg-brand-primary text-white rounded-full px-5 py-2 text-[13px] font-bold shadow-md shadow-brand-primary/20 hover:brightness-110 transition-all active:scale-95">
          <Plus size={16} /> Nueva planta
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== Tabla ===== */}
        <div className="xl:col-span-8">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            <p className="px-5 pt-4 pb-2 text-[12px] font-bold text-brand-dark/45">
              Total: {plantasFiltradas.length} plantas
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-brand-dark/40 border-y border-app-border">
                    <th className="font-bold px-5 py-2.5">Planta</th>
                    <th className="font-bold px-3 py-2.5 hidden md:table-cell">Especie</th>
                    <th className="font-bold px-3 py-2.5 hidden lg:table-cell">Adquisición</th>
                    <th className="font-bold px-3 py-2.5 hidden xl:table-cell">Origen</th>
                    <th className="font-bold px-3 py-2.5 hidden sm:table-cell">Precio</th>
                    <th className="font-bold px-3 py-2.5">Estado</th>
                    <th className="font-bold px-3 py-2.5 hidden lg:table-cell">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {pageItems.map(p => {
                    const m = estadoMeta[p.estado] || estadoMeta.saludable;
                    const active = p.id === selectedId;
                    return (
                      <tr key={p.id} onClick={() => setSelectedId(p.id)}
                        className={`cursor-pointer transition-colors ${active ? 'bg-brand-primary/[0.06]' : 'hover:bg-app-bg/60'}`}>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {active && <span className="absolute left-0 w-1 h-7 rounded-r bg-[#C9A24B] -ml-5" />}
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                              {p.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" />
                                : <span className="text-[11px] font-black text-brand-dark/30">{p.nombre.charAt(0)}</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1 text-[13px] font-bold text-brand-dark truncate">
                                {p.nombre} <Star size={12} className="text-[#C9A24B]/40 shrink-0" />
                              </p>
                              <p className="text-[11px] italic text-brand-dark/45 truncate md:hidden">{p.especie}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell"><span className="text-[12px] italic text-brand-dark/55">{p.especie}</span></td>
                        <td className="px-3 py-2.5 hidden lg:table-cell"><span className="text-[12px] text-brand-dark/55">{fmtDate(p.fecha_adquisicion)}</span></td>
                        <td className="px-3 py-2.5 hidden xl:table-cell"><span className="text-[12px] text-brand-dark/55 truncate">{p.origen || '—'}</span></td>
                        <td className="px-3 py-2.5 hidden sm:table-cell"><span className="text-[12px] font-semibold text-brand-dark/70">{p.precio ? `$${p.precio.toFixed(2)}` : '—'}</span></td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${m.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell"><span className="text-[12px] text-brand-dark/55 truncate">{p.ubicacion || '—'}</span></td>
                      </tr>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-14 text-center text-[13px] text-brand-dark/35">No hay plantas que coincidan 🌿</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-app-border">
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 disabled:opacity-30 hover:bg-app-bg">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-[12px] font-bold flex items-center justify-center transition-colors ${page === i + 1 ? 'bg-brand-primary text-white' : 'text-brand-dark/55 hover:bg-app-bg'}`}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="w-7 h-7 rounded-lg border border-app-border flex items-center justify-center text-brand-dark/50 disabled:opacity-30 hover:bg-app-bg">
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="bg-app-card border border-app-border rounded-lg px-2 py-1 text-[12px] text-brand-dark/60 focus:outline-none">
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>
                <span className="text-[12px] text-brand-dark/45">
                  {plantasFiltradas.length === 0 ? '0' : `${pageStart + 1}-${Math.min(pageStart + perPage, plantasFiltradas.length)}`} de {plantasFiltradas.length}
                </span>
              </div>
            </div>
          </div>

          {/* Galería de la planta seleccionada */}
          {selected && (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] mt-5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary">
                  <AssetIcon name="icon-plants" size={14} /> Galería de {selected.nombre}
                </h3>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {selectedImages.map((src, i) => (
                  <div key={i} className="w-[84px] h-[84px] rounded-xl overflow-hidden border border-app-border shrink-0">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <button onClick={() => navigate('/add', { state: selected })}
                  className="w-[84px] h-[84px] rounded-xl border border-dashed border-app-border shrink-0 flex flex-col items-center justify-center gap-1 text-brand-dark/40 hover:bg-app-bg transition-colors">
                  <ImagePlus size={18} /> <span className="text-[10px] font-semibold">Añadir foto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== Panel de detalle ===== */}
        <div className="xl:col-span-4">
          {selected ? (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 xl:sticky xl:top-20">
              <div className="flex gap-4">
                <div className="w-[110px] h-[140px] rounded-2xl overflow-hidden bg-app-bg border border-app-border shrink-0">
                  {selected.imagen ? <img src={selected.imagen} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><SpeciesIcon species={selected.especie} size={40} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1.5 font-accent text-[24px] font-bold text-brand-dark leading-tight">
                    {selected.nombre} <Star size={16} className="text-[#C9A24B]/50 shrink-0" />
                  </h2>
                  <p className="text-[13px] italic text-brand-dark/50 mb-3">{selected.especie}</p>
                  <button onClick={() => navigate(`/plant/${selected.id}`)}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-brand-primary hover:underline">
                    Ver ficha completa <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              {/* Info general */}
              <div className="mt-5 space-y-2.5">
                {[
                  ['Adquisición', fmtDate(selected.fecha_adquisicion)],
                  ['Origen', selected.origen || '—'],
                  ['Precio', selected.precio ? `$${selected.precio.toFixed(2)} USD` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-[13px]">
                    <span className="text-brand-dark/45">{k}</span>
                    <span className="font-semibold text-brand-dark">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/45">Estado de salud</span>
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${estadoMeta[selected.estado].text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estadoMeta[selected.estado].dot}`} /> {estadoMeta[selected.estado].label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/45">Ubicación actual</span>
                  <span className="font-semibold text-brand-dark">{selected.ubicacion || '—'}</span>
                </div>
              </div>

              {selected.notas && (
                <div className="mt-4 pt-4 border-t border-app-border">
                  <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark/40 mb-1">Notas</p>
                  <p className="text-[12.5px] text-brand-dark/65 italic leading-relaxed">{selected.notas}</p>
                </div>
              )}

              {/* Estadísticas rápidas */}
              <div className="mt-4 pt-4 border-t border-app-border">
                <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3">
                  <span className="text-[#C9A24B]"><Ruler size={14} /></span> Estadísticas rápidas
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <Stat icon={<Ruler size={15} />} value={lastConAltura?.altura != null ? `${lastConAltura.altura}` : '—'} unit="cm" label="Altura" />
                  <Stat icon={<Leaf size={15} />} value={lastConHojas?.hojas != null ? `${lastConHojas.hojas}` : '—'} unit="" label="Hojas" />
                  <Stat icon={<NotebookPen size={15} />} value={`${selectedDiary.length}`} unit="" label="Registros" />
                  <Stat icon={<CalendarDays size={15} />} value={diasDesde != null ? `${diasDesde}` : '—'} unit="d" label="Antigüedad" />
                </div>
              </div>

              {/* Historial reciente */}
              <div className="mt-4 pt-4 border-t border-app-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary">
                    <span className="text-[#C9A24B]"><NotebookPen size={14} /></span> Historial reciente
                  </p>
                  <button onClick={() => navigate('/diary')} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary">Ver todo</button>
                </div>
                <div className="space-y-2">
                  {selectedDiary.length === 0 && <p className="text-[12px] text-brand-dark/35">Sin registros todavía</p>}
                  {selectedDiary.slice(0, 3).map(e => (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-app-bg flex items-center justify-center text-brand-secondary shrink-0">{diaryIcon[e.tipo]}</span>
                      <span className="text-[11px] text-brand-dark/45 w-16 shrink-0">{fmtDate(e.fecha)}</span>
                      <span className="text-[12px] font-semibold text-brand-dark w-20 shrink-0">{diaryLabel[e.tipo]}</span>
                      <span className="text-[12px] text-brand-dark/55 truncate">{e.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Etiqueta QR */}
              <div className="mt-4 pt-4 border-t border-app-border">
                <div className="rounded-xl border border-app-border bg-app-bg/50 p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-1">
                      <span className="text-[#C9A24B]"><QrCode size={14} /></span> Etiqueta con código QR
                    </p>
                    <p className="text-[11.5px] text-brand-dark/50 mb-3">Genera e imprime la etiqueta para identificar tu planta.</p>
                    <button onClick={() => setQrLabelPlant(selected)}
                      className="flex items-center gap-2 bg-app-card border border-app-border rounded-lg px-3 py-2 text-[12px] font-bold text-brand-dark hover:bg-app-bg transition-colors">
                      <Printer size={14} /> Generar / Imprimir etiqueta
                    </button>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-app-border shrink-0">
                    <QRCodeSVG value={`carnilab:plant:${selected.id}`} size={72} bgColor="#ffffff" fgColor="#7A1E2C" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-10 text-center text-[13px] text-brand-dark/35">
              Selecciona una planta para ver sus detalles
            </div>
          )}
        </div>
      </div>

      {qrLabelPlant && (
        <QRLabel plant={qrLabelPlant} onClose={() => setQrLabelPlant(null)} canPrint={true} />
      )}
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: string; unit: string; label: string }> = ({ icon, value, unit, label }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-2 text-center">
    <span className="text-[#C9A24B] flex justify-center mb-0.5">{icon}</span>
    <p className="text-[14px] font-black text-brand-dark leading-none">{value}<span className="text-[9px] font-semibold text-brand-dark/40 ml-0.5">{unit}</span></p>
    <p className="text-[9px] text-brand-dark/45 mt-0.5">{label}</p>
  </div>
);

export default PlantList;
