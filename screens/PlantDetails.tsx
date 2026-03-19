import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/planHelpers';
import { DiaryEntry } from '../types';
import { ImageCarousel } from '../components/ImageCarousel';
import { TechnicalSheet } from '../components/TechnicalSheet';
import ImageLightbox from '../components/ImageLightbox';
import PhotoTimeLapse from '../components/PhotoTimeLapse';

// --- CUSTOM SVG ICONS (Organic Minimalist) ---

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconQR = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconScan = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconLeaf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 22s14-1.5 18-5.5a11 11 0 0 0-16-16C4 18 2 22 2 22z" />
    <line x1="2" y1="22" x2="12" y2="12" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconLocation = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// --- DIARY ICONS (Copied from Diary.tsx for consistency) ---
const IconWater = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.5 12.33 400 400 0 0 1 12 2.69z" /></svg>
);
const IconEco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a9 9 0 0 1 9 9" /><path d="M4 4a9 9 0 0 0 9 9" /><path d="M4 4v10" /></svg>
);
const IconCut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

const typeConfig: Record<string, { label: string, color: string, bg: string, icon: React.FC }> = {
  riego: { label: 'Riego', color: '#3B82F6', bg: '#EFF6FF', icon: IconWater },
  fertilizacion: { label: 'Fertilización', color: '#10B981', bg: '#ECFDF5', icon: IconEco },
  poda: { label: 'Poda', color: '#F97316', bg: '#FFF7ED', icon: IconCut },
  observacion: { label: 'Observación', color: '#8B5CF6', bg: '#F5F3FF', icon: IconEye },
};


const PlantDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { plants, diary } = useApp();
  const { user } = useAuth();

  const [showQR, setShowQR] = useState(false);
  const [showTimeLapse, setShowTimeLapse] = useState(false);
  const canGenQR = hasAccess(user?.plan, 'elite');

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
  };

  const closeLightbox = () => {
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const plant = useMemo(() => plants.find(p => p.id === Number(id)), [plants, id]);

  const plantDiary = useMemo(() => {
    if (!plant) return [];
    return diary.filter(e => e.planta_nombre === plant.nombre)
      .sort((a: DiaryEntry, b: DiaryEntry) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [diary, plant]);

  // Fotos para Time-Lapse (ordenadas cronologicamente)
  const timeLapsePhotos = useMemo(() => {
    if (!plant) return [];

    // Obtener todas las entradas con fotos, ordenadas por fecha ascendente
    const entriesWithPhotos = diary
      .filter(e => e.planta_nombre === plant.nombre && (e.imagen || e.imagenes?.length))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (entriesWithPhotos.length === 0) return [];

    // Fecha de la primera foto para calcular dias
    const firstDate = new Date(entriesWithPhotos[0].fecha);

    // Extraer todas las fotos con sus fechas
    const photos: { url: string; date: string; dayNumber: number }[] = [];

    entriesWithPhotos.forEach(entry => {
      const entryDate = new Date(entry.fecha);
      const dayNumber = Math.floor((entryDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Agregar fotos del array imagenes
      if (entry.imagenes?.length) {
        entry.imagenes.forEach(url => {
          photos.push({ url, date: entry.fecha, dayNumber });
        });
      } else if (entry.imagen) {
        // Fallback a imagen unica
        photos.push({ url: entry.imagen, date: entry.fecha, dayNumber });
      }
    });

    return photos;
  }, [diary, plant]);

  if (!plant) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🥀</div>
        <h2 className="text-2xl font-black text-[#2E2E2E] dark:text-white mb-2">Planta no encontrada</h2>
        <button onClick={() => navigate(-1)} className="text-[#4A5D4F] dark:text-slate-400 font-bold underline">Volver al inicio</button>
      </div>
    );
  }

  const estadoStyles: Record<string, { bg: string, text: string }> = {
    saludable: { bg: 'bg-[#CDE8B5]', text: 'text-[#4A5D4F]' },
    regular: { bg: 'bg-[#F2E8D5]', text: 'text-[#8E7C4B]' },
    critico: { bg: 'bg-[#F2D5D5]', text: 'text-[#A33D3D]' }
  };

  const currentStyles = estadoStyles[plant.estado] || estadoStyles.saludable;

  // ✅ PREPARAR ARRAY DE IMÁGENES PARA EL CARRUSEL
  const plantImages = useMemo(() => {
    // Si la planta tiene array de imágenes, usarlo
    if (plant.images && Array.isArray(plant.images) && plant.images.length > 0) {
      return plant.images.map(img => img.image_url);
    }
    // Si solo tiene imagen principal, usar esa
    if (plant.imagen) {
      return [plant.imagen];
    }
    // Fallback a imagen por defecto
    return ['https://images.unsplash.com/photo-1596238681789-29437f8623b3?w=800'];
  }, [plant]);

  return (
    <div className="min-h-screen bg-[#F5F1EB] dark:bg-slate-900 selection:bg-[#6B8E23]/10 font-display flex flex-col items-center lg:bg-transparent">
      {/* Paper texture overlay */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none z-50 lg:hidden dark:hidden"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}
      />

      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:max-w-6xl lg:w-full lg:pt-10 lg:px-6">

        {/* Hero Section con Carrusel */}
        <div className="relative w-full max-w-[390px] lg:max-w-none h-[400px] lg:h-[600px] overflow-hidden lg:rounded-[40px] lg:shadow-2xl">
          {/* ✅ CARRUSEL DE IMÁGENES */}
          <ImageCarousel
            images={plantImages}
            alt={plant.nombre}
            className="h-full"
          />
          {/* Gradients */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F5F1EB] dark:from-slate-900 via-[#F5F1EB]/10 dark:via-slate-900/10 to-transparent pointer-events-none z-10" />

          {/* Floating Header */}
          <div className="absolute top-10 left-0 right-0 px-6 flex items-center justify-between z-20">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-white/20"
            >
              <IconBack />
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/ai', {
                  state: {
                    initialImage: plantImages[0],
                    initialPrompt: `Por favor, analiza la imagen de mi ${plant.nombre} (${plant.especie}). ¿Puedes darme un diagnóstico sobre su salud o si detectas plagas?`
                  }
                })}
                className="w-10 h-10 bg-violet-600/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-violet-400/30"
                title="Escanear con CarniBot"
              >
                <IconScan />
              </button>

              <button
                onClick={() => setShowQR(true)}
                className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-white/20"
                title="Generar Ficha/QR"
              >
                <IconQR />
              </button>
              <button
                onClick={() => navigate('/add', { state: plant })}
                className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-white/20"
              >
                <IconEdit />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="relative -mt-16 lg:mt-0 z-20 w-full max-w-[390px] lg:max-w-none px-6 lg:px-0 pb-32 lg:pb-10">
          {/* Brand Title Card */}
          <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white dark:border-slate-700 mb-6">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-black text-[#2E2E2E] dark:text-white leading-tight flex-1 truncate">{plant.nombre}</h1>
              <div className={`px-4 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-sm mt-1.5 ${currentStyles.bg} ${currentStyles.text}`}>
                <span>{plant.estado.toUpperCase()}</span>
                <IconLeaf />
              </div>
            </div>
            <p className="text-lg font-bold text-[#8E877F] dark:text-slate-400 italic opacity-80 mb-6">{plant.especie}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F5F1EB]/60 dark:bg-slate-900/60 rounded-3xl p-4 border border-white dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconLocation />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#8E877F] dark:text-slate-400">Ubicación</span>
                </div>
                <p className="font-black text-[#4A5D4F] dark:text-slate-300 text-[14px] truncate">{plant.ubicacion}</p>
              </div>
              <div className="bg-[#F5F1EB]/60 dark:bg-slate-900/60 rounded-3xl p-4 border border-white dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <IconCalendar />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#8E877F] dark:text-slate-400">Desde</span>
                </div>
                <p className="font-black text-[#4A5D4F] dark:text-slate-300 text-[14px]">{plant.fecha_adquisicion ? new Date(plant.fecha_adquisicion).toLocaleDateString() : 'No especificado'}</p>
              </div>
            </div>
          </div>

          {/* Extra Info / Notes */}
          {plant.notas && (
            <div className="bg-white/40 dark:bg-slate-800/40 rounded-[32px] p-6 mb-6 border border-white dark:border-slate-700">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-[#8E877F] dark:text-slate-400 mb-3">Notas de Cultivo</h3>
              <p className="text-[14px] font-bold text-[#4A5D4F] dark:text-slate-300 leading-relaxed italic">"{plant.notas}"</p>
            </div>
          )}

          {/* Timeline Section */}
          <div className="mb-6 pl-2">
            <div className="flex justify-between items-center mb-6 pr-2">
              <h3 className="text-[12px] uppercase font-black tracking-widest text-[#2E2E2E] dark:text-white">Línea de Vida</h3>
              <div className="flex items-center gap-3">
                {timeLapsePhotos.length >= 2 && (
                  <button
                    onClick={() => setShowTimeLapse(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] font-bold rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <span>▶</span>
                    <span>Time-Lapse</span>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{timeLapsePhotos.length}</span>
                  </button>
                )}
                <span className="text-[10px] font-bold text-[#8E877F] dark:text-slate-400 italic">{plantDiary.length} registros</span>
              </div>
            </div>

            <div className="space-y-0 pl-4 border-l-2 border-[#E5E7EB] dark:border-slate-700 ml-2">
              {plantDiary.length > 0 ? (
                // SHOW ALL ENTRIES - No slice()
                plantDiary.map((entry: DiaryEntry) => {
                  const Conf = typeConfig[entry.tipo];
                  const IconComp = Conf?.icon || IconEye;
                  return (
                    <div key={entry.id} className="relative mb-6 pl-6">
                      {/* Timeline Node */}
                      <div className="absolute -left-[29px] top-1 w-8 h-8 rounded-full border-4 border-[#F5F1EB] dark:border-slate-900 flex items-center justify-center text-white shadow-sm z-10" style={{ backgroundColor: Conf?.color || '#8E877F' }}>
                        <div className="transform scale-75"><IconComp /></div>
                      </div>

                      {/* Card */}
                      <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 border border-white dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: Conf?.color }}>{Conf?.label}</span>
                          <span className="text-[10px] font-medium text-[#8E877F] dark:text-slate-400 opacity-60">{new Date(entry.fecha).toLocaleDateString()}</span>
                        </div>

                        {entry.descripcion && (
                          <p className="text-[13px] font-medium text-[#4A5D4F] dark:text-slate-300 leading-tight mb-2">{entry.descripcion}</p>
                        )}

                        {/* Compact Metrics */}
                        {(entry.altura || entry.hojas) && (
                          <div className="flex gap-2 mb-2 opacity-80">
                            {entry.altura && <span className="text-[10px] font-bold text-[#4A5D4F] dark:text-slate-300 bg-[#F5F5F5] dark:bg-slate-700 px-2 py-0.5 rounded">📏 {entry.altura}cm</span>}
                            {entry.hojas && <span className="text-[10px] font-bold text-[#4A5D4F] dark:text-slate-300 bg-[#F5F5F5] dark:bg-slate-700 px-2 py-0.5 rounded">🍃 {entry.hojas}h</span>}
                          </div>
                        )}

                        {/* Thumbnail Images - Click para lightbox */}
                        {(entry.imagenes?.length || entry.imagen) && (() => {
                          const allImages = entry.imagenes?.length ? entry.imagenes : (entry.imagen ? [entry.imagen] : []);
                          return (
                            <div
                              className="absolute right-4 top-4 flex gap-1 cursor-pointer"
                              onClick={() => openLightbox(allImages, 0)}
                            >
                              {allImages.length > 1 ? (
                                <>
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-600 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
                                    <img src={allImages[0]} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center text-white text-xs font-bold hover:bg-black/70 transition-colors">
                                    +{allImages.length - 1}
                                  </div>
                                </>
                              ) : (
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-slate-600 shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                                  <img src={allImages[0]} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white/40 dark:bg-slate-800/40 rounded-[28px] p-8 text-center border border-white dark:border-slate-700 border-dashed ml-4">
                  <p className="text-[13px] font-bold text-[#8E877F] dark:text-slate-400">No hay registros en el diario todavía</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-10 left-0 right-0 flex justify-center px-6 z-40 max-w-[390px] mx-auto lg:hidden">
          <button
            onClick={() => navigate('/diary')} // Changed to go to Diary List, user can filter there or add new. Or maybe open modal with context.
            // Better: navigate to add with context
            // But wait, the previous code had /diary/add which doesnt exist in routes?
            // The routes are: /dashboard, /add, /plants, /plant/:id, /diary
            // Diary screen handles adding events via modal.
            // So best action is to go to Diary with this plant pre-selected?
            // Ideally we would pass state to Diary screen to open modal.
            // For now, let's keep it simple: Go to Diary. Authenticity of the "Add Event" button might require refactor of Diary Screen to accept initial state.
            // Let's check App.tsx routes...
            // Route /diary is DiaryScreen.
            // DiaryScreen has state [selectedPlantId]. 
            // If we navigate to /diary, we can't easily trigger the modal without complex state passing via location.state.
            // Simple fix: Navigate to /diary and user clicks add. OR duplicate the add modal here? No, duplicate code is bad.
            // Let's just navigate to Diary for now.
            className="w-full h-14 bg-[#FF7A59] text-white font-black rounded-full shadow-2xl shadow-[#FF7A59]/40 flex items-center justify-center gap-3 active:scale-95 transition-all text-[15px] tracking-wide"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl leading-none -mt-0.5">📁</span>
            </div>
            VER DIARIO COMPLETO
          </button>
        </div>

        {/* Technical Sheet Modal */}
        {showQR && (
          <TechnicalSheet
            plant={plant}
            diaryEntries={plantDiary}
            onClose={() => setShowQR(false)}
            canPrint={canGenQR}
          />
        )}

        {/* Image Lightbox */}
        {lightboxImages.length > 0 && (
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={closeLightbox}
          />
        )}

        {/* Time-Lapse Modal */}
        {showTimeLapse && timeLapsePhotos.length >= 2 && (
          <PhotoTimeLapse
            photos={timeLapsePhotos}
            plantName={plant.nombre}
            onClose={() => setShowTimeLapse(false)}
          />
        )}

      </div>
    </div>
  );
};

export default PlantDetails;
