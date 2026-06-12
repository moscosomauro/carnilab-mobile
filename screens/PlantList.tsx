
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/planHelpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plant } from '../types';
import { TechnicalSheet } from '../components/TechnicalSheet';
import { QRLabel } from '../components/QRLabel';
import { SpeciesIcon } from '../components/SpeciesIcon';

// Asset Icon Helper (Consistent with Dashboard)
const AssetIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => (
  <img
    src={`/assets/icons/${name}.png`}
    alt={name}
    style={{ width: size, height: size }}
    className={`object-contain ${className}`}
    onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
  />
);

// --- CUSTOM SVG ICONS (Organic Minimalist) ---

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconQR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);



const PlantList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plants, deletePlant, diary } = useApp();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [qrPlant, setQrPlant] = useState<Plant | null>(null);
  const [showQROptions, setShowQROptions] = useState<Plant | null>(null);
  const [qrLabelPlant, setQrLabelPlant] = useState<Plant | null>(null);

  const canExport = hasAccess(user?.plan, 'elite');
  const canGenQR = hasAccess(user?.plan, 'elite');



  const cardColors: Record<string, string> = {
    saludable: 'bg-[#DCEDC8] dark:bg-[#1A2E1F] border-[#C5E1A5] dark:border-[#2D4A33]', // Distinctive Lime / Dark Green
    regular: 'bg-[#FFF9C4] dark:bg-[#33301B] border-[#FFF59D] dark:border-[#4A4725]',   // Distinctive Yellow / Dark Yellow
    critico: 'bg-[#FFCDD2] dark:bg-[#331B1B] border-[#EF9A9A] dark:border-[#4A2525]',   // Distinctive Red / Dark Red
  };

  const plantasFiltradas = useMemo(() => {
    return plants.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.especie.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesEstado = true;
      if (filterEstado === 'todos') matchesEstado = true;
      else if (filterEstado === 'venta') matchesEstado = !!p.en_venta;
      else matchesEstado = p.estado === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [plants, searchTerm, filterEstado]);

  const qrPlantDiary = useMemo(() => {
    if (!qrPlant) return [];
    return diary.filter(e => e.planta_nombre === qrPlant.nombre);
  }, [diary, qrPlant]);

  const handleDelete = (id: number) => {
    if (window.confirm(t('plantList.detail.confirmDelete'))) {
      deletePlant(id);
      setSelectedPlant(null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('CarniLab - Mi Colección', 14, 15);
    const data = plantasFiltradas.map(p => [p.nombre, p.especie, p.estado, p.ubicacion || '', p.en_venta ? 'Sí' : 'No']);
    autoTable(doc, {
      head: [['Nombre', 'Especie', 'Estado', 'Ubicación', 'Venta']],
      body: data,
      startY: 20,
    });
    doc.save('carnilab-coleccion.pdf');
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Especie', 'Estado', 'Ubicación', 'En Venta', 'Precio'];
    const rows = plantasFiltradas.map(p => [
      p.nombre, p.especie, p.estado, p.ubicacion, p.en_venta ? 'Sí' : 'No', p.precio_venta || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," +
      [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carnilab-coleccion.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (plant: Plant) => {
    navigate('/add', { state: plant });
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex justify-center selection:bg-[#6B8E23]/10 font-display lg:bg-transparent">
      {/* Paper texture */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}
      />

      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-10 pb-32 lg:pb-10 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="text-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-[22px] font-bold text-[#2E2E2E] dark:text-white leading-tight tracking-tight">{t('plantList.title')}</h1>
            <p className="text-[11px] text-[#8E877F] dark:text-slate-400 font-semibold tracking-wider opacity-80 uppercase italic">{t('plantList.collectionCount', { count: plantasFiltradas.length })}</p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Desktop Add Button */}
            <button
              onClick={() => navigate('/add')}
              className="hidden lg:flex h-10 bg-[#FF7A59] text-white px-6 rounded-full items-center gap-2 font-black text-xs hover:bg-[#FF7A59]/90 transition-colors shadow-sm"
            >
              <span>+</span> {t('plantList.addPlant')}
            </button>
            {canExport && (
              <div className="flex gap-1">
                <button onClick={exportPDF} title="PDF" className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform hover:bg-[#F2FBFF]">
                  <AssetIcon name="icon-pdf" size={24} />
                </button>
                <button onClick={exportCSV} title="CSV" className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center active:scale-90 transition-transform hover:bg-[#F2FBFF]">
                  <AssetIcon name="icon-plants" size={20} className="opacity-60" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full mt-6 relative mb-6">
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <IconSearch />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('plantList.searchPlaceholder')}
            className="w-full h-12 rounded-full bg-[#EFEBE4] dark:bg-slate-800 border border-white dark:border-slate-700 px-12 text-[14px] font-bold text-[#2E2E2E] dark:text-white shadow-sm outline-none placeholder-[#8E877F]/60 dark:placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="w-[100vw] max-w-[390px] px-6 -mx-6 mb-6 overflow-x-auto no-scrollbar flex gap-2">
          {['todos', 'venta', 'saludable', 'regular', 'critico'].map(estado => (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`px-5 py-2.5 rounded-full text-[12px] font-black transition-all whitespace-nowrap shadow-sm border ${filterEstado === estado
                ? 'bg-[#A5A98F] dark:bg-[#6B8E23] text-white border-[#8D9178] dark:border-[#557218] scale-95'
                : 'bg-white/60 dark:bg-slate-800/60 text-[#4A5D4F] dark:text-slate-300 border-white/80 dark:border-slate-700/80'
                }`}
            >
              {estado === 'todos' ? t('plantList.filters.all') :
                estado === 'venta' ? t('plantList.filters.forSale') :
                  estado === 'saludable' ? t('plantList.filters.healthy') :
                    estado === 'regular' ? t('plantList.filters.regular') :
                      estado === 'critico' ? t('plantList.filters.critical') :
                        estado.charAt(0).toUpperCase() + estado.slice(1)}
            </button>
          ))}
        </div>

        {/* Plant List */}
        <div className="w-full space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {plantasFiltradas.map(planta => (
            <div
              key={planta.id}
              onClick={() => setSelectedPlant(planta)}
              className={`rounded-[28px] p-2 pr-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer ${cardColors[planta.estado] || cardColors.saludable}`}
            >
              {/* Image with QR overlay */}
              <div className="w-[100px] h-[100px] bg-white/40 rounded-[22px] overflow-hidden relative flex-shrink-0">
                <img
                  src={planta.imagen || 'https://images.unsplash.com/photo-1596238681789-29437f8623b3?w=400'}
                  alt={planta.nombre}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setShowQROptions(planta); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-[#2E2E2E] shadow-sm active:scale-90 transition-transform"
                >
                  <IconQR />
                </button>
              </div>

              {/* Info Area */}
              <div className="flex-1 py-1 flex flex-col justify-between min-h-[90px] min-w-0">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-[#2E2E2E] dark:text-white text-[16px] leading-tight truncate pr-2">{planta.nombre}</h3>
                    <SpeciesIcon species={planta.especie} size={24} className="opacity-80" />
                  </div>
                  <p className="text-[12px] font-bold text-[#8E877F] dark:text-slate-400 italic truncate opacity-80">{planta.especie}</p>
                </div>

                <div className="space-y-1 pb-1">
                  <div className="flex items-center gap-1.5 text-[#8E877F]">
                    <IconCalendar />
                    <span className="text-[10px] font-bold">{planta.fecha_adquisicion ? new Date(planta.fecha_adquisicion).toLocaleDateString() : 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#8E877F]">
                    <IconLocation />
                    <span className="text-[10px] font-bold truncate max-w-[120px]">{planta.ubicacion || 'Sin ubicación'}</span>
                  </div>
                </div>
              </div>

              {/* Price Tag only if for sale (Status badge removed) */}
              {planta.en_venta && (
                <div className="absolute top-2 right-2">
                  <div className="text-[10px] font-black text-[#FF7A59] bg-white/80 backdrop-blur-sm border border-[#FF7A59]/20 px-2 py-1 rounded-full shadow-sm">
                    $ {planta.precio_venta}
                  </div>
                </div>
              )}
            </div>
          ))}

          {plantasFiltradas.length === 0 && (
            <div className="py-20 text-center opacity-40 flex flex-col items-center">
              <div className="text-[40px] mb-2">🌿</div>
              <p className="text-sm font-bold text-[#4A5D4F]">{t('plantList.noPlants')}</p>
            </div>
          )}
        </div>

        {/* Detail Modal (Simplified Overlay for Premium Look) */}
        {selectedPlant && (
          <div className="fixed inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-[100] p-6 flex items-center justify-center animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-[342px] bg-[#F5F1EB] dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-2xl border border-white dark:border-slate-700">
              <div className="relative h-64">
                <img src={selectedPlant.imagen || ''} className="w-full h-full object-cover" alt="Detail" />
                <button onClick={() => setSelectedPlant(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/20 backdrop-blur-lg rounded-full flex items-center justify-center text-white">
                  ✕
                </button>
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-black text-[#2E2E2E] dark:text-white mb-1">{selectedPlant.nombre}</h2>
                <p className="text-lg italic text-[#8E877F] dark:text-slate-400 font-bold mb-6">{selectedPlant.especie}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button onClick={() => handleEdit(selectedPlant)} className="h-12 bg-white text-[#2E2E2E] font-black rounded-2xl shadow-sm active:scale-95 transition-all">{t('plantList.detail.edit')}</button>
                  <button onClick={() => handleDelete(selectedPlant.id)} className="h-12 bg-[#FF7A59]/10 text-[#FF7A59] font-black rounded-2xl active:scale-95 transition-all">{t('plantList.detail.delete')}</button>
                </div>
                <button onClick={() => setSelectedPlant(null)} className="w-full h-14 bg-[#4A5D4F] text-white font-black rounded-full shadow-lg active:scale-95 transition-all">{t('plantList.detail.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* QR Options Selector */}
        {showQROptions && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setShowQROptions(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm p-6 animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#2E2E2E] dark:text-white mb-2">
                {t('plantList.qrOptions.title')}
              </h3>
              <p className="text-sm font-bold text-[#8E877F] dark:text-slate-400 mb-6">
                {showQROptions.nombre}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setQrLabelPlant(showQROptions);
                    setShowQROptions(null);
                  }}
                  className="w-full h-16 bg-gradient-to-r from-[#4A5D4F] to-[#6B8E23] text-white rounded-2xl font-black flex items-center justify-between px-6 active:scale-95 transition-all shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏷️</span>
                    <div className="text-left">
                      <div className="text-sm">{t('plantList.qrOptions.labelQR')}</div>
                      <div className="text-[10px] font-medium opacity-80">{t('plantList.qrOptions.labelDesc')}</div>
                    </div>
                  </div>
                  <span className="text-xl">→</span>
                </button>

                <button
                  onClick={() => {
                    setQrPlant(showQROptions);
                    setShowQROptions(null);
                  }}
                  className="w-full h-16 bg-white dark:bg-slate-700 border-2 border-[#4A5D4F] dark:border-slate-600 text-[#4A5D4F] dark:text-white rounded-2xl font-black flex items-center justify-between px-6 active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <div className="text-sm">{t('plantList.qrOptions.sheet')}</div>
                      <div className="text-[10px] font-medium opacity-60">{t('plantList.qrOptions.sheetDesc')}</div>
                    </div>
                  </div>
                  <span className="text-xl">→</span>
                </button>
              </div>

              <button
                onClick={() => setShowQROptions(null)}
                className="w-full mt-4 h-12 bg-gray-100 text-gray-700 rounded-2xl font-bold active:scale-95 transition-all"
              >
                {t('plantList.qrOptions.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* QR Label Modal */}
        {qrLabelPlant && (
          <QRLabel
            plant={qrLabelPlant}
            onClose={() => setQrLabelPlant(null)}
            canPrint={canGenQR}
          />
        )}

        {/* Technical Sheet Modal */}
        {qrPlant && (
          <TechnicalSheet
            plant={qrPlant}
            diaryEntries={qrPlantDiary}
            onClose={() => setQrPlant(null)}
            canPrint={canGenQR}
          />
        )}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-[#F5F1EB] dark:border-slate-800/80 flex justify-around items-center px-10 z-50 lg:hidden">
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all">
            <AssetIcon name="icon-home" size={24} className="opacity-40" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Home</span>
          </button>
          <button onClick={() => navigate('/diary')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all">
            <AssetIcon name="icon-diary" size={24} className="opacity-40" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Diario</span>
          </button>
          <button onClick={() => navigate('/plants')} className="flex flex-col items-center gap-1.5 text-[#4A5D4F] active:scale-95 transition-all relative">
            <div className="absolute -top-12 w-1.5 h-1.5 rounded-full bg-[#4A5D4F]" />
            <AssetIcon name="icon-plants" size={24} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Plantas</span>
          </button>
          <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-all">
            <AssetIcon name="icon-profile" size={24} className="opacity-40" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E877F]">Perfil</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PlantList;
