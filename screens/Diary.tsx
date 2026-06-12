import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { compressImage, uploadImage } from '../utils/imageHelpers';
import { DiaryEntry } from '../types';
import { DiaryEntrySchema, validateData } from '../utils/validationSchemas';
import { useDebouncedValue } from '../utils/hooks';
import { groupEntriesByPlant } from '../utils/diaryHelpers';
import PlantJournalCard from '../components/diary/PlantJournalCard';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { AssetIcon } from '../components/AssetIcon';
import ImageLightbox from '../components/ImageLightbox';

// --- CUSTOM SVG ICONS (Organic Minimalist) ---
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconAdd = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

const IconList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

const IconJournal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);

const IconWater = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.5 12.33 400 400 0 0 1 12 2.69z" /></svg>
);
const IconEco = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a9 9 0 0 1 9 9" /><path d="M4 4a9 9 0 0 0 9 9" /><path d="M4 4v10" /></svg>
);
const IconCut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
);

const typeConfig: Record<string, { label: string, color: string, bg: string, icon: React.FC }> = {
  riego: { label: 'Riego', color: '#3B82F6', bg: '#EFF6FF', icon: IconWater },
  fertilizacion: { label: 'Fertilización', color: '#10B981', bg: '#ECFDF5', icon: IconEco },
  poda: { label: 'Poda', color: '#F97316', bg: '#FFF7ED', icon: IconCut },
  observacion: { label: 'Observación', color: '#8B5CF6', bg: '#F5F3FF', icon: IconEye },
};

// --- CHART COMPONENT ---
const GrowthChart: React.FC<{ data: DiaryEntry[] }> = ({ data }) => {
  const sorted = [...data].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const heightPoints = sorted.filter(e => e.altura).map(e => e.altura || 0);

  if (heightPoints.length < 2) return null;

  const max = Math.max(...heightPoints);
  const min = Math.min(...heightPoints);
  const range = max - min || 1;

  // Simple normalization for SVG polyline
  const points = heightPoints.map((h, i) => {
    const x = (i / (heightPoints.length - 1)) * 300; // Width 300
    const y = 100 - ((h - min) / range) * 80; // Height 100, padding 20
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 shadow-sm border border-white dark:border-slate-700">
      <h3 className="text-[12px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider mb-2">Tendencia de Crecimiento (cm)</h3>
      <div className="h-24 w-full relative">
        <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
          <polyline fill="none" stroke="#4A5D4F" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {points.split(' ').map((p, i) => {
            const [cx, cy] = p.split(',');
            return <circle key={i} cx={cx} cy={cy} r="4" fill="white" stroke="#4A5D4F" strokeWidth="2" />
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-[#8E877F] dark:text-slate-400 mt-1 font-bold">
        <span>Inicio: {heightPoints[0]}cm</span>
        <span>Actual: {heightPoints[heightPoints.length - 1]}cm</span>
      </div>
    </div>
  )
}


const DiaryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { diary, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry, plants } = useApp();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'journal' | 'list' | 'calendar'>('journal');
  const [filterType, setFilterType] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300); // ✅ Debounce de 300ms
  const [selectedPlantFilter, setSelectedPlantFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Lightbox State
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

  // Form State
  const [batchPlantIds, setBatchPlantIds] = useState<string[]>([]); // New Batch Selection
  const [entryType, setEntryType] = useState<'riego' | 'fertilizacion' | 'poda' | 'observacion'>('observacion');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDesc, setEntryDesc] = useState('');
  const [entryAltura, setEntryAltura] = useState('');
  const [entryHojas, setEntryHojas] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FILTRADO ---
  const entriesFiltradas = useMemo(() => {
    return diary.filter(e => {
      const matchesType = filterType === 'todos' || e.tipo === filterType;
      const matchesPlant = selectedPlantFilter === 'all' || e.planta_nombre === selectedPlantFilter;
      const matchesSearch = debouncedSearchTerm === '' ||
        e.planta_nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        e.descripcion.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesType && matchesPlant && matchesSearch;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Newest first
  }, [diary, filterType, selectedPlantFilter, debouncedSearchTerm]); // ✅ Usa debouncedSearchTerm

  const uniquePlantNames = useMemo(() => Array.from(new Set(diary.map(e => e.planta_nombre))), [diary]);

  // ✅ NUEVA: Agrupación por planta para vista de bitácora
  const plantJournals = useMemo(() => {
    return groupEntriesByPlant(entriesFiltradas);
  }, [entriesFiltradas]);

  // --- HANDLERS ---
  const handleEdit = (entry: DiaryEntry) => {
    setIsEditing(true);
    setEditingId(entry.id);
    const plant = plants.find(p => p.nombre === entry.planta_nombre);
    setBatchPlantIds(plant ? [plant.id.toString()] : []);
    setEntryType(entry.tipo);
    setEntryDate(entry.fecha);
    setEntryDesc(entry.descripcion);
    setEntryAltura(entry.altura?.toString() || '');
    setEntryHojas(entry.hojas?.toString() || '');
    // Cargar imágenes existentes (compatibilidad con imagen única + array)
    const existingImages: string[] = [];
    if (entry.imagenes && entry.imagenes.length > 0) {
      existingImages.push(...entry.imagenes);
    } else if (entry.imagen) {
      existingImages.push(entry.imagen);
    }
    setSelectedImages(existingImages);
    setSelectedFiles([]);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    console.log('[Diary] handleSave iniciado, isSaving:', isSaving, 'batchPlantIds:', batchPlantIds);

    if (isSaving) {
      console.log('[Diary] Bloqueado - ya está guardando');
      return;
    }

    if (batchPlantIds.length === 0) {
      alert('⚠️ Selecciona al menos una planta');
      return;
    }

    // ✅ VALIDACIÓN CON ZOD ANTES DE PROCESAR
    const plant = plants.find(p => p.id === Number(batchPlantIds[0]));
    const dataToValidate = {
      planta_nombre: plant ? plant.nombre : 'General',
      planta_especie: plant ? plant.especie : 'N/A',
      fecha: entryDate,
      tipo: entryType,
      descripcion: entryDesc,
      altura: entryAltura ? Number(entryAltura) : undefined,
      hojas: entryHojas ? Number(entryHojas) : undefined,
    };

    const validation = validateData(DiaryEntrySchema, dataToValidate);

    if (!validation.success) {
      const errorMessage = validation.errors?.join('\n') || 'Datos inválidos';
      alert(`❌ Error de validación:\n\n${errorMessage}`);
      return;
    }

    setIsSaving(true);
    try {
      // Subir todas las imágenes nuevas
      const finalImageUrls: string[] = [...selectedImages.filter(img => !img.startsWith('data:'))]; // URLs ya subidas

      if (user?.key) {
        for (let i = 0; i < selectedFiles.length; i++) {
          console.log(`[Diary] Subiendo imagen ${i + 1}/${selectedFiles.length}...`);
          const uploadedUrl = await uploadImage(selectedFiles[i], user.key);
          if (uploadedUrl) {
            finalImageUrls.push(uploadedUrl);
          }
        }
        console.log('[Diary] Imágenes subidas:', finalImageUrls);
      }

      let allSuccess = true;

      // Batch create logic
      for (const pid of batchPlantIds) {
        const plantForEntry = plants.find(p => p.id === Number(pid));
        const entryData = {
          planta_nombre: plantForEntry ? plantForEntry.nombre : 'General',
          planta_especie: plantForEntry ? plantForEntry.especie : 'N/A',
          fecha: entryDate,
          tipo: entryType,
          descripcion: entryDesc,
          imagen: finalImageUrls[0] || null, // Primera imagen para compatibilidad
          imagenes: finalImageUrls.length > 0 ? finalImageUrls : undefined, // Todas las imágenes
          altura: entryAltura ? Number(entryAltura) : undefined,
          hojas: entryHojas ? Number(entryHojas) : undefined
        };

        console.log('[Diary] Guardando entrada para planta:', pid, entryData);

        let result: boolean;
        if (isEditing && editingId) {
          result = await updateDiaryEntry({ ...entryData, id: editingId, owner_key: user?.key || '' });
        } else {
          result = await addDiaryEntry(entryData);
        }

        if (!result) {
          allSuccess = false;
          console.error('[Diary] Error al guardar entrada para planta:', pid);
        }
      }

      if (allSuccess) {
        setShowAddModal(false);
        resetForm();
      } else {
        alert('⚠️ Algunas entradas no se pudieron guardar. Revisa la consola.');
      }
    } catch (e: any) {
      console.error('[Diary] Error crítico:', e);
      alert(`❌ Error al guardar: ${e.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEntryDesc(''); setEntryAltura(''); setEntryHojas('');
    setSelectedImages([]); setSelectedFiles([]);
    setBatchPlantIds([]); setIsEditing(false); setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar entrada?")) {
      await deleteDiaryEntry(id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const preview = await compressImage(file);
        setSelectedImages(prev => [...prev, preview]);
        setSelectedFiles(prev => [...prev, file]);
      }
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const togglePlantSelection = (id: string) => {
    if (isEditing) return; // Prevent changing plant in edit mode for safety
    setBatchPlantIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }


  // --- RENDER HELPERS ---
  // Simplified Calendar View Render
  const CalendarView = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); // 0 is Sunday

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-sm border border-white dark:border-slate-700 mb-6">
        <h2 className="text-xl font-black text-[#2E2E2E] dark:text-white mb-4 capitalise">
          {today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-[#8E877F] dark:text-slate-400">
          <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square" />)}
          {days.map(d => {
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEntries = entriesFiltradas.filter(e => e.fecha === dateStr);
            const hasActivity = dayEntries.length > 0;

            return (
              <div key={d} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative ${hasActivity ? 'bg-[#F5F3FF] dark:bg-slate-700' : 'bg-[#FAFAFA] dark:bg-slate-900'}`}>
                <span className={`text-sm font-bold ${hasActivity ? 'text-[#4A5D4F] dark:text-slate-300' : 'text-[#D1D5DB] dark:text-slate-600'}`}>{d}</span>
                <div className="flex gap-0.5 mt-1 px-1 flex-wrap justify-center">
                  {dayEntries.slice(0, 3).map((e, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeConfig[e.tipo]?.color }} />
                  ))}
                  {dayEntries.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F5F1EB] dark:bg-slate-900 font-display flex flex-col items-center lg:bg-transparent">
      {/* Paper texture */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0 lg:hidden dark:hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      {/* Header */}
      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-10 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-black text-[#2E2E2E] dark:text-white leading-none mb-1">Diario</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden lg:flex h-10 bg-[#4A5D4F] text-white px-6 rounded-full items-center gap-2 font-black text-xs hover:bg-[#4A5D4F]/90 transition-colors shadow-sm"
              >
                <span>+</span> NUEVO REGISTRO
              </button>
              <p className="text-[11px] font-bold text-[#8E877F] uppercase tracking-wider">{entriesFiltradas.length} Registros</p>
            </div>
          </div>
        </div>

        {/* View Toggle & Search */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2"><IconSearch /></div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-12 rounded-2xl bg-[#EFEBE4] dark:bg-slate-800 border border-white dark:border-slate-700 pl-12 pr-4 text-[14px] font-bold text-[#2E2E2E] dark:text-white shadow-sm outline-none placeholder-[#8E877F]/60 dark:placeholder-slate-400"
            />
          </div>
          <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm h-12 border border-white dark:border-slate-700">
            <button
              onClick={() => setViewMode('journal')}
              className={`px-3 rounded-xl flex items-center justify-center transition-all ${viewMode === 'journal' ? 'bg-[#4A5D4F] text-white shadow-md' : 'text-[#8E877F] dark:text-slate-400'}`}
              title="Vista Bitácora"
            >
              <IconJournal />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 rounded-xl flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-[#4A5D4F] text-white shadow-md' : 'text-[#8E877F] dark:text-slate-400'}`}
              title="Vista Lista"
            >
              <IconList />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 rounded-xl flex items-center justify-center transition-all ${viewMode === 'calendar' ? 'bg-[#4A5D4F] text-white shadow-md' : 'text-[#8E877F] dark:text-slate-400'}`}
              title="Vista Calendario"
            >
              <IconCalendar />
            </button>
          </div>
        </div>

        {/* Filters (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
          {/* Filter by Plant Dropdown Equivalent (Simplified as chips for now or specific button) */}
          <select
            value={selectedPlantFilter}
            onChange={(e) => setSelectedPlantFilter(e.target.value)}
            className="px-4 py-2 rounded-full text-[11px] font-black border bg-white dark:bg-slate-800 border-white dark:border-slate-700 text-[#8E877F] dark:text-slate-300 outline-none"
          >
            <option value="all">Todas las Plantas</option>
            {uniquePlantNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          {['todos', 'riego', 'fertilizacion', 'poda', 'observacion'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-4 py-2 rounded-full text-[11px] font-black transition-all whitespace-nowrap border ${filterType === f
                ? 'bg-[#A5A98F] dark:bg-slate-600 text-white border-[#8D9178] dark:border-slate-500'
                : 'bg-white dark:bg-slate-800 text-[#8E877F] dark:text-slate-300 border-white dark:border-slate-700'
                }`}
            >
              {f === 'todos' ? 'Todos' : typeConfig[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pb-24 lg:pb-10 rounded-t-[40px] ">

        {/* Growth Chart (Contextual) */}
        {selectedPlantFilter !== 'all' && viewMode === 'list' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <GrowthChart data={entriesFiltradas} />
          </div>
        )}

        {/* ✅ NUEVA VISTA: Bitácora por Planta */}
        {viewMode === 'journal' ? (
          <div className="space-y-4">
            {plantJournals.length > 0 ? (
              plantJournals.map((journal) => (
                <PlantJournalCard
                  key={journal.plantName}
                  journal={journal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  defaultExpanded={plantJournals.length === 1}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-[24px] shadow-sm border border-white dark:border-slate-700 text-[#8E877F] dark:text-slate-400">
                <div className="text-[60px] mb-4 opacity-20">📖</div>
                <p className="text-[14px] font-medium mb-2">No hay entradas en el diario</p>
                <p className="text-[12px] opacity-60">Comienza registrando el progreso de tus plantas</p>
              </div>
            )}
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView />
        ) : (
          /* Timeline List */
          <div className="relative space-y-0 pl-4 border-l-2 border-[#E5E7EB] dark:border-slate-700 ml-4 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:gap-y-0 lg:border-l-0 lg:ml-0 lg:pl-0">
            {entriesFiltradas.map((entry) => {
              const Conf = typeConfig[entry.tipo];
              return (
                <div key={entry.id} className="relative mb-8 pl-6">
                  {/* Timeline Node */}
                  <div className="absolute -left-[29px] lg:-left-12 top-6 w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border-2 flex items-center justify-center shadow-sm z-10 overflow-hidden" style={{ borderColor: Conf?.color || '#8E877F' }}>
                    <SpeciesIcon species={entry.planta_especie} size={36} />
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white dark:border-slate-700 relative overflow-hidden group hover:scale-[1.01] transition-transform">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[16px] font-black text-[#2E2E2E] dark:text-white leading-tight truncate">{entry.planta_nombre}</h3>
                        <span className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 opacity-70 uppercase tracking-widest">{Conf?.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8E877F] dark:text-slate-400 bg-[#F5F5F5] dark:bg-slate-700 px-2 py-1 rounded-lg">{new Date(entry.fecha).toLocaleDateString()}</span>
                    </div>

                    <p className="text-[13px] font-medium text-[#4A5D4F] dark:text-slate-300 leading-relaxed mb-3">
                      {entry.descripcion}
                    </p>

                    {/* Metrics Tags */}
                    {(entry.altura || entry.hojas) && (
                      <div className="flex gap-2 mb-3">
                        {entry.altura && <span className="bg-[#EFEBE4] dark:bg-slate-700 text-[#4A5D4F] dark:text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold border border-[#E5E5E5] dark:border-slate-600">📏 {entry.altura}cm</span>}
                        {entry.hojas && <span className="bg-[#EFEBE4] dark:bg-slate-700 text-[#4A5D4F] dark:text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold border border-[#E5E5E5] dark:border-slate-600">🍃 {entry.hojas} h</span>}
                      </div>
                    )}

                    {/* Galería de imágenes - Click para abrir lightbox */}
                    {(entry.imagenes?.length || entry.imagen) && (() => {
                      const allImages = entry.imagenes?.length ? entry.imagenes : (entry.imagen ? [entry.imagen] : []);
                      return (
                        <div className="relative rounded-[16px] overflow-hidden mb-3 group-hover:shadow-md transition-shadow">
                          {allImages.length > 1 ? (
                            <div className="flex gap-1 overflow-x-auto pb-1 snap-x">
                              {allImages.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  className="h-32 w-auto object-cover rounded-lg snap-start flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                  alt={`Entry ${idx + 1}`}
                                  onClick={(e) => { e.stopPropagation(); openLightbox(allImages, idx); }}
                                />
                              ))}
                            </div>
                          ) : (
                            <img
                              src={allImages[0]}
                              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              alt="Entry"
                              onClick={(e) => { e.stopPropagation(); openLightbox(allImages, 0); }}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {/* Actions (Slide in on hover or always visible in mobile) */}
                    <div className="flex justify-end gap-4 mt-2 border-t border-[#F5F1EB] dark:border-slate-700 pt-2 opacity-60 hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(entry)} className="text-[10px] font-black text-[#4A5D4F] dark:text-slate-400 flex items-center gap-1 hover:bg-[#F0FDF4] dark:hover:bg-slate-700 px-2 py-1 rounded">EDITAR</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-[10px] font-black text-[#FF7A59] flex items-center gap-1 hover:bg-[#FEF2F2] dark:hover:bg-slate-700 px-2 py-1 rounded">BORRAR</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {entriesFiltradas.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <p className="text-[#4A5D4F] dark:text-slate-400 font-bold">No hay registros</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#4A5D4F] rounded-full shadow-[0_10px_30px_rgba(74,93,79,0.4)] flex items-center justify-center z-40 active:scale-90 transition-transform hover:scale-105 lg:hidden"
      >
        <IconAdd />
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-[#F5F1EB] dark:border-slate-800/80 flex justify-around items-center px-4 z-50 lg:hidden">
        <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-transform">
          <AssetIcon name="icon-home" size={24} className="opacity-40" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => navigate('/crosses')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-transform">
          <AssetIcon name="icon-crosses" size={24} className="opacity-40" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Cruzas</span>
        </button>
        <button onClick={() => navigate('/plants')} className="flex flex-col items-center gap-1.5 text-[#8E877F] active:scale-95 transition-transform">
          <AssetIcon name="icon-plants" size={24} className="opacity-40" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Plantas</span>
        </button>
        <button onClick={() => navigate('/diary')} className="flex flex-col items-center gap-1.5 text-[#4A5D4F] active:scale-95 transition-transform relative">
          <div className="absolute -top-12 w-1.5 h-1.5 rounded-full bg-[#4A5D4F]" />
          <AssetIcon name="icon-diary" size={24} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Diario</span>
        </button>
      </div>

      {/* Edit/Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center lg:items-center p-0 lg:p-6">
          <div className="bg-[#F5F1EB] dark:bg-slate-900 w-full max-w-md lg:max-w-2xl lg:rounded-[40px] rounded-t-[40px] shadow-2xl animate-in slide-in-from-bottom lg:zoom-in duration-300 h-fit max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[24px] font-black text-[#2E2E2E] dark:text-white">{isEditing ? 'Editar Entrada' : 'Nuevo Registro'}</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="w-10 h-10 bg-white dark:bg-slate-800 dark:text-white rounded-full flex items-center justify-center shadow-sm">✕</button>
              </div>

              <div className="space-y-4">

                {/* Batch Plant Selector */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-black text-[#8E877F] uppercase tracking-wider">Plantas ({batchPlantIds.length})</label>
                    {!isEditing && batchPlantIds.length > 0 && <button onClick={() => setBatchPlantIds([])} className="text-[10px] text-red-500 font-bold">Limpiar</button>}
                  </div>

                  {isEditing ? (
                    // Single plant display if editing
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-[#EFEBE4] dark:border-slate-700 font-bold text-[#4A5D4F] dark:text-slate-300">
                      {plants.find(p => p.id === Number(batchPlantIds[0]))?.nombre || 'Planta no encontrada'}
                    </div>
                  ) : (
                    // Multi-select grid
                    <div className="max-h-32 overflow-y-auto grid grid-cols-2 gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-[#EFEBE4] dark:border-slate-700">
                      {plants.length > 0 ? plants.map(p => (
                        <button
                          key={p.id}
                          onClick={() => togglePlantSelection(p.id.toString())}
                          className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border ${batchPlantIds.includes(p.id.toString())
                            ? 'bg-[#4A5D4F] text-white border-[#4A5D4F]'
                            : 'bg-[#FAFAFA] dark:bg-slate-700 text-[#8E877F] dark:text-slate-400 border-transparent hover:bg-gray-100 dark:hover:bg-slate-600'
                            }`}
                        >
                          {batchPlantIds.includes(p.id.toString()) && '✓ '}{p.nombre}
                        </button>
                      )) : <p className="col-span-2 text-center text-xs p-2 text-gray-400">No hay plantas registradas</p>}
                    </div>
                  )}
                  {batchPlantIds.length === 0 && <p className="text-[10px] text-red-400 mt-1 font-bold pl-1">* Selecciona al menos una planta</p>}
                </div>

                {/* Type Selector */}
                <div>
                  <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider mb-2">Actividad</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(typeConfig).map(t => {
                      const C = typeConfig[t];
                      const isActive = entryType === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setEntryType(t as any)}
                          className={`h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border-2 ${isActive ? 'border-[#4A5D4F] bg-[#4A5D4F] text-white' : 'border-[#EFEBE4] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#8E877F] dark:text-slate-400'}`}
                        >
                          <span className="text-sm">{C.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider mb-2">Fecha</label>
                  <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full h-12 bg-white dark:bg-slate-800 rounded-2xl px-4 font-bold text-[#2E2E2E] dark:text-white border border-[#EFEBE4] dark:border-slate-700 outline-none" />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider mb-2">Notas</label>
                  <textarea
                    value={entryDesc}
                    onChange={e => setEntryDesc(e.target.value)}
                    placeholder="Detalles del progreso..."
                    rows={3}
                    className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 font-bold text-[#2E2E2E] dark:text-white border border-[#EFEBE4] dark:border-slate-700 outline-none resize-none"
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider mb-2">Altura (cm)</label>
                    <input type="number" value={entryAltura} onChange={e => setEntryAltura(e.target.value)} className="w-full h-12 bg-white dark:bg-slate-800 rounded-2xl px-4 font-bold text-[#2E2E2E] dark:text-white border border-[#EFEBE4] dark:border-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider mb-2">Hojas</label>
                    <input type="number" value={entryHojas} onChange={e => setEntryHojas(e.target.value)} className="w-full h-12 bg-white dark:bg-slate-800 rounded-2xl px-4 font-bold text-[#2E2E2E] dark:text-white border border-[#EFEBE4] dark:border-slate-700 outline-none" />
                  </div>
                </div>

                {/* Images - Multiple */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-[#8E877F] uppercase tracking-wider">Fotos ({selectedImages.length})</label>

                  {/* Grid de imágenes seleccionadas */}
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {selectedImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón para agregar más fotos */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 bg-white dark:bg-slate-800 border-2 border-dashed border-[#EFEBE4] dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#4A5D4F] transition-colors"
                  >
                    <span className="text-[#8E877F] font-bold text-xs flex flex-col items-center gap-1">
                      <span className="text-xl">📷</span>
                      <span>{selectedImages.length > 0 ? 'Agregar más fotos' : 'Agregar Fotos'}</span>
                    </span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />

                <button
                  onClick={handleSave}
                  disabled={isSaving || !entryDesc || batchPlantIds.length === 0}
                  className="w-full h-14 bg-[#4A5D4F] text-white font-black rounded-full shadow-lg active:scale-95 transition-transform mt-4 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? 'Guardando...' : `Guardar ${batchPlantIds.length > 1 ? `(${batchPlantIds.length})` : ''} Entrada`}
                </button>
                <div className="h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
        />
      )}

    </div>
  );
};

export default DiaryScreen;
