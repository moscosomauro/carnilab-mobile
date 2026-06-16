import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Cross, GeneticAnalysisResult } from '../types';
import { compressImage } from '../utils/imageHelpers';
import { analyzeCrossImage } from '../utils/geminiHelpers';
import { AssetIcon } from '../components/AssetIcon';
import {
  Sparkles, ChevronDown, ImagePlus, X, Dna, FlaskConical, CheckCircle2,
  PackagePlus, Pencil, Microscope, Wand2, RefreshCw, TrendingUp
} from 'lucide-react';

const NAME_SUGGESTIONS: Record<string, { name: string; desc: string }[]> = {
  red: [
    { name: 'Scarlet Obsidian', desc: 'Elegancia profunda' }, { name: 'Crimson Veil', desc: 'Velo intenso' },
    { name: 'Borgoña Royale', desc: 'Realeza natural' }, { name: 'Maroon Lace', desc: 'Reticulado noble' }, { name: 'Vino Sagrado', desc: 'Tono litúrgico' },
  ],
  green: [{ name: 'Esmeralda Viva', desc: 'Verdor vibrante' }, { name: 'Jade Silvestre', desc: 'Naturaleza pura' }, { name: 'Verde Sereno', desc: 'Calma vegetal' }],
  mixed: [{ name: 'Aurora Híbrida', desc: 'Transición de color' }, { name: 'Bicolor Real', desc: 'Doble expresión' }, { name: 'Ocaso Carmesí', desc: 'Degradado cálido' }],
};

const trapPct: Record<string, number> = { miniature: 20, small: 40, medium: 60, large: 80, giant: 100 };
const anthoPct: Record<string, number> = { none: 0, light: 33, moderate: 66, strong: 100 };

const LabScreen: React.FC = () => {
  const navigate = useNavigate();
  const { crosses, addSeedBatch } = useApp();
  const { user } = useAuth();

  const [selectedCross, setSelectedCross] = useState<Cross | null>(null);
  const [showCrossSel, setShowCrossSel] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<GeneticAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [editNotas, setEditNotas] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const availableCrosses = useMemo(() => crosses.filter(c => c.estado === 'completada' || c.estado === 'en_proceso'), [crosses]);

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { try { setImage(await compressImage(f)); setResult(null); setError(null); } catch { setError('Error al procesar la imagen'); } }
    if (e.target) e.target.value = '';
  };

  const analyze = async () => {
    if (!image) { setError('Selecciona una imagen primero'); return; }
    setAnalyzing(true); setError(null);
    try {
      const parentInfo = selectedCross ? `Madre: ${selectedCross.madre_nombre} (${selectedCross.madre_especie}), Padre: ${selectedCross.padre_nombre} (${selectedCross.padre_especie})` : null;
      const r = await analyzeCrossImage(image, selectedCross?.nombre || null, parentInfo);
      setResult(r); setNotas(r.raw_analysis?.slice(0, 240) || '');
    } catch (e: any) { setError(e.message || 'Error al analizar la imagen'); }
    finally { setAnalyzing(false); }
  };

  const reset = () => { setImage(null); setResult(null); setError(null); };

  const transfer = async () => {
    if (!selectedCross) { alert('Selecciona una cruza para transferir su cosecha'); return; }
    const cant = selectedCross.semillas_obtenidas || 0;
    if (cant <= 0) { alert('La cruza seleccionada no tiene semillas registradas'); return; }
    const r = await addSeedBatch({ nombre: `${selectedCross.nombre} (Cosecha)`, especie: selectedCross.madre_especie || '', cantidad: cant, fecha_ingreso: new Date().toISOString(), origen: 'propia', cross_id: selectedCross.id, estado: 'almacenada', notas: `Transferido desde Gen Lab · ${selectedCross.nombre}` } as any);
    if (r) navigate('/seed-bank');
  };

  const bars = useMemo(() => {
    if (!result) return [];
    return [
      { label: 'Coloración (intensidad)', pct: result.coloration.percentage },
      { label: 'Vigor', pct: Math.round((result.vigor.score / 10) * 100) },
      { label: 'Tamaño de trampa', pct: trapPct[result.trap_size.category] ?? 50 },
      { label: 'Antocianinas', pct: result.anthocyanins.present ? (anthoPct[result.anthocyanins.intensity] ?? 50) : 0 },
      { label: 'Confianza del análisis', pct: Math.round((result.confidence || 0.8) * 100) },
    ];
  }, [result]);

  const suggestions = result ? (NAME_SUGGESTIONS[result.coloration.dominant] || NAME_SUGGESTIONS.mixed) : [];
  const scenarios = result ? [
    { title: 'Resistencia al calor', pct: Math.min(95, 40 + result.vigor.score * 5), desc: 'Basado en el vigor observado en la progenie.' },
    { title: 'Expresión de color intensa', pct: result.coloration.percentage, desc: `Dominancia ${result.coloration.dominant === 'red' ? 'roja' : result.coloration.dominant === 'green' ? 'verde' : 'mixta'} marcada.` },
    { title: 'Vigor híbrido', pct: Math.round((result.vigor.score / 10) * 100), desc: 'Potencial de crecimiento por encima del promedio.' },
  ] : [];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      <input type="file" ref={fileRef} onChange={onImage} className="hidden" accept="image/*" />

      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-genlab" size={26} /></div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">Gen Lab</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Análisis genético y fenotípico de tu progenie con IA</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 rounded-full px-3 py-1.5 text-[12px] font-bold"><Sparkles size={14} /> IA Vision</span>
        {result && <button onClick={reset} className="flex items-center gap-2 bg-app-card border border-app-border rounded-full px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-app-bg"><RefreshCw size={14} /> Analizar nueva imagen</button>}
      </div>

      {!result ? (
        /* ===== Estado inicial: subir + analizar ===== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark/45 mb-2">Cruza a analizar (opcional)</p>
            <button onClick={() => setShowCrossSel(true)} className="w-full flex items-center justify-between bg-app-bg/60 border border-app-border rounded-xl px-4 py-3 text-left mb-4 hover:bg-app-bg">
              {selectedCross ? <div><p className="text-[13.5px] font-bold text-brand-dark">{selectedCross.nombre}</p><p className="text-[11px] text-brand-dark/50">♀ {selectedCross.madre_nombre} × ♂ {selectedCross.padre_nombre}</p></div> : <span className="text-[13.5px] text-brand-dark/40">Selecciona una cruza…</span>}
              <ChevronDown size={16} className="text-brand-dark/40" />
            </button>

            <p className="text-[11px] font-black uppercase tracking-wider text-brand-dark/45 mb-2">Foto de progenie</p>
            {image ? (
              <div className="relative rounded-xl overflow-hidden border border-app-border">
                <img src={image} alt="" className="w-full h-64 object-cover" />
                <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-56 rounded-xl border-2 border-dashed border-app-border flex flex-col items-center justify-center gap-2 text-brand-dark/40 hover:bg-app-bg hover:border-brand-primary/30 transition-colors">
                <ImagePlus size={28} /><span className="text-[13px] font-semibold">Subir foto de la progenie</span><span className="text-[11px] text-brand-dark/30">JPG, PNG · 10 MB</span>
              </button>
            )}

            {error && <p className="mt-3 text-[12.5px] font-semibold text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

            {image && (
              <button onClick={analyze} disabled={analyzing} className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl py-3 text-[14px] font-bold shadow-md shadow-violet-600/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-60">
                {analyzing ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analizando con IA…</> : <><Sparkles size={16} /> Analizar genética</>}
              </button>
            )}
          </div>

          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4"><Microscope size={24} /></div>
            <h3 className="font-accent text-[20px] font-bold text-brand-dark mb-3">¿Cómo funciona?</h3>
            <ol className="space-y-3">
              {['Selecciona una cruza existente (opcional pero recomendado).', 'Sube una foto clara de la planta progenie.', 'La IA analiza coloración, tamaño, reticulado, vigor y más.'].map((t, i) => (
                <li key={i} className="flex gap-3 text-[13px] text-brand-dark/65"><span className="w-6 h-6 rounded-full bg-[#C9A24B]/15 text-[#9a7b2f] font-black text-[11px] flex items-center justify-center shrink-0">{i + 1}</span> {t}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        /* ===== Resultados ===== */
        <>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Izquierda: imagen + resumen */}
            <div className="xl:col-span-4 space-y-5">
              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-black uppercase tracking-wider text-brand-primary flex items-center gap-2"><span className="text-[#C9A24B]"><ImagePlus size={14} /></span> Imagen de la progenie</p>
                  <button onClick={() => fileRef.current?.click()} className="text-[11px] font-bold text-brand-primary/70 hover:text-brand-primary flex items-center gap-1"><RefreshCw size={12} /> Reemplazar</button>
                </div>
                <div className="rounded-xl overflow-hidden border border-app-border"><img src={image!} alt="" className="w-full h-56 object-cover" /></div>
                <div className="flex items-center justify-between mt-3 text-[11.5px]">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold"><CheckCircle2 size={13} /> Imagen procesada correctamente</span>
                  <span className="text-brand-dark/40">Analizada el {new Date().toLocaleDateString('es-AR')}</span>
                </div>
              </div>

              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <h3 className="flex items-center gap-2 font-accent text-[18px] font-bold text-brand-dark mb-2"><Dna size={18} className="text-[#C9A24B]" /> Resumen fenotípico</h3>
                <p className="text-[13px] text-brand-dark/65 leading-relaxed whitespace-pre-line">{result.raw_analysis}</p>
                {result.traits?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.traits.map((t, i) => <span key={i} className="bg-[#C9A24B]/12 text-brand-dark/70 rounded-full px-2.5 py-1 text-[11px] font-semibold">{t}</span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Medio: rasgos + sugerencias */}
            <div className="xl:col-span-4 space-y-5">
              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-4"><span className="text-[#C9A24B]"><TrendingUp size={14} /></span> Rasgos detectados por IA</h3>
                <div className="space-y-3">
                  {bars.map(b => (
                    <div key={b.label}>
                      <div className="flex items-center justify-between mb-1"><span className="text-[12px] text-brand-dark/60">{b.label}</span><span className="text-[12px] font-bold text-brand-dark">{b.pct}%</span></div>
                      <div className="h-2 rounded-full bg-app-bg overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#C9A24B] to-brand-primary" style={{ width: `${b.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3"><span className="text-[#C9A24B]"><Wand2 size={14} /></span> Sugerencias de nombres de cultivar</h3>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map(s => (
                    <div key={s.name} className="rounded-xl border border-app-border bg-app-bg/40 p-2.5">
                      <p className="font-accent text-[14px] font-bold text-brand-primary">{s.name}</p>
                      <p className="text-[10.5px] text-brand-dark/45">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Derecha: transferir + notas */}
            <div className="xl:col-span-4 space-y-5">
              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-1"><span className="text-[#C9A24B]"><PackagePlus size={14} /></span> Transferir a banco de semillas</h3>
                <p className="text-[12px] text-brand-dark/45 mb-4">Guarda esta cosecha en tu banco para futuras cruzas y conservación.</p>
                <div className="rounded-xl border border-app-border bg-app-bg/40 p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[34px] font-black text-brand-dark leading-none">{selectedCross?.semillas_obtenidas ?? 0}</p><p className="text-[12px] text-brand-dark/45">semillas limpias</p></div>
                    <span className="text-4xl">🌰</span>
                  </div>
                  <div className="mt-4 space-y-2 text-[12.5px] border-t border-app-border pt-3">
                    <Row k="Origen" v={selectedCross ? `${selectedCross.madre_nombre} × ${selectedCross.padre_nombre}` : '—'} />
                    <Row k="Fecha de cosecha" v={selectedCross?.fecha_germinacion ? new Date(selectedCross.fecha_germinacion).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')} />
                    <Row k="Viabilidad estimada" v={selectedCross && selectedCross.semillas_obtenidas > 0 ? `${Math.round((selectedCross.plantas_germinadas / selectedCross.semillas_obtenidas) * 100)}%` : '—'} />
                  </div>
                </div>
                <button onClick={transfer} className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A24B] to-brand-secondary text-white rounded-xl py-3 text-[13.5px] font-bold hover:brightness-110 transition-all active:scale-95"><PackagePlus size={16} /> Transferir al banco de semillas</button>
                <p className="text-[11px] text-brand-dark/40 mt-2">🔒 Las semillas se guardarán con su registro genético y fenotípico asociado.</p>
              </div>

              <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-accent text-[18px] font-bold text-brand-dark">Notas de análisis</h3>
                  <button onClick={() => setEditNotas(v => !v)} className="text-brand-dark/40 hover:text-brand-dark"><Pencil size={15} /></button>
                </div>
                {editNotas ? (
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={4} className="w-full rounded-xl bg-app-card border border-app-border p-3 text-[13px] text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
                ) : (
                  <p className="text-[13px] text-brand-dark/65 leading-relaxed italic">{notas || 'Sin notas. Pulsa el lápiz para agregar observaciones.'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Escenarios genéticos */}
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3"><span className="text-[#C9A24B]"><FlaskConical size={14} /></span> Escenarios genéticos probables</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map(s => (
                <div key={s.title} className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4">
                  <div className="flex items-center justify-between mb-2"><p className="text-[13.5px] font-bold text-brand-dark">{s.title}</p><span className="text-[13px] font-black text-[#9a7b2f]">{s.pct}%</span></div>
                  <div className="h-1.5 rounded-full bg-app-bg overflow-hidden mb-2"><div className="h-full rounded-full bg-gradient-to-r from-[#C9A24B] to-brand-primary" style={{ width: `${s.pct}%` }} /></div>
                  <p className="text-[11.5px] text-brand-dark/50">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Selector de cruza */}
      {showCrossSel && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowCrossSel(false)}>
          <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-accent text-[20px] font-bold text-brand-dark">Seleccionar cruza</h2><button onClick={() => setShowCrossSel(false)} className="w-8 h-8 rounded-lg hover:bg-app-bg flex items-center justify-center text-brand-dark/50"><X size={18} /></button></div>
            <button onClick={() => { setSelectedCross(null); setShowCrossSel(false); }} className={`w-full text-left rounded-xl border p-3 mb-2 ${!selectedCross ? 'border-brand-primary bg-brand-primary/5' : 'border-app-border hover:bg-app-bg'}`}>
              <p className="text-[13.5px] font-bold text-brand-dark/70">Sin cruza específica</p><p className="text-[11px] text-brand-dark/45">Analizar planta sin contexto</p>
            </button>
            {availableCrosses.map(c => (
              <button key={c.id} onClick={() => { setSelectedCross(c); setShowCrossSel(false); }} className={`w-full text-left rounded-xl border p-3 mb-2 ${selectedCross?.id === c.id ? 'border-brand-primary bg-brand-primary/5' : 'border-app-border hover:bg-app-bg'}`}>
                <p className="text-[13.5px] font-bold text-brand-dark">{c.nombre}</p>
                <p className="text-[11px] text-brand-dark/50">♀ {c.madre_nombre} × ♂ {c.padre_nombre}</p>
                <div className="flex gap-2 mt-1.5"><span className="text-[10px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/55">{c.semillas_obtenidas} semillas</span><span className="text-[10px] font-semibold bg-app-bg rounded px-2 py-0.5 text-brand-dark/55">{c.plantas_germinadas} germinadas</span></div>
              </button>
            ))}
            {availableCrosses.length === 0 && <p className="text-center text-[13px] text-brand-dark/40 py-6">No tienes cruzas registradas</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex items-center justify-between"><span className="text-brand-dark/45">{k}</span><span className="font-semibold text-brand-dark">{v}</span></div>
);

export default LabScreen;
