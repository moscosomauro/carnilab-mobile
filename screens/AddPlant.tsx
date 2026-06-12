import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp, withTimeout } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { hasAccess } from '../utils/planHelpers';
import { Plant } from '../types';
import { compressImage, uploadImage, isOfflineImage } from '../utils/imageHelpers';
import { supabase } from '../supabaseClient';
import { Icon } from '../components/Icon';
import { PlanComparison } from '../components/PlanComparison';
import { PlantSchema, validateData } from '../utils/validationSchemas';

import { SpeciesIcon } from '../components/SpeciesIcon';

const PREDEFINED_SPECIES = new Set([
  "Dionaea muscipula", "Dionaea muscipula 'Akai Ryu'", "Dionaea muscipula 'B52'", "Dionaea muscipula 'King Henry'", "Dionaea muscipula 'Dentate'",
  "Nepenthes alata", "Nepenthes ventricosa", "Nepenthes rafflesiana", "Nepenthes mirabilis", "Nepenthes ampullaria", "Nepenthes bicalcarata", "Nepenthes rajah", "Nepenthes truncata", "Nepenthes hamata", "Nepenthes lowii",
  "Sarracenia purpurea", "Sarracenia flava", "Sarracenia leucophylla", "Sarracenia rubra", "Sarracenia psittacina", "Sarracenia minor", "Sarracenia oreophila",
  "Drosera capensis", "Drosera aliciae", "Drosera binata", "Drosera spatulata", "Drosera rotundifolia", "Drosera adelae", "Drosera burmannii", "Drosera regia",
  "Pinguicula moranensis", "Pinguicula agnata", "Pinguicula esseriana", "Pinguicula grandiflora", "Pinguicula cyclosecta",
  "Utricularia gibba", "Utricularia sandersonii", "Utricularia livida", "Utricularia bisquamata", "Utricularia graminifolia",
  "Cephalotus follicularis",
  "Heliamphora nutans", "Heliamphora minor", "Heliamphora heterodoxa",
  "Darlingtonia californica",
  "Byblis liniflora", "Byblis gigantea",
  "Híbrido Sarracenia", "Híbrido Nepenthes", "Híbrido Drosera", "Otra especie"
]);

// --- CUSTOM SVG ICONS (Kept existing ones plus new ones) ---

const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconCamera = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#A5A29D" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconPrice = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E877F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const LeafDecoration = ({ className }: { className?: string }) => (
  <svg width="80" height="80" viewBox="0 0 100 100" className={className}>
    <g fill="#4A5D4F" fillOpacity="0.05">
      <path d="M50 0 C 60 20 80 30 100 30 C 80 40 60 50 50 100 C 40 50 20 40 0 30 C 20 30 40 20 50 0" />
    </g>
  </svg>
);

interface LocalImage {
  id: string;
  url: string;
  file?: File; // If it's a new upload
  isNew: boolean;
}

const AddPlant: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { addPlant, updatePlant, plants } = useApp();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingPlant = location.state as Plant | undefined;
  const isEditing = !!editingPlant;

  const [formData, setFormData] = useState({
    nombre: '',
    especie: '',
    fecha_adquisicion: new Date().toISOString().split('T')[0],
    origen: '',
    precio: '',
    estado: 'saludable' as 'saludable' | 'regular' | 'critico',
    ubicacion: '',
    notas: '',
    en_venta: false,
    precio_venta: ''
  });

  // New Multi-Image State
  const [images, setImages] = useState<LocalImage[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStep, setSavingStep] = useState(''); // Para mostrar en qué paso estamos
  const [showPlans, setShowPlans] = useState(false);
  const [isCustomSpecies, setIsCustomSpecies] = useState(false);

  // Get unique custom species from user's plants
  const customSpecies = React.useMemo(() => {
    const speciesSet = new Set<string>();
    plants.forEach(p => {
      if (p.especie && !PREDEFINED_SPECIES.has(p.especie)) {
        speciesSet.add(p.especie);
      }
    });
    return Array.from(speciesSet);
  }, [plants]);

  useEffect(() => {
    if (editingPlant) {
      setFormData({
        nombre: editingPlant.nombre,
        especie: editingPlant.especie,
        fecha_adquisicion: editingPlant.fecha_adquisicion || '',
        origen: editingPlant.origen || '',
        precio: editingPlant.precio?.toString() || '',
        estado: editingPlant.estado,
        ubicacion: editingPlant.ubicacion || '',
        notas: editingPlant.notas || '',
        en_venta: !!editingPlant.en_venta,
        precio_venta: editingPlant.precio_venta?.toString() || ''
      });

      // Load existing images
      const initialImages: LocalImage[] = [];

      // 1. Main legacy image
      if (editingPlant.imagen) {
        initialImages.push({ id: 'main', url: editingPlant.imagen, isNew: false });
      }

      // 2. Load extra images if they exist (need to fetch if not passed in location state)
      // For now, we assume location.state might lack full relations, so we might need a fetch?
      // Optimization: We will fetch linked images if we are in editing mode
      const fetchImages = async () => {
        const { data } = await supabase.from('plant_images').select('*').eq('plant_id', editingPlant.id).order('display_order');
        if (data && data.length > 0) {
          const mapped = data.map(img => ({ id: img.id, url: img.image_url, isNew: false }));
          // Deduplicate main image if it was also in plant_images table? 
          // Logic: If we rely on plant_images for V2, we might just load all from there.
          // But for hybrid transition, let's just use the fetched ones if available, otherwise fallback to main.
          setImages(mapped);
        } else if (editingPlant.imagen) {
          // Only legacy image exists
          setImages([{ id: 'legacy', url: editingPlant.imagen, isNew: false }]);
        }
      }
      fetchImages();

    }
  }, [editingPlant]);

  const PLANT_LIMIT_BASIC = 50;
  const isLimitReached = !isEditing && user?.plan === 'basic' && plants.length >= PLANT_LIMIT_BASIC;
  const canSell = hasAccess(user?.plan, 'elite');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Process multiple files
      const newImages: LocalImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const preview = await compressImage(file);
          newImages.push({
            id: `new_${Date.now()}_${i}`,
            url: preview,
            file: file,
            isNew: true
          });
        } catch (err) {
          console.error("Error processing image:", err);
        }
      }

      setImages(prev => [...prev, ...newImages]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idToRemove: string) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
  };


  const handleSave = async () => {
    console.log('[AddPlant] handleSave iniciado');

    if (!isEditing && isLimitReached) {
      console.log('[AddPlant] Limite de plantas alcanzado');
      setShowPlans(true);
      return;
    }
    if (isSaving) {
      console.log('[AddPlant] Ya se esta guardando, ignorando');
      return;
    }
    setIsSaving(true);
    setSavingStep('Validando...');
    console.log('[AddPlant] isSaving = true');

    try {
      // ✅ VALIDACIÓN CON ZOD ANTES DE PROCESAR
      console.log('[AddPlant] Validando datos...');
      const dataToValidate = {
        nombre: formData.nombre,
        especie: formData.especie,
        fecha_adquisicion: formData.fecha_adquisicion,
        origen: formData.origen || '',
        precio: formData.precio ? Number(formData.precio) : null,
        estado: formData.estado,
        ubicacion: formData.ubicacion || '',
        notas: formData.notas || '',
        en_venta: formData.en_venta,
        precio_venta: formData.en_venta && formData.precio_venta ? Number(formData.precio_venta) : null,
      };

      const validation = validateData(PlantSchema, dataToValidate);

      if (!validation.success) {
        console.log('[AddPlant] Validacion fallida:', validation.errors);
        const errorMessage = validation.errors?.join('\n') || t('addPlant.invalidData');
        alert(`❌ ${t('addPlant.validationError')}:\n\n${errorMessage}`);
        setIsSaving(false);
        return;
      }

      console.log('[AddPlant] Validacion OK, subiendo imagenes...', images.length, 'imagenes');

      // 1. Upload new images
      const finalImagesDetails: { url: string }[] = [];
      const newImagesCount = images.filter(img => img.isNew).length;
      let offlineCount = 0; // Contador de imágenes guardadas offline

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log(`[AddPlant] Procesando imagen ${i + 1}/${images.length}:`, img.isNew ? 'NUEVA' : 'EXISTENTE');

        if (img.isNew && img.file && user?.key) {
          try {
            setSavingStep(`Subiendo foto ${i + 1}/${newImagesCount}...`);
            console.log(`[AddPlant] Subiendo imagen ${i + 1}...`);
            const uploadedUrl = await uploadImage(img.file, user.key);
            console.log(`[AddPlant] Imagen ${i + 1} subida:`, uploadedUrl ? 'OK' : 'FALLO');
            if (uploadedUrl) {
              finalImagesDetails.push({ url: uploadedUrl });
              // Verificar si se guardó offline (es base64)
              if (isOfflineImage(uploadedUrl)) {
                offlineCount++;
              }
            }
          } catch (uploadErr) {
            console.error(`[AddPlant] Error subiendo imagen ${i + 1}:`, uploadErr);
            // Continuamos con las demas imagenes
          }
        } else {
          finalImagesDetails.push({ url: img.url });
        }
      }

      // Informar si hay imágenes guardadas offline
      if (offlineCount > 0) {
        console.log(`[AddPlant] ${offlineCount} imagen(es) guardadas offline para sync posterior`);
      }

      // Para la imagen principal, solo usar URL de Supabase (no base64 offline)
      // Las imágenes offline se sincronizan después
      const onlineMainImage = finalImagesDetails.find(img => !isOfflineImage(img.url));
      const mainImageUrl = onlineMainImage?.url || null;

      console.log('[AddPlant] Imagenes procesadas:', finalImagesDetails.length,
        'Online:', finalImagesDetails.filter(img => !isOfflineImage(img.url)).length,
        'Offline:', offlineCount);

      // ✅ Usar datos validados - NO guardar base64 en la BD (es muy grande)
      const plantData = {
        ...validation.data!,
        imagen: mainImageUrl, // Solo URLs de Supabase, no base64
      };

      let success = false;
      let targetPlantId = isEditing && editingPlant ? editingPlant.id : null;

      setSavingStep('Guardando planta...');
      console.log('[AddPlant] Guardando planta...', isEditing ? 'EDICION' : 'NUEVA');

      if (isEditing && editingPlant) {
        success = await updatePlant({ ...plantData, id: editingPlant.id });
        console.log('[AddPlant] updatePlant resultado:', success);
      } else {
        // Create new plant
        const newPlant = await addPlant(plantData);
        console.log('[AddPlant] addPlant resultado:', newPlant);
        if (newPlant) {
          targetPlantId = newPlant.id;
          success = true;
        }
      }

      console.log('[AddPlant] Planta guardada. success:', success, 'targetPlantId:', targetPlantId);

      // 2. Sync `plant_images` table (con manejo de errores)
      if (success && targetPlantId && user?.key) {
        setSavingStep('Sincronizando...');
        try {
          // Strategy: Replace all (Delete all for this plant, insert all current)
          const { error: deleteError } = await withTimeout(
            supabase
              .from('plant_images')
              .delete()
              .eq('plant_id', targetPlantId),
            10000
          ) as any;

          if (deleteError) {
            console.warn('[AddPlant] Error borrando plant_images (puede que la tabla no exista):', deleteError);
            // Continuamos de todas formas - la planta ya se guardo
          }

          // Solo insertar imágenes online (URLs de Supabase), no base64
          const onlineImages = finalImagesDetails.filter(img => !isOfflineImage(img.url));

          if (onlineImages.length > 0) {
            const recordsToInsert = onlineImages.map((img, index) => ({
              plant_id: targetPlantId,
              image_url: img.url,
              display_order: index,
              owner_key: user.key
            }));

            const { error: insertError } = await withTimeout(
              supabase
                .from('plant_images')
                .insert(recordsToInsert),
              10000
            ) as any;

            if (insertError) {
              console.warn('[AddPlant] Error insertando plant_images:', insertError);
              // Continuamos - la planta ya se guardo con la imagen principal
            }
          }
        } catch (imgError) {
          console.warn('[AddPlant] Error en sync de plant_images:', imgError);
          // No bloqueamos - la planta ya esta guardada
        }

        setShowSuccess(true);

        // Si hay imágenes offline, mostrar mensaje informativo
        if (offlineCount > 0) {
          setTimeout(() => {
            alert(`✅ Planta guardada!\n\n📶 ${offlineCount} foto(s) se sincronizarán cuando mejore la conexión.`);
          }, 500);
        }

        setTimeout(() => {
          setShowSuccess(false);
          navigate(-1);
        }, offlineCount > 0 ? 2500 : 1500);
      } else if (!success) {
        // Si fallo el guardado de la planta
        alert(t('addPlant.errorSaving'));
      } else {
        // success pero sin targetPlantId o user.key - raro pero manejamos
        console.warn('[AddPlant] Guardado OK pero sin targetPlantId o user.key');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate(-1);
        }, 1500);
      }

    } catch (e: any) {
      console.error('[AddPlant] Error en handleSave:', e);
      alert("Error al guardar: " + (e.message || 'Error desconocido'));
    } finally {
      console.log('[AddPlant] handleSave finalizado, isSaving = false');
      setIsSaving(false);
      setSavingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] flex justify-center selection:bg-[#6B8E23]/10 font-display lg:bg-transparent">
      {/* Paper texture */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none lg:hidden"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}
      />

      <div className="relative z-10 w-full max-w-[390px] lg:max-w-6xl px-6 pt-10 pb-32 lg:pb-10 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="text-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-[22px] font-bold text-[#2E2E2E] leading-tight tracking-tight">{isEditing ? t('addPlant.titleEdit') : t('addPlant.titleNew')}</h1>
            <p className="text-[11px] text-[#8E877F] font-semibold tracking-wider opacity-80 uppercase">{t('addPlant.subtitle')}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* --- MULTI-IMAGE GALLERY AREA --- */}
        <div className="w-full mb-8 lg:grid lg:grid-cols-2 lg:gap-8">
          <div>
            {/* Main Hero Image (First one) */}
            <div
              className="w-full h-52 lg:h-[400px] bg-white/40 border-2 border-dashed border-[#8E877F]/30 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden shadow-sm mb-4"
              onClick={() => images.length === 0 && fileInputRef.current?.click()}
            >
              {images.length > 0 ? (
                <img src={images[0].url} alt="Main" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center">
                  <LeafDecoration className="absolute -top-4 -right-2 opacity-30 rotate-12" />
                  <IconCamera />
                  <span className="text-[13px] font-bold text-[#8E877F] mt-2">{t('addPlant.addPhoto')}</span>
                </div>
              )}
            </div>

            {/* Thumbnails Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
              {/* Add Button (Mini) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-w-[70px] h-[70px] rounded-2xl bg-white/50 border border-dashed border-[#8E877F]/40 flex items-center justify-center text-[#8E877F] hover:bg-white transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>

              {images.map((img, idx) => (
                <div key={img.id} className="min-w-[70px] h-[70px] rounded-2xl overflow-hidden relative shadow-sm border border-white">
                  <img src={img.url} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <Icon name="close" className="text-[10px]" />
                  </button>
                  {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] text-center font-bold py-0.5">{t('addPlant.cover')}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            {/* Modo Venta Row moved inside grid on desktop */}
            <div className="w-full mb-6 lg:bg-white/40 lg:p-6 lg:rounded-[32px] lg:border lg:border-white">
              <div className="flex items-center justify-between px-1">
                <span className="text-[15px] font-bold text-[#2E2E2E]">{t('addPlant.saleMode')}</span>
                <div className="flex items-center gap-3">
                  {!canSell && <span className="text-[9px] font-bold text-[#FF7A59] opacity-70 uppercase tracking-tighter">{t('addPlant.requiresElite')}</span>}
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E877F]">{t('addPlant.saleActive')}</span>
                  <button
                    onClick={() => canSell && handleChange('en_venta', !formData.en_venta)}
                    className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${formData.en_venta ? 'bg-[#FF7A59]' : 'bg-[#D0CECB]'} ${!canSell && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${formData.en_venta ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {formData.en_venta && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <input
                    type="number"
                    value={formData.precio_venta}
                    onChange={(e) => handleChange('precio_venta', e.target.value)}
                    placeholder={t('addPlant.salePrice')}
                    className="w-full h-12 rounded-full bg-[#FF7A59]/10 border border-[#FF7A59]/30 px-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#FF7A59]/60"
                  />
                </div>
              )}
            </div>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
        </div>

        {/* Main Form Fields */}
        <div className="w-full space-y-3.5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:space-y-3.5">
          <div className="flex gap-3.5">
            <input
              type="text" value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder={t('addPlant.namePlaceholder')} className="flex-1 h-12 rounded-full bg-[#EFEBE4] border border-white px-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3.5 items-center">
              {!isCustomSpecies ? (
                <select
                  value={formData.especie}
                  onChange={(e) => {
                    if (e.target.value === '--new--') {
                      setIsCustomSpecies(true);
                      handleChange('especie', '');
                    } else {
                      handleChange('especie', e.target.value);
                    }
                  }}
                  className="flex-1 h-12 rounded-full bg-[#EFEBE4] border border-white px-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none appearance-none cursor-pointer"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%238E877F\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="">{t('addPlant.speciesSelect')}</option>
                  
                  <option value="--new--" className="font-bold text-[#6B8E23]">✨ Añadir propia especie o híbrido...</option>

                  {customSpecies.length > 0 && (
                    <optgroup label="Mis Especies e Híbridos">
                      {customSpecies.map(sp => (
                        <option key={sp} value={sp}>{sp}</option>
                      ))}
                    </optgroup>
                  )}

                  {/* Dionaea (Venus Atrapamoscas) */}
                  <optgroup label="Dionaea (Venus Atrapamoscas)">
                    <option value="Dionaea muscipula">Dionaea muscipula (Clásica)</option>
                    <option value="Dionaea muscipula 'Akai Ryu'">Dionaea muscipula 'Akai Ryu' (Dragón Rojo)</option>
                    <option value="Dionaea muscipula 'B52'">Dionaea muscipula 'B52'</option>
                    <option value="Dionaea muscipula 'King Henry'">Dionaea muscipula 'King Henry'</option>
                    <option value="Dionaea muscipula 'Dentate'">Dionaea muscipula 'Dentate'</option>
                  </optgroup>

                  {/* Nepenthes (Plantas Jarro) */}
                  <optgroup label="Nepenthes (Plantas Jarro)">
                    <option value="Nepenthes alata">Nepenthes alata</option>
                    <option value="Nepenthes ventricosa">Nepenthes ventricosa</option>
                    <option value="Nepenthes rafflesiana">Nepenthes rafflesiana</option>
                    <option value="Nepenthes mirabilis">Nepenthes mirabilis</option>
                    <option value="Nepenthes ampullaria">Nepenthes ampullaria</option>
                    <option value="Nepenthes bicalcarata">Nepenthes bicalcarata</option>
                    <option value="Nepenthes rajah">Nepenthes rajah (Gigante)</option>
                    <option value="Nepenthes truncata">Nepenthes truncata</option>
                    <option value="Nepenthes hamata">Nepenthes hamata</option>
                    <option value="Nepenthes lowii">Nepenthes lowii</option>
                  </optgroup>

                  {/* Sarracenia (Trompetas) */}
                  <optgroup label="Sarracenia (Trompetas)">
                    <option value="Sarracenia purpurea">Sarracenia purpurea (Púrpura)</option>
                    <option value="Sarracenia flava">Sarracenia flava (Amarilla)</option>
                    <option value="Sarracenia leucophylla">Sarracenia leucophylla (Blanca)</option>
                    <option value="Sarracenia rubra">Sarracenia rubra (Roja)</option>
                    <option value="Sarracenia psittacina">Sarracenia psittacina (Loro)</option>
                    <option value="Sarracenia minor">Sarracenia minor</option>
                    <option value="Sarracenia oreophila">Sarracenia oreophila</option>
                  </optgroup>

                  {/* Drosera (Rocío de Sol) */}
                  <optgroup label="Drosera (Rocío de Sol)">
                    <option value="Drosera capensis">Drosera capensis (Cabo)</option>
                    <option value="Drosera aliciae">Drosera aliciae</option>
                    <option value="Drosera binata">Drosera binata (Bifurcada)</option>
                    <option value="Drosera spatulata">Drosera spatulata</option>
                    <option value="Drosera rotundifolia">Drosera rotundifolia</option>
                    <option value="Drosera adelae">Drosera adelae</option>
                    <option value="Drosera burmannii">Drosera burmannii</option>
                    <option value="Drosera regia">Drosera regia (Reina)</option>
                  </optgroup>

                  {/* Pinguicula (Grasilla) */}
                  <optgroup label="Pinguicula (Grasilla)">
                    <option value="Pinguicula moranensis">Pinguicula moranensis</option>
                    <option value="Pinguicula agnata">Pinguicula agnata</option>
                    <option value="Pinguicula esseriana">Pinguicula esseriana</option>
                    <option value="Pinguicula grandiflora">Pinguicula grandiflora</option>
                    <option value="Pinguicula cyclosecta">Pinguicula cyclosecta</option>
                  </optgroup>

                  {/* Utricularia (Vejiga) */}
                  <optgroup label="Utricularia (Vejiga)">
                    <option value="Utricularia gibba">Utricularia gibba</option>
                    <option value="Utricularia sandersonii">Utricularia sandersonii (Conejo Azul)</option>
                    <option value="Utricularia livida">Utricularia livida</option>
                    <option value="Utricularia bisquamata">Utricularia bisquamata</option>
                    <option value="Utricularia graminifolia">Utricularia graminifolia</option>
                  </optgroup>

                  {/* Cephalotus (Jarro Australiano) */}
                  <optgroup label="Cephalotus">
                    <option value="Cephalotus follicularis">Cephalotus follicularis (Jarro Australiano)</option>
                  </optgroup>

                  {/* Heliamphora (Jarro de Sol) */}
                  <optgroup label="Heliamphora (Jarro de Sol)">
                    <option value="Heliamphora nutans">Heliamphora nutans</option>
                    <option value="Heliamphora minor">Heliamphora minor</option>
                    <option value="Heliamphora heterodoxa">Heliamphora heterodoxa</option>
                  </optgroup>

                  {/* Darlingtonia (Planta Cobra) */}
                  <optgroup label="Darlingtonia">
                    <option value="Darlingtonia californica">Darlingtonia californica (Planta Cobra)</option>
                  </optgroup>

                  {/* Byblis (Arcoíris) */}
                  <optgroup label="Byblis (Arcoíris)">
                    <option value="Byblis liniflora">Byblis liniflora</option>
                    <option value="Byblis gigantea">Byblis gigantea</option>
                  </optgroup>

                  {/* Otras / Híbridos */}
                  <optgroup label="Otras / Híbridos">
                    <option value="Híbrido Sarracenia">Híbrido Sarracenia</option>
                    <option value="Híbrido Nepenthes">Híbrido Nepenthes</option>
                    <option value="Híbrido Drosera">Híbrido Drosera</option>
                    <option value="Otra especie">Otra especie</option>
                  </optgroup>
                </select>
              ) : (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    autoFocus
                    type="text"
                    value={formData.especie}
                    onChange={(e) => handleChange('especie', e.target.value)}
                    placeholder="Escribe la especie o híbrido..."
                    className="flex-1 h-12 rounded-full bg-[#EFEBE4] border border-[#6B8E23] px-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60 focus:ring-2 focus:ring-[#6B8E23]/20"
                  />
                  <button 
                    onClick={() => {
                      setIsCustomSpecies(false);
                      handleChange('especie', '');
                    }}
                    className="w-12 h-12 rounded-full bg-white border border-[#8E877F]/20 flex items-center justify-center text-[#8E877F] active:scale-95 transition-transform"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              )}

              {/* Preview Icon */}
              {formData.especie && (
                <div className="w-12 h-12 rounded-xl bg-white border border-[#8E877F]/20 flex items-center justify-center shadow-sm flex-shrink-0">
                  <SpeciesIcon key={formData.especie} species={formData.especie} size={40} />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3.5">
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-5 text-[#8E877F]"><IconCalendar /></div>
              <input
                type="date" value={formData.fecha_adquisicion} onChange={(e) => handleChange('fecha_adquisicion', e.target.value)}
                className="w-full h-12 rounded-full bg-[#EFEBE4] border border-white pl-12 pr-4 text-[12px] font-bold text-[#2E2E2E] shadow-sm outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3.5">
            <div className="flex-1 relative flex items-center">
              <div className="absolute left-5 text-[#8E877F]"><IconPrice /></div>
              <input
                type="number" value={formData.precio} onChange={(e) => handleChange('precio', e.target.value)}
                placeholder={t('addPlant.costPlaceholder')} className="w-full h-12 rounded-full bg-[#EFEBE4] border border-white pl-12 pr-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60"
              />
            </div>
          </div>

          <input
            type="text" value={formData.origen} onChange={(e) => handleChange('origen', e.target.value)}
            placeholder={t('addPlant.originPlaceholder')} className="w-full h-12 rounded-full bg-[#EFEBE4] border border-white px-6 text-[14px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60"
          />

          <div className="flex gap-3.5 h-12">
            <input
              type="text" value={formData.ubicacion} onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder={t('addPlant.locationPlaceholder')} className="flex-1 h-12 rounded-full bg-[#EFEBE4] border border-white px-6 text-[13px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60"
            />
          </div>

          {/* Biological State */}
          <div className="pt-2 lg:col-span-2">
            <span className="text-[12px] font-bold text-[#2E2E2E] mb-3 block uppercase tracking-widest opacity-60">{t('addPlant.statusLabel')}</span>
            <div className="flex gap-3">
              {[
                { id: 'saludable', label: t('addPlant.status.healthy'), bg: 'bg-[#CDE8B5]', act: 'border-[#6B8E23] ring-2 ring-[#6B8E23]/20' },
                { id: 'regular', label: t('addPlant.status.regular'), bg: 'bg-[#F2E8D5]', act: 'border-[#B8A46B] ring-2 ring-[#B8A46B]/20' },
                { id: 'critico', label: t('addPlant.status.critical'), bg: 'bg-[#F2D5D5]', act: 'border-[#A33D3D] ring-2 ring-[#A33D3D]/20' }
              ].map(s => (
                <button
                  key={s.id} onClick={() => handleChange('estado', s.id)}
                  className={`flex-1 py-3.5 rounded-[22px] text-[12px] font-black transition-all border-2 ${formData.estado === s.id ? `${s.act} scale-95` : 'border-transparent opacity-85'} ${s.bg} text-[#4A5D4F]`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <input
              type="text" value={formData.notas} onChange={(e) => handleChange('notas', e.target.value)}
              placeholder={t('addPlant.notesPlaceholder')} className="w-full h-12 rounded-full bg-[#EFEBE4] border border-white px-6 text-[13px] font-bold text-[#2E2E2E] shadow-sm outline-none placeholder-[#8E877F]/60"
            />
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center bg-transparent pointer-events-none lg:relative lg:p-0 lg:mt-10 lg:pb-10">
          <button
            onClick={handleSave}
            disabled={!formData.nombre || !formData.especie || isSaving}
            className="w-full max-w-[342px] lg:max-w-md h-[58px] bg-[#FF7A59] text-white font-black text-lg 
                       rounded-full shadow-[0_12px_40px_rgba(255,122,89,0.35)] 
                       active:scale-95 transition-all disabled:opacity-50 
                       flex items-center justify-center gap-3 pointer-events-auto"
          >
            {isSaving ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">{savingStep || 'Guardando...'}</span>
              </div>
            ) : t('addPlant.saveButton')}
          </button>
        </div>

        {/* Success Feedback Overlay */}
        {showSuccess && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-in fade-in duration-300">
            <div className="bg-[#6B8E23] w-24 h-24 rounded-full flex items-center justify-center shadow-2xl scale-[1.3] animate-in zoom-in duration-300">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showPlans && user && (
          <PlanComparison currentPlan={user.plan} onClose={() => setShowPlans(false)} />
        )}

      </div>
    </div>
  );
};

export default AddPlant;