import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { askCarniBot } from '../../utils/carniBot';
import { MobileHeader } from '../../components/MobileLayout';
import { Camera, RefreshCw, Sparkles, ScanSearch, NotebookPen, Bell, Check } from 'lucide-react';

const QUICK = ['¿Qué tiene?', '¿Qué agua usar?', '¿Cuánta luz necesita?'];

const MobileCarniBot: React.FC = () => {
  const { plants, addDiaryEntry, addAlert } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [ok, setOk] = useState('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { setImg(r.result as string); setResult(null); }; r.readAsDataURL(f); } if (e.target) e.target.value = '';
  };

  const analyze = async (prompt?: string) => {
    if (!img) { fileRef.current?.click(); return; }
    setLoading(true); setResult(null);
    try {
      const text = await askCarniBot(
        [{ role: 'user', text: prompt || 'Identificá esta planta carnívora y diagnosticá su estado de salud: especie probable, posibles problemas y recomendaciones de cuidado.' }],
        img, plants, { addAlert, addDiaryEntry }
      );
      setResult(text);
    } catch (e: any) { setResult('No se pudo conectar con CarniBot. ' + (e.message || '')); }
    finally { setLoading(false); }
  };

  const toast = (m: string) => { setOk(m); setTimeout(() => setOk(''), 1400); };
  const saveDiary = async () => {
    if (!result) return;
    const p = plants[0];
    await addDiaryEntry({ planta_nombre: p?.nombre || 'General', planta_especie: p?.especie || 'N/A', fecha: new Date().toISOString(), tipo: 'observacion', descripcion: result.slice(0, 500), imagen: img } as any);
    toast('Guardado en bitácora');
  };

  return (
    <>
      <MobileHeader title="CarniBot por foto" subtitle="Identifica y diagnostica al instante" />
      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="px-5 space-y-4">
        {/* Foto */}
        <div onClick={() => fileRef.current?.click()} className="relative rounded-2xl overflow-hidden border border-app-border bg-app-bg aspect-[16/10] flex items-center justify-center">
          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-brand-dark/35"><Camera size={30} /><span className="text-[12.5px] mt-1">Tomar foto de la planta</span></div>}
          {img && <span className="absolute bottom-2 right-2 bg-brand-dark/60 text-white text-[11px] font-semibold rounded-lg px-2 py-1 flex items-center gap-1"><RefreshCw size={12} /> Cambiar foto</span>}
        </div>

        {!result && (
          <button onClick={() => analyze()} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl py-3.5 text-[15px] font-bold shadow-md shadow-violet-600/20 active:scale-95 transition-all disabled:opacity-60">
            {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Analizando…</> : <><Sparkles size={18} /> Analizar con CarniBot</>}
          </button>
        )}

        {/* Resultado */}
        {result && (
          <>
            <div className="bg-app-card border border-app-border rounded-2xl p-4">
              <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2"><span className="text-[#C9A24B]"><ScanSearch size={14} /></span> Análisis de CarniBot</p>
              <p className="text-[13.5px] text-brand-dark/75 leading-relaxed whitespace-pre-line">{result}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={saveDiary} className="flex items-center justify-center gap-2 bg-app-card border border-app-border rounded-xl py-3 text-[13px] font-bold text-brand-dark"><NotebookPen size={15} /> Guardar en bitácora</button>
              <button onClick={() => { addAlert({ tipo: 'otro', planta: plants[0]?.nombre || 'General', mensaje: 'Revisar según diagnóstico de CarniBot', prioridad: 'media', fecha: new Date(Date.now() + 86400000).toISOString(), completada: false } as any); toast('Alerta creada'); }} className="flex items-center justify-center gap-2 bg-brand-primary text-white rounded-xl py-3 text-[13px] font-bold"><Bell size={15} /> Crear alerta</button>
            </div>
            <button onClick={() => { setResult(null); setImg(null); }} className="w-full text-[12.5px] font-bold text-brand-primary/70">Analizar otra foto</button>
          </>
        )}

        {/* Preguntas rápidas */}
        <div>
          <p className="text-[12px] font-semibold text-brand-dark/55 mb-2">Preguntas rápidas</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map(q => <button key={q} onClick={() => analyze(q)} className="bg-app-card border border-app-border rounded-full px-3 py-1.5 text-[12px] font-semibold text-brand-dark/70">{q}</button>)}
          </div>
        </div>
      </div>
      {ok && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-brand-secondary text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-scale-in"><Check size={18} /><span className="text-[13px] font-bold">{ok}</span></div>}
    </>
  );
};

export default MobileCarniBot;
