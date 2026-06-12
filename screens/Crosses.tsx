import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/planHelpers';
import { compressImage, uploadImage } from '../utils/imageHelpers';
import { Cross, ExtraParent } from '../types';
import { CrossSchema, validateData } from '../utils/validationSchemas';
import { useDebouncedValue } from '../utils/hooks';
import { motion, AnimatePresence } from 'framer-motion';

// --- CUSTOM SVG ICONS (Organic Minimalist) ---

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconDNA = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconFemale = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="9" r="6" />
    <path d="M12 15v7M9 19h6" />
  </svg>
);

const IconMale = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="6" />
    <path d="M14 10l7-7M16 3h5v5" />
  </svg>
);

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CrossesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { crosses, addCross, deleteCross, updateCross, setCrosses, offlineMode, toggleOfflineMode, pendingQueueLength, syncPendingActions, addSeedBatch } = useApp();
  const { user } = useAuth();

  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300); // ✅ Debounce de 300ms
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCross, setSelectedCross] = useState<Cross | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'madre' | 'padre' | 'hibrido' | 'extra', index?: number } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{
    madre?: File | null;
    padre?: File | null;
    hibrido?: File | null;
    extras?: { [index: number]: File | null };
  }>({});

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Cross | null>(null);

  const [newCrossData, setNewCrossData] = useState({
    nombre: '',
    madre_nombre: '',
    madre_especie: '',
    padre_nombre: '',
    padre_especie: '',
    padres_extra: [] as ExtraParent[],
    fecha_cruza: new Date().toISOString().split('T')[0],
    notas: '',
    madre_imagen: null as string | null,
    padre_imagen: null as string | null,
    hibrido_imagen: null as string | null
  });

  const canViewGenealogy = hasAccess(user?.plan, 'elite');

  const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
    en_proceso: { label: t('crosses.status.inProcess').toUpperCase(), color: 'text-[#8E7C4B]', bg: 'bg-[#F2E8D5]' },
    completada: { label: t('crosses.status.completed').toUpperCase(), color: 'text-[#4A5D4F]', bg: 'bg-[#CDE8B5]' },
    fallida: { label: t('crosses.status.failed').toUpperCase(), color: 'text-[#A33D3D]', bg: 'bg-[#F2D5D5]' }
  };

  const cruzasFiltradas = useMemo(() =>
    crosses.filter(c => {
      const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
      const matchSearch = !debouncedSearchTerm ||
        c.nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.madre_nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        c.padre_nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchEstado && matchSearch;
    })
    , [crosses, filterEstado, debouncedSearchTerm]); // ✅ Usa debouncedSearchTerm

  const stats = useMemo(() => ({
    enProceso: crosses.filter(c => c.estado === 'en_proceso').length,
    completadas: crosses.filter(c => c.estado === 'completada').length,
    plantas: crosses.reduce((sum, c) => sum + (c.plantas_germinadas || 0), 0)
  }), [crosses]);

  const { fetchData } = useApp();

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (e) {
      console.error("Error refreshing data:", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Visual feedback duration
    }
  };

  const handleSaveCross = async () => {
    if (isSaving) {
      console.log('[Crosses] handleSaveCross bloqueado - isSaving:', isSaving);
      return;
    }

    console.log('[Crosses] Iniciando handleSaveCross con datos:', newCrossData);

    // ✅ VALIDACIÓN CON ZOD ANTES DE PROCESAR
    const dataToValidate = {
      nombre: newCrossData.nombre,
      madre_nombre: newCrossData.madre_nombre,
      madre_especie: newCrossData.madre_especie || 'Desconocida', // Default to pass Zod schema since UI doesn't ask for it
      padre_nombre: newCrossData.padre_nombre,
      padre_especie: newCrossData.padre_especie || 'Desconocida', // Default to pass Zod schema since UI doesn't ask for it
      fecha_cruza: newCrossData.fecha_cruza,
      notas: newCrossData.notas || '',
      estado: 'en_proceso' as const,
    };

    const validation = validateData(CrossSchema, dataToValidate);

    if (!validation.success) {
      const errorMessage = validation.errors?.join('\n') || 'Datos inválidos';
      console.error('[Crosses] Validación falló:', validation.errors);
      alert(`❌ Error de validación:\n\n${errorMessage}`);
      return;
    }

    console.log('[Crosses] Validación pasada, procediendo...');
    setIsSaving(true);
    // V3: USAMOS UN ID ALEATORIO SEGURO PARA LA UI (Como lo hiciste en AppContext)
    const tempId = Date.now() + Math.floor(Math.random() * 10000);

    try {
      const crossToSave = JSON.parse(JSON.stringify(newCrossData));
      const filesToUpload = { ...pendingFiles };

      // UI OPTIMISTA
      const tempCross: Cross = {
        ...crossToSave,
        id: tempId,
        isSyncing: true,
        fecha_germinacion: null,
        semillas_obtenidas: 0,
        plantas_germinadas: 0,
        estado: 'en_proceso',
        padres_extra: crossToSave.padres_extra || [],
        errorMessage: 'Validando...' // Feedback inicial
      };

      setCrosses(prev => [tempCross, ...prev]);
      setShowAddModal(false);

      setNewCrossData({
        nombre: '', madre_nombre: '', madre_especie: '', padre_nombre: '', padre_especie: '',
        padres_extra: [], fecha_cruza: new Date().toISOString().split('T')[0], notas: '',
        madre_imagen: null, padre_imagen: null, hibrido_imagen: null
      });
      setPendingFiles({});

      // BACKGROUND PROCESS (SEQUENTIAL IMAGES V7)
      (async () => {
        const updateStatus = (msg: string) => {
          setCrosses(prev => prev.map(c => c.id === tempId ? { ...c, errorMessage: msg } : c));
        };

        try {
          updateStatus("Preparando imágenes...");

          let madreUrl = crossToSave.madre_imagen;
          let padreUrl = crossToSave.padre_imagen;
          let hibridoUrl = crossToSave.hibrido_imagen;
          const extras = [...(crossToSave.padres_extra || [])];

          if (user?.key) {
            // 1. MADRE
            if (filesToUpload.madre) {
              updateStatus("Subiendo foto Madre...");
              madreUrl = await uploadImage(filesToUpload.madre, user.key);
            }
            // 2. PADRE
            if (filesToUpload.padre) {
              updateStatus("Subiendo foto Padre...");
              padreUrl = await uploadImage(filesToUpload.padre, user.key);
            }
            // 3. HIBRIDO
            if (filesToUpload.hibrido) {
              updateStatus("Subiendo foto Híbrido...");
              hibridoUrl = await uploadImage(filesToUpload.hibrido, user.key);
            }
            // 4. EXTRAS
            if (filesToUpload.extras) {
              const extraFiles = filesToUpload.extras;
              const indices = Object.keys(extraFiles).map(Number);
              for (const idx of indices) {
                if (extraFiles[idx]) {
                  updateStatus(`Subiendo extra ${idx + 1}...`);
                  const url = await uploadImage(extraFiles[idx] as File, user.key);
                  if (extras[idx]) extras[idx] = { ...extras[idx], imagen: url };
                }
              }
            }
          }

          updateStatus("Guardando en base de datos...");
          const cleanImageUrl = (url: any) => (typeof url === 'string' && url.startsWith('data:image') ? null : (url || null));

          // Call AppContext addCross (which now has locking!)
          const result = await addCross({
            ...crossToSave,
            nombre: crossToSave.nombre.toUpperCase(),
            madre_imagen: cleanImageUrl(madreUrl),
            padre_imagen: cleanImageUrl(padreUrl),
            hibrido_imagen: cleanImageUrl(hibridoUrl),
            padres_extra: extras.map((e: any) => ({ ...e, imagen: cleanImageUrl(e.imagen) })),
            fecha_germinacion: null,
            semillas_obtenidas: 0,
            plantas_germinadas: 0,
            estado: 'en_proceso'
          }, tempId);

          if (!result.success) {
            console.error("[Crosses] addCross falló:", result.error);
            alert(`❌ Error al guardar cruza: ${result.error || 'Error desconocido'}`);
            setCrosses(prev => prev.map(c => c.id === tempId ? {
              ...c,
              isSyncing: false,
              estado: 'fallida' as const,
              errorMessage: result.error
            } : c));
          } else {
            console.log('[Crosses] Cruza guardada exitosamente');
            // Success - Limpiar mensaje de error (estado)
            setCrosses(prev => prev.map(c => c.id === tempId ? { ...c, errorMessage: undefined, isSyncing: false } : c));
          }

        } catch (e: any) {
          console.error("[Crosses] Error crítico en background sync:", e);
          const msg = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
          alert(`❌ Error al procesar cruza: ${msg}`);
          setCrosses(prev => prev.map(c => c.id === tempId ? {
            ...c,
            isSyncing: false,
            estado: 'fallida' as const,
            errorMessage: msg
          } : c));
        }
      })().catch(err => {
        console.error("[Crosses] Error no capturado en background:", err);
        alert(`❌ Error inesperado: ${err?.message || err}`);
      });

    } catch (err: any) {
      console.error("[Crosses] Error al iniciar guardado:", err);
      alert("Error al iniciar guardado: " + (err?.message || JSON.stringify(err)));
      setIsSaving(false); // Asegurar reset en caso de error
    } finally {
      console.log('[Crosses] Finally: reseteando isSaving');
      setIsSaving(false);
    }
  };

  const handleUpdateCross = async () => {
    if (editData) {
      setIsSaving(true);
      try {
        let madreUrl = editData.madre_imagen;
        let padreUrl = editData.padre_imagen;
        let hibridoUrl = editData.hibrido_imagen;

        if (user?.key) {
          const uploadPromises: Promise<any>[] = [];
          const taskKeys: string[] = [];

          if (pendingFiles.madre) { uploadPromises.push(uploadImage(pendingFiles.madre, user.key)); taskKeys.push('madre'); }
          if (pendingFiles.padre) { uploadPromises.push(uploadImage(pendingFiles.padre, user.key)); taskKeys.push('padre'); }
          if (pendingFiles.hibrido) { uploadPromises.push(uploadImage(pendingFiles.hibrido, user.key)); taskKeys.push('hibrido'); }

          const results = await Promise.all(uploadPromises);
          results.forEach((url, i) => {
            if (taskKeys[i] === 'madre') madreUrl = url;
            else if (taskKeys[i] === 'padre') padreUrl = url;
            else if (taskKeys[i] === 'hibrido') hibridoUrl = url;
          });
        }

        const cleanImageUrl = (url: any) => (typeof url === 'string' && url.startsWith('data:image') ? null : (url || null));

        const success = await updateCross({
          ...editData,
          madre_imagen: cleanImageUrl(madreUrl),
          padre_imagen: cleanImageUrl(padreUrl),
          hibrido_imagen: cleanImageUrl(hibridoUrl)
        });

        // --- THE BRIDGE LOGIC ---
        // Si el usuario acaba de marcar que obtuvo semillas (y no tenía o acaba de actualizar la cantidad) y la guarda...
        const justHarvestedSeeds = editData.semillas_obtenidas > 0 && 
           (selectedCross?.semillas_obtenidas === 0 || editData.estado === 'completada');

        if (success) {
          setSelectedCross({ ...editData, madre_imagen: madreUrl, padre_imagen: padreUrl, hibrido_imagen: hibridoUrl });
          setIsEditing(false);
          setPendingFiles({});

          // Pregunta Mágica
          if (justHarvestedSeeds) {
            setTimeout(async () => {
              if (window.confirm(`¡Felicidades por la cosecha! 🎉\n\n¿Quieres extraer estas ${editData.semillas_obtenidas} semillas y guardarlas en tu Banco de Semillas?`)) {
                const seedResult = await addSeedBatch({
                  nombre: `${editData.nombre} (Cosecha)`,
                  especie: '',
                  cantidad: editData.semillas_obtenidas,
                  fecha_ingreso: new Date().toISOString(),
                  origen: 'propia',
                  cross_id: editData.id,
                  estado: 'almacenada',
                  notas: `Cosecha de la cruza: ${editData.nombre}`
                });
                if (seedResult) {
                  alert('✅ Semillas enviadas al Banco Exitosamente');
                  navigate('/seed-bank');
                } else {
                  alert('❌ Error al guardar las semillas en Supabase. Revisar consola.');
                }
              }
            }, 500); // Pequeño delay para que React termine de actualizar el DOM detrás
          }
        }
      } catch (e) { console.error(e); }
      finally { setIsSaving(false); }
    }
  };

  const handleTransferToBank = async () => {
    if (!selectedCross || selectedCross.semillas_obtenidas <= 0) return;
    if (window.confirm(`¿Transferir ${selectedCross.semillas_obtenidas} semillas al Banco de Semillas?`)) {
        const result = await addSeedBatch({
            nombre: `${selectedCross.nombre} (Cosecha)`,
            especie: '',
            cantidad: selectedCross.semillas_obtenidas,
            fecha_ingreso: new Date().toISOString(),
            origen: 'propia',
            cross_id: selectedCross.id,
            estado: 'almacenada',
            notas: `Transferido desde la cruza ${selectedCross.nombre}`
        });
        if (result) {
          alert('✅ Semillas enviadas al Banco Exitosamente');
          navigate('/seed-bank');
        } else {
          alert('❌ Error al guardar las semillas en Supabase. Revisar consola para más detalles.');
        }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      try {
        const result = await compressImage(file);

        if (uploadTarget.type === 'madre') {
          if (isEditing && editData) {
            setEditData(prev => prev ? ({ ...prev, madre_imagen: result }) : null);
          } else {
            setNewCrossData(prev => ({ ...prev, madre_imagen: result }));
          }
          setPendingFiles(prev => ({ ...prev, madre: file }));

        } else if (uploadTarget.type === 'padre') {
          if (isEditing && editData) {
            setEditData(prev => prev ? ({ ...prev, padre_imagen: result }) : null);
          } else {
            setNewCrossData(prev => ({ ...prev, padre_imagen: result }));
          }
          setPendingFiles(prev => ({ ...prev, padre: file }));

        } else if (uploadTarget.type === 'hibrido') {
          if (isEditing && editData) {
            setEditData(prev => prev ? ({ ...prev, hibrido_imagen: result }) : null);
          } else {
            setNewCrossData(prev => ({ ...prev, hibrido_imagen: result }));
          }
          setPendingFiles(prev => ({ ...prev, hibrido: file }));

        } else if (uploadTarget.type === 'extra' && typeof uploadTarget.index === 'number') {
          // Extras seem only implemented for Create Mode based on UI
          if (!isEditing) {
            setNewCrossData(prev => {
              const updated = [...prev.padres_extra];
              updated[uploadTarget.index!] = { ...updated[uploadTarget.index!], imagen: result };
              return { ...prev, padres_extra: updated };
            });
            setPendingFiles(prev => ({
              ...prev, extras: { ...prev.extras, [uploadTarget.index!]: file }
            }));
          }
        }
      } catch (err: any) {
        alert(err?.message || "Error al procesar imagen");
      }
    }
    if (e.target) e.target.value = '';
  };

  const triggerUpload = (type: 'madre' | 'padre' | 'hibrido' | 'extra', index?: number) => {
    setUploadTarget({ type, index });
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center select-none overflow-x-hidden lg:bg-transparent">
      {/* Paper texture overlay */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-50 lg:hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {/* Header Section */}
      <div className="w-full max-w-[390px] lg:max-w-6xl px-6 pt-12 pb-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="flex items-center gap-4">
            {/* Offline Toggle */}
            <button
              onClick={toggleOfflineMode}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all ${offlineMode ? 'bg-[#FF7A59] text-white' : 'bg-white text-[#A5A98F]'}`}
              title={offlineMode ? "Modo Offline Activo (Guardado local)" : "Modo Online (Sincronización automática)"}
            >
              {offlineMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg> // Plane/Disconnect logic icon
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2A10 10 0 1 1 2 12" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg> // Signal logic icon
              )}
              {offlineMode ? '✈️' : '📡'}
            </button>

            {/* Sync Button (Shows if pending items exist) */}
            {pendingQueueLength > 0 && (
              <button
                onClick={() => syncPendingActions()}
                className="h-10 px-6 bg-[#4A5D4F] text-white rounded-full flex items-center gap-2 font-black text-[10px] shadow-lg animate-pulse"
                title={`Sincronizará ${Math.min(pendingQueueLength, 10)} items. Quedantes: ${Math.max(0, pendingQueueLength - 10)}`}
              >
                <IconRefresh /> {t('crosses.list.syncing')} ({pendingQueueLength})
              </button>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all ${isRefreshing ? 'animate-spin opacity-50' : 'text-[#A5A98F]'}`}
            >
              <IconRefresh />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden lg:flex h-10 bg-[#FF7A59] text-white px-6 rounded-full items-center gap-2 font-black text-xs hover:bg-[#FF7A59]/90 transition-colors shadow-sm"
            >
              <IconPlus /> {t('crosses.newCross')}
            </button>
            <div className="flex gap-2">
              <div className="bg-[#A5A98F]/10 px-4 py-2 rounded-2xl flex flex-col items-center">
                <span className="text-[14px] font-black text-[#4A5D4F]">{stats.enProceso}</span>
                <span className="text-[8px] font-bold text-[#8E877F] uppercase tracking-widest">{t('crosses.stats.process')}</span>
              </div>
              <div className="bg-[#A5A98F]/10 px-4 py-2 rounded-2xl flex flex-col items-center">
                <span className="text-[14px] font-black text-[#4A5D4F]">{stats.completadas}</span>
                <span className="text-[8px] font-bold text-[#8E877F] uppercase tracking-widest">{t('crosses.stats.success')}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-[34px] font-black text-[#2E2E2E] leading-tight mb-1">{t('crosses.title')}</h1>
          <p className="text-[14px] font-bold text-[#8E877F] italic">{crosses.length} {t('crosses.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8E877F]/60 group-focus-within:text-[#A5A98F] transition-colors">
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder={t('crosses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/60 border border-white rounded-full pl-14 pr-6 py-4 text-[14px] font-bold text-[#4A5D4F] placeholder-[#8E877F]/40 focus:outline-none focus:ring-4 ring-[#A5A98F]/5 transition-all"
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="w-full max-w-[390px] lg:max-w-6xl px-6 mb-6 flex gap-2 overflow-x-auto no-scrollbar py-2">
        {['todos', 'en_proceso', 'completada', 'fallida'].map((estado) => {
          const isActive = filterEstado === estado;
          return (
            <button
              key={estado}
              onClick={() => setFilterEstado(estado)}
              className={`px-6 py-2.5 rounded-full text-[12px] font-black transition-all border shrink-0 ${isActive
                ? 'bg-[#A5A98F] text-white border-[#A5A98F] shadow-lg shadow-[#A5A98F]/20'
                : 'bg-white/40 text-[#8E877F] border-white'
                }`}
            >
              {estado === 'todos' ? t('crosses.filters.all') :
                estado === 'en_proceso' ? t('crosses.filters.inProcess') :
                  estado === 'completada' ? t('crosses.filters.completed') :
                    t('crosses.filters.failed')}
            </button>
          );
        })}
      </div>

      {/* List Section */}
      <div className="w-full max-w-[390px] lg:max-w-6xl px-6 pb-32 lg:pb-10 flex flex-col gap-4 lg:grid lg:grid-cols-2">
        {cruzasFiltradas.length > 0 ? (
          cruzasFiltradas.map((cruza) => {
            const config = estadoConfig[cruza.estado] || estadoConfig.en_proceso;
            const tasa = cruza.semillas_obtenidas > 0 ? ((cruza.plantas_germinadas / cruza.semillas_obtenidas) * 100).toFixed(0) : 0;

            return (
              <div
                key={cruza.id}
                onClick={() => { setSelectedCross(cruza); setEditData(cruza); setIsEditing(false); }}
                className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white hover:translate-y-[-2px] transition-all cursor-pointer group"
              >
                <div className="flex gap-4 items-start mb-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-[#F5F1EB] rounded-2xl flex items-center justify-center overflow-hidden border border-white">
                      {cruza.hibrido_imagen ? (
                        <img src={cruza.hibrido_imagen} className="w-full h-full object-cover" alt="Hybrid" />
                      ) : cruza.madre_imagen || cruza.padre_imagen ? (
                        <div className="flex w-full h-full">
                          <img src={cruza.madre_imagen || cruza.padre_imagen!} className="w-full h-full object-cover" alt="Parent" />
                        </div>
                      ) : (
                        <IconDNA />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#A5A98F] rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white">
                      {tasa}%
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="text-[16px] font-black text-[#2E2E2E] truncate pr-2">{cruza.nombre}</h3>
                      <div className="flex items-center gap-2">
                        {cruza.isSyncing && (
                          <div className="w-3 h-3 border-2 border-[#FF7A59] border-t-transparent rounded-full animate-spin" />
                        )}
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black shrink-0 ${cruza.isSyncing ? 'bg-[#FF7A59]/10 text-[#FF7A59]' : config.bg + ' ' + config.color}`}>
                          {cruza.isSyncing ? t('crosses.list.syncing') : config.label}
                        </div>
                      </div>
                    </div>

                    {cruza.estado === 'fallida' && cruza.errorMessage && (
                      <div className="mt-1 mb-2 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg w-full text-center border border-red-200">
                        ⚠️ {t('crosses.list.error')}: {cruza.errorMessage}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] font-bold text-[#8E877F] italic">
                      <div className="flex items-center gap-1">
                        <IconFemale /> {cruza.madre_nombre.split(' ')[0]}
                      </div>
                      <div className="flex items-center gap-1">
                        <IconMale /> {cruza.padre_nombre.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#F5F1EB]/50 rounded-2xl p-2.5 border border-white flex flex-col items-center">
                    <span className="text-[12px] font-black text-[#4A5D4F]">{cruza.semillas_obtenidas}</span>
                    <span className="text-[7px] font-black text-[#8E877F] tracking-widest opacity-60">{t('crosses.list.seeds')}</span>
                  </div>
                  <div className="bg-[#F5F1EB]/50 rounded-2xl p-2.5 border border-white flex flex-col items-center">
                    <span className="text-[12px] font-black text-[#4A5D4F]">{cruza.plantas_germinadas}</span>
                    <span className="text-[7px] font-black text-[#8E877F] tracking-widest opacity-60">{t('crosses.list.plants')}</span>
                  </div>
                  <div className="bg-[#F5F1EB]/50 rounded-2xl p-2.5 border border-white flex flex-col items-center">
                    <span className="text-[12px] font-black text-[#4A5D4F]">{Math.floor((new Date().getTime() - new Date(cruza.fecha_cruza).getTime()) / (1000 * 60 * 60 * 24))}</span>
                    <span className="text-[7px] font-black text-[#8E877F] tracking-widest opacity-60">{t('crosses.list.days')}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center flex flex-col items-center opacity-40">
            <div className="text-4xl mb-4">🧬</div>
            <p className="text-[14px] font-bold text-[#8E877F]">{t('crosses.empty')}</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center px-6 z-40 max-w-[390px] mx-auto lg:hidden">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full h-14 bg-[#FF7A59] text-white font-black rounded-full shadow-2xl shadow-[#FF7A59]/40 flex items-center justify-center gap-3 active:scale-95 transition-all text-[15px] tracking-wide"
        >
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <IconPlus />
          </div>
          {t('crosses.newCross')}
        </button>
      </div>

      {/* Adding Modal */}
      <AnimatePresence>
      {
        showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center lg:items-center p-0 lg:p-6"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full max-w-[390px] lg:max-w-xl lg:rounded-[40px] h-[92vh] lg:h-fit max-h-[92vh] rounded-t-[40px] shadow-2xl overflow-y-auto no-scrollbar p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-[24px] font-black text-[#2E2E2E]">{t('crosses.modalAdd.title')}</h2>
                  <p className="text-[12px] font-bold text-[#8E877F] italic">{t('crosses.modalAdd.subtitle')}</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-[#F5F1EB] rounded-full flex items-center justify-center text-[#2E2E2E]">
                  <IconClose />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase">{t('crosses.modalAdd.nameLabel')}</label>
                  <input
                    type="text" value={newCrossData.nombre}
                    onChange={e => setNewCrossData({ ...newCrossData, nombre: e.target.value })}
                    placeholder={t('crosses.modalAdd.namePlaceholder')}
                    className="w-full bg-[#F5F1EB]/60 border border-white rounded-full px-6 py-4 text-[14px] font-bold text-[#4A5D4F] placeholder-[#8E877F]/40 focus:outline-none focus:ring-2 ring-[#A5A98F]/20"
                  />
                </div>

                <div className="space-y-2">

                  <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase">{t('crosses.modalAdd.hybridPhoto')}</label>
                  <div onClick={() => triggerUpload('hibrido')} className="w-full h-32 bg-[#F5F1EB] rounded-[30px] border border-white flex flex-col items-center justify-center cursor-pointer overflow-hidden border-dashed relative">
                    {newCrossData.hibrido_imagen ? (
                      <img src={newCrossData.hibrido_imagen} className="w-full h-full object-cover" alt="Híbrido" />
                    ) : (
                      <>
                        <IconCamera />
                        <span className="text-[9px] font-black text-[#8E877F] mt-2">{t('crosses.modalAdd.captureHybrid')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase flex items-center gap-2">
                      <IconFemale /> {t('crosses.modalAdd.mother')}
                    </label>
                    <div onClick={() => triggerUpload('madre')} className="aspect-square bg-[#F5F1EB] rounded-[30px] border border-white flex flex-col items-center justify-center cursor-pointer overflow-hidden border-dashed relative">
                      {newCrossData.madre_imagen ? (
                        <img src={newCrossData.madre_imagen} className="w-full h-full object-cover" alt="Madre" />
                      ) : (
                        <>
                          <IconCamera />
                          <span className="text-[9px] font-black text-[#8E877F] mt-2">FOTO</span>
                        </>
                      )}
                    </div>
                    <input
                      placeholder={t('crosses.modalAdd.nameInputPlaceholder')} value={newCrossData.madre_nombre}
                      onChange={e => setNewCrossData({ ...newCrossData, madre_nombre: e.target.value })}
                      className="w-full bg-[#F5F1EB]/30 border border-white rounded-2xl px-4 py-2 text-[12px] font-bold text-[#4A5D4F] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase flex items-center gap-2">
                      <IconMale /> {t('crosses.modalAdd.father')}
                    </label>
                    <div onClick={() => triggerUpload('padre')} className="aspect-square bg-[#F5F1EB] rounded-[30px] border border-white flex flex-col items-center justify-center cursor-pointer overflow-hidden border-dashed relative">
                      {newCrossData.padre_imagen ? (
                        <img src={newCrossData.padre_imagen} className="w-full h-full object-cover" alt="Padre" />
                      ) : (
                        <>
                          <IconCamera />
                          <span className="text-[9px] font-black text-[#8E877F] mt-2">FOTO</span>
                        </>
                      )}
                    </div>
                    <input
                      placeholder={t('crosses.modalAdd.nameInputPlaceholder')} value={newCrossData.padre_nombre}
                      onChange={e => setNewCrossData({ ...newCrossData, padre_nombre: e.target.value })}
                      className="w-full bg-[#F5F1EB]/30 border border-white rounded-2xl px-4 py-2 text-[12px] font-bold text-[#4A5D4F] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase">{t('crosses.modalAdd.dateLabel')}</label>
                  <input
                    type="date" value={newCrossData.fecha_cruza}
                    onChange={e => setNewCrossData({ ...newCrossData, fecha_cruza: e.target.value })}
                    className="w-full bg-[#F5F1EB]/60 border border-white rounded-full px-6 py-4 text-[14px] font-bold text-[#4A5D4F] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#8E877F] tracking-widest ml-4 uppercase">{t('crosses.modalAdd.notesLabel')}</label>
                  <textarea
                    rows={2} value={newCrossData.notas}
                    onChange={e => setNewCrossData({ ...newCrossData, notas: e.target.value })}
                    placeholder={t('crosses.modalAdd.notesPlaceholder')}
                    className="w-full bg-[#F5F1EB]/60 border border-white rounded-[28px] px-6 py-4 text-[14px] font-bold text-[#4A5D4F] placeholder-[#8E877F]/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-4 pb-10">
                  <button
                    onClick={handleSaveCross}
                    disabled={!newCrossData.nombre || !newCrossData.madre_nombre || !newCrossData.padre_nombre || isSaving}
                    className="w-full h-16 bg-[#FF7A59] text-white font-black rounded-full shadow-xl shadow-[#FF7A59]/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-[16px] disabled:opacity-50"
                  >
                    {isSaving ? t('crosses.modalAdd.saving') : t('crosses.modalAdd.saveButton')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      }
      </AnimatePresence>

      {/* Details/Edit Modal */}
      <AnimatePresence>
      {
        selectedCross && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6"
            onClick={() => setSelectedCross(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full max-w-[350px] max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black ${estadoConfig[selectedCross.estado].bg} ${estadoConfig[selectedCross.estado].color}`}>
                  {estadoConfig[selectedCross.estado].label}
                </div>
                <button
                  onClick={() => {
                    if (canViewGenealogy) navigate(`/genealogy/${selectedCross.id}`);
                    else alert(t('crosses.modalDetail.eliteFunction'));
                  }}
                  className="flex items-center gap-2 text-[10px] font-black text-[#A5A98F] bg-[#A5A98F]/10 px-3 py-1.5 rounded-full"
                >
                  {!canViewGenealogy && '🔒'} {t('crosses.modalDetail.tree')}
                </button>
              </div>

              <h2 className="text-[24px] font-black text-[#2E2E2E] mb-1">{selectedCross.nombre}</h2>
              <p className="text-[14px] font-bold text-[#8E877F] italic mb-6">{t('crosses.modalDetail.started')} {new Date(selectedCross.fecha_cruza).toLocaleDateString()}</p>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest uppercase">{t('crosses.modalAdd.nameLabel')}</label>
                    <input
                      type="text"
                      value={editData?.nombre}
                      onChange={e => setEditData(prev => prev ? ({ ...prev, nombre: e.target.value }) : null)}
                      className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[14px] font-bold text-[#4A5D4F] focus:outline-none ring-[#A5A98F]/20 focus:ring-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest flex items-center gap-1"><IconFemale /> {t('crosses.modalAdd.mother')}</label>
                      <div onClick={() => triggerUpload('madre')} className="aspect-square bg-[#F5F1EB] rounded-[24px] relative overflow-hidden cursor-pointer group">
                        {editData?.madre_imagen ? (
                          <img src={editData.madre_imagen} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E877F]"><IconCamera /></div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconCamera />
                        </div>
                      </div>
                      <input
                        value={editData?.madre_nombre}
                        onChange={e => setEditData({ ...editData!, madre_nombre: e.target.value })}
                        className="w-full bg-[#F5F1EB] rounded-xl px-2 py-1 text-[10px] font-bold text-[#4A5D4F]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest flex items-center gap-1"><IconMale /> {t('crosses.modalAdd.father')}</label>
                      <div onClick={() => triggerUpload('padre')} className="aspect-square bg-[#F5F1EB] rounded-[24px] relative overflow-hidden cursor-pointer group">
                        {editData?.padre_imagen ? (
                          <img src={editData.padre_imagen} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E877F]"><IconCamera /></div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconCamera />
                        </div>
                      </div>
                      <input
                        value={editData?.padre_nombre}
                        onChange={e => setEditData({ ...editData!, padre_nombre: e.target.value })}
                        className="w-full bg-[#F5F1EB] rounded-xl px-2 py-1 text-[10px] font-bold text-[#4A5D4F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest">{t('crosses.modalAdd.hybridPhoto').toUpperCase()}</label>
                    <div onClick={() => triggerUpload('hibrido')} className="w-full h-24 bg-[#F5F1EB] rounded-[24px] relative overflow-hidden cursor-pointer group">
                      {editData?.hibrido_imagen ? (
                        <img src={editData.hibrido_imagen} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E877F]"><IconCamera /></div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconCamera />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest">{t('crosses.modalDetail.seedsObtained')}</label>
                      <input
                        type="number" value={editData?.semillas_obtenidas}
                        onChange={e => setEditData({ ...editData!, semillas_obtenidas: Number(e.target.value) })}
                        className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-2 text-[14px] font-bold text-[#4A5D4F]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest">{t('crosses.modalDetail.germinated')}</label>
                      <input
                        type="number" value={editData?.plantas_germinadas}
                        onChange={e => setEditData({ ...editData!, plantas_germinadas: Number(e.target.value) })}
                        className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-2 text-[14px] font-bold text-[#4A5D4F]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-[#8E877F] ml-2 tracking-widest">{t('crosses.modalDetail.status')}</label>
                    <select
                      value={editData?.estado}
                      onChange={e => setEditData({ ...editData!, estado: e.target.value as any })}
                      className="w-full bg-[#F5F1EB] rounded-2xl px-4 py-3 text-[14px] font-bold text-[#4A5D4F] border-none appearance-none"
                    >
                      <option value="en_proceso">{t('crosses.status.inProcess')}</option>
                      <option value="completada">{t('crosses.status.completed')}</option>
                      <option value="fallida">{t('crosses.status.failed')}</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setIsEditing(false); setPendingFiles({}); }} className="flex-1 py-3 bg-[#F5F1EB] rounded-2xl text-[12px] font-black text-[#8E877F]">{t('crosses.modalDetail.cancel')}</button>
                    <button onClick={handleUpdateCross} className="flex-1 py-3 bg-[#FF7A59] rounded-2xl text-[12px] font-black text-white">{isSaving ? '...' : t('crosses.modalDetail.save')}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5F1EB] rounded-2xl flex items-center justify-center overflow-hidden">
                        {selectedCross.madre_imagen ? <img src={selectedCross.madre_imagen} className="w-full h-full object-cover" /> : <IconFemale />}
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-[#8E877F] tracking-widest block opacity-60">♀ {t('crosses.modalAdd.mother')}</span>
                        <span className="text-[12px] font-black text-[#4A5D4F] truncate max-w-[80px] block">{selectedCross.madre_nombre}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F5F1EB] rounded-2xl flex items-center justify-center overflow-hidden">
                        {selectedCross.padre_imagen ? <img src={selectedCross.padre_imagen} className="w-full h-full object-cover" /> : <IconMale />}
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-[#8E877F] tracking-widest block opacity-60">♂ {t('crosses.modalAdd.father')}</span>
                        <span className="text-[12px] font-black text-[#4A5D4F] truncate max-w-[80px] block">{selectedCross.padre_nombre}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCross.hibrido_imagen && (
                    <div className="w-full h-40 bg-[#F5F1EB] rounded-[30px] overflow-hidden border border-white">
                      <img src={selectedCross.hibrido_imagen} className="w-full h-full object-cover" alt="Hybrid" />
                    </div>
                  )}

                  <div className="bg-[#F5F1EB]/50 p-4 rounded-3xl border border-white">
                    <p className="text-[12px] font-bold text-[#8E877F] leading-relaxed italic">"{selectedCross.notas || t('crosses.modalDetail.noNotes')}"</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setIsEditing(true)} className="flex-1 h-12 bg-[#2E2E2E] text-white rounded-full text-[12px] font-black active:scale-95 transition-all">{t('crosses.modalDetail.editResults')}</button>
                    <button onClick={() => { if (window.confirm(t('crosses.modalDetail.confirmDelete'))) { deleteCross(selectedCross.id); setSelectedCross(null); } }} className="w-12 h-12 bg-red-50 text-red-400 rounded-full flex items-center justify-center active:scale-90 transition-all">
                      <IconClose />
                    </button>
                  </div>

                  {selectedCross.estado === 'completada' && (
                    <>
                      {selectedCross.semillas_obtenidas > 0 && (
                        <button
                          onClick={handleTransferToBank}
                          className="w-full mt-3 h-12 bg-[#D3C1A1]/20 text-[#8E7C4B] border border-[#D3C1A1]/40 hover:bg-[#D3C1A1]/30 rounded-full text-[12px] font-black active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">🌰</span> Enviar al Banco de Semillas
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate('/cultivar-gen', { state: { cross: selectedCross } })}
                        className="w-full mt-3 h-12 bg-gradient-to-r from-[#D4AF37] to-[#B39226] text-white rounded-full text-[12px] font-black active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">🏅</span> {t('crosses.modalDetail.registerElite')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )
      }
      </AnimatePresence>

    </div >
  );
};

export default CrossesScreen;
