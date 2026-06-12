import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Cross, CrossAnalysis, GeneticAnalysisResult } from '../types';
import { compressImage } from '../utils/imageHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// --- ICONOS SVG ---
const IconBack = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const IconDNA = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 15c6.667-6 13.333 0 20-6" />
    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
    <path d="M17 6l-2.5-2.5" />
    <path d="M14 8l-1-1" />
    <path d="M7 18l2.5 2.5" />
    <path d="M3.5 14.5l.5.5" />
    <path d="M20.5 9.5l.5.5" />
    <path d="M10 16l1 1" />
    <path d="M2 9c6.667 6 13.333 0 20 6" />
  </svg>
);

const IconFlask = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6" />
    <path d="M10 9V3" />
    <path d="M14 9V3" />
    <path d="M6 21h12" />
    <path d="M6 21a2 2 0 0 1-2-2v-1a2 2 0 0 1 .586-1.414l3.828-3.828A2 2 0 0 0 9 11.344V9" />
    <path d="M18 21a2 2 0 0 0 2-2v-1a2 2 0 0 0-.586-1.414l-3.828-3.828A2 2 0 0 1 15 11.344V9" />
  </svg>
);

const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const IconSparkles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M19 17v4" />
    <path d="M17 19h4" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Componente de barra de progreso de color
const ColorBar = ({ percentage, color }: { percentage: number; color: string }) => (
  <div className="w-full h-3 bg-[#F5F1EB] rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${percentage}%`, backgroundColor: color }}
    />
  </div>
);

// Mapeo de colores para análisis
const colorMap: Record<string, string> = {
  red: '#DC2626',
  green: '#16A34A',
  mixed: '#CA8A04',
};

const trapSizeLabels: Record<string, string> = {
  miniature: 'Miniatura',
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande',
  giant: 'Gigante',
};

const LabScreen: React.FC = () => {
  useTranslation(); // Available for future i18n
  const navigate = useNavigate();
  const { crosses } = useApp();
  const { user } = useAuth();

  const [selectedCross, setSelectedCross] = useState<Cross | null>(null);
  const [showCrossSelector, setShowCrossSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeneticAnalysisResult | null>(null);
  const [, setAnalysisHistory] = useState<CrossAnalysis[]>([]); // TODO: Show history UI
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtrar cruzas completadas o en proceso
  const availableCrosses = useMemo(() =>
    crosses.filter(c => c.estado === 'completada' || c.estado === 'en_proceso'),
    [crosses]
  );

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setSelectedImage(compressed);
        setAnalysisResult(null);
        setError(null);
      } catch (err: any) {
        setError('Error al procesar la imagen');
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Selecciona una imagen primero');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Construir info de parentales si hay cruza seleccionada
      let parentInfo = '';
      if (selectedCross) {
        parentInfo = `Madre: ${selectedCross.madre_nombre} (${selectedCross.madre_especie}), Padre: ${selectedCross.padre_nombre} (${selectedCross.padre_especie})`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-cross`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_base64: selectedImage,
            cross_id: selectedCross?.id || null,
            cross_name: selectedCross?.nombre || null,
            parent_info: parentInfo || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el análisis');
      }

      setAnalysisResult(data.analysis);

      // Agregar al historial local
      if (data.saved_id) {
        setAnalysisHistory(prev => [{
          id: data.saved_id,
          cross_id: selectedCross?.id || 0,
          owner_key: user?.key || '',
          image_url: selectedImage,
          image_type: 'progeny',
          analysis_result: data.analysis,
          confidence_score: data.analysis.confidence || 0.8,
          model_used: data.model,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev]);
      }

    } catch (err: any) {
      console.error('Error analyzing:', err);
      setError(err.message || 'Error al analizar la imagen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center select-none overflow-x-hidden lg:bg-transparent">
      {/* Paper texture overlay */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-50 lg:hidden" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

      <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />

      {/* Header */}
      <div className="w-full max-w-[390px] lg:max-w-4xl px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform">
            <IconBack />
          </button>
          <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
            <IconSparkles />
            <span className="text-xs font-black text-purple-700">IA VISION</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <IconFlask />
          </div>
          <div>
            <h1 className="text-[28px] font-black text-[#2E2E2E] leading-tight">Gen Lab</h1>
            <p className="text-[13px] font-bold text-[#8E877F] italic">Análisis genético con IA</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[390px] lg:max-w-4xl px-6 pb-32 space-y-6">

        {/* Cross Selector */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-white">
          <label className="text-[11px] font-black text-[#8E877F] tracking-widest uppercase mb-3 block">
            Cruza a Analizar (Opcional)
          </label>
          <button
            onClick={() => setShowCrossSelector(true)}
            className="w-full bg-[#F5F1EB] rounded-2xl px-5 py-4 flex items-center justify-between text-left"
          >
            {selectedCross ? (
              <div>
                <span className="text-[14px] font-black text-[#2E2E2E] block">{selectedCross.nombre}</span>
                <span className="text-[11px] font-bold text-[#8E877F]">
                  ♀ {selectedCross.madre_nombre} × ♂ {selectedCross.padre_nombre}
                </span>
              </div>
            ) : (
              <span className="text-[14px] font-bold text-[#8E877F]/60">Selecciona una cruza...</span>
            )}
            <IconChevronDown />
          </button>
        </div>

        {/* Image Upload Area */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-white">
          <label className="text-[11px] font-black text-[#8E877F] tracking-widest uppercase mb-3 block">
            Foto de Progenie
          </label>

          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Progenie"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <button
                onClick={resetAnalysis}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
              >
                <IconClose />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 bg-[#F5F1EB] rounded-2xl border-2 border-dashed border-[#D4CFC7] flex flex-col items-center justify-center gap-3 hover:bg-[#EDE9E3] transition-colors"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-[#8E877F]">
                <IconCamera />
              </div>
              <div className="text-center">
                <span className="text-[14px] font-black text-[#4A5D4F] block">Subir Foto</span>
                <span className="text-[11px] font-bold text-[#8E877F]">JPG, PNG hasta 10MB</span>
              </div>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <span className="text-[13px] font-bold text-red-600">{error}</span>
          </div>
        )}

        {/* Analyze Button */}
        {selectedImage && !analysisResult && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black rounded-full shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all text-[16px] disabled:opacity-70"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <IconSparkles />
                Analizar Genética
              </>
            )}
          </button>
        )}

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Confidence Badge */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-purple-100 to-purple-50 px-6 py-2 rounded-full border border-purple-200">
                  <span className="text-[12px] font-black text-purple-700">
                    Confianza: {Math.round((analysisResult.confidence || 0.8) * 100)}%
                  </span>
                </div>
              </div>

              {/* Coloration Card */}
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-white">
                <h3 className="text-[11px] font-black text-[#8E877F] tracking-widest uppercase mb-4">Coloración</h3>
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-12 h-12 rounded-2xl"
                    style={{ backgroundColor: colorMap[analysisResult.coloration.dominant] || '#888' }}
                  />
                  <div className="flex-1">
                    <span className="text-[18px] font-black text-[#2E2E2E] capitalize block">
                      {analysisResult.coloration.dominant === 'red' ? 'Rojo' :
                        analysisResult.coloration.dominant === 'green' ? 'Verde' : 'Mixto'}
                    </span>
                    <span className="text-[12px] font-bold text-[#8E877F]">
                      {analysisResult.coloration.percentage}% dominancia
                    </span>
                  </div>
                </div>
                <ColorBar
                  percentage={analysisResult.coloration.percentage}
                  color={colorMap[analysisResult.coloration.dominant] || '#888'}
                />
                <p className="text-[12px] font-medium text-[#8E877F] mt-3 italic">
                  {analysisResult.coloration.description}
                </p>
              </div>

              {/* Trap & Teeth Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white">
                  <h3 className="text-[9px] font-black text-[#8E877F] tracking-widest uppercase mb-2">Tamaño Trampa</h3>
                  <span className="text-[24px] font-black text-[#4A5D4F] block">
                    {analysisResult.trap_size.estimated_cm}cm
                  </span>
                  <span className="text-[11px] font-bold text-[#8E877F]">
                    {trapSizeLabels[analysisResult.trap_size.category] || analysisResult.trap_size.category}
                  </span>
                </div>
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white">
                  <h3 className="text-[9px] font-black text-[#8E877F] tracking-widest uppercase mb-2">Dientes</h3>
                  <span className="text-[18px] font-black text-[#4A5D4F] capitalize block">
                    {analysisResult.teeth_shape.type === 'short' ? 'Cortos' :
                      analysisResult.teeth_shape.type === 'long' ? 'Largos' :
                        analysisResult.teeth_shape.type === 'fused' ? 'Fusionados' : 'Medios'}
                  </span>
                  <span className="text-[10px] font-bold text-[#8E877F]">
                    {analysisResult.teeth_shape.description}
                  </span>
                </div>
              </div>

              {/* Vigor & Anthocyanins */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white">
                  <h3 className="text-[9px] font-black text-[#8E877F] tracking-widest uppercase mb-2">Vigor</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-[32px] font-black text-[#4A5D4F] leading-none">
                      {analysisResult.vigor.score}
                    </span>
                    <span className="text-[14px] font-bold text-[#8E877F] pb-1">/10</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#8E877F] capitalize">
                    {analysisResult.vigor.level === 'high' ? 'Alto' :
                      analysisResult.vigor.level === 'low' ? 'Bajo' : 'Medio'}
                  </span>
                </div>
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-white">
                  <h3 className="text-[9px] font-black text-[#8E877F] tracking-widest uppercase mb-2">Antocianinas</h3>
                  <div className={`w-10 h-10 rounded-full mb-2 ${analysisResult.anthocyanins.present
                      ? 'bg-gradient-to-br from-red-500 to-purple-600'
                      : 'bg-[#F5F1EB]'
                    }`} />
                  <span className="text-[11px] font-bold text-[#8E877F]">
                    {analysisResult.anthocyanins.present ? (
                      analysisResult.anthocyanins.intensity === 'strong' ? 'Intensa' :
                        analysisResult.anthocyanins.intensity === 'moderate' ? 'Moderada' : 'Ligera'
                    ) : 'Ausente'}
                  </span>
                </div>
              </div>

              {/* Traits */}
              {analysisResult.traits && analysisResult.traits.length > 0 && (
                <div className="bg-white rounded-[28px] p-6 shadow-sm border border-white">
                  <h3 className="text-[11px] font-black text-[#8E877F] tracking-widest uppercase mb-4">
                    Rasgos Identificados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.traits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="bg-[#CDE8B5] text-[#2b422e] px-4 py-2 rounded-full text-[12px] font-black"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Analysis */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-[28px] p-6 shadow-sm border border-purple-100">
                <h3 className="text-[11px] font-black text-purple-600 tracking-widest uppercase mb-3 flex items-center gap-2">
                  <IconDNA /> Análisis Detallado
                </h3>
                <p className="text-[13px] font-medium text-[#4A5D4F] leading-relaxed whitespace-pre-line">
                  {analysisResult.raw_analysis}
                </p>
              </div>

              {/* New Analysis Button */}
              <button
                onClick={resetAnalysis}
                className="w-full h-14 bg-[#2E2E2E] text-white font-black rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <IconCamera />
                Nuevo Análisis
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / Instructions */}
        {!selectedImage && !analysisResult && (
          <div className="bg-white/60 rounded-[28px] p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
              <IconDNA />
            </div>
            <h3 className="text-[16px] font-black text-[#2E2E2E] mb-2">¿Cómo funciona?</h3>
            <ol className="text-[13px] font-medium text-[#8E877F] text-left space-y-3 max-w-xs mx-auto">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-black text-[11px] shrink-0">1</span>
                <span>Selecciona una cruza existente (opcional pero recomendado)</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-black text-[11px] shrink-0">2</span>
                <span>Sube una foto clara de la planta progenie</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-black text-[11px] shrink-0">3</span>
                <span>La IA analizará coloración, tamaño, dientes y más</span>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Cross Selector Modal */}
      <AnimatePresence>
        {showCrossSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center lg:items-center p-0 lg:p-6"
            onClick={() => setShowCrossSelector(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-[390px] max-h-[70vh] rounded-t-[40px] lg:rounded-[40px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#F5F1EB]">
                <div className="flex justify-between items-center">
                  <h2 className="text-[18px] font-black text-[#2E2E2E]">Seleccionar Cruza</h2>
                  <button onClick={() => setShowCrossSelector(false)} className="w-10 h-10 bg-[#F5F1EB] rounded-full flex items-center justify-center">
                    <IconClose />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[50vh] p-4 space-y-3">
                {/* Option: None */}
                <button
                  onClick={() => { setSelectedCross(null); setShowCrossSelector(false); }}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${!selectedCross ? 'bg-purple-100 border-2 border-purple-300' : 'bg-[#F5F1EB] border-2 border-transparent'
                    }`}
                >
                  <span className="text-[14px] font-black text-[#8E877F]">Sin cruza específica</span>
                  <span className="text-[11px] font-bold text-[#8E877F]/60 block">Analizar planta sin contexto de cruza</span>
                </button>

                {availableCrosses.map(cross => (
                  <button
                    key={cross.id}
                    onClick={() => { setSelectedCross(cross); setShowCrossSelector(false); }}
                    className={`w-full p-4 rounded-2xl text-left transition-all ${selectedCross?.id === cross.id ? 'bg-purple-100 border-2 border-purple-300' : 'bg-[#F5F1EB] border-2 border-transparent'
                      }`}
                  >
                    <span className="text-[14px] font-black text-[#2E2E2E] block">{cross.nombre}</span>
                    <span className="text-[11px] font-bold text-[#8E877F]">
                      ♀ {cross.madre_nombre} × ♂ {cross.padre_nombre}
                    </span>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[9px] font-black text-[#8E877F] bg-white px-2 py-1 rounded-full">
                        {cross.semillas_obtenidas} semillas
                      </span>
                      <span className="text-[9px] font-black text-[#8E877F] bg-white px-2 py-1 rounded-full">
                        {cross.plantas_germinadas} germinadas
                      </span>
                    </div>
                  </button>
                ))}

                {availableCrosses.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-[14px] font-bold text-[#8E877F]">No tienes cruzas registradas</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabScreen;
