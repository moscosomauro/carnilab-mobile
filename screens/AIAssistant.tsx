import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { askCarniBot } from '../utils/carniBot';
import { AssetIcon } from '../components/AssetIcon';
import { Bot, Camera, Send, X, Stethoscope, Bell, NotebookPen, ScanSearch, Sparkles, ImageIcon } from 'lucide-react';

interface Message { id: number; role: 'user' | 'model'; text: string; image?: string; }

const QUICK = [
  { id: 'foto', label: 'Identificar por foto', icon: <ScanSearch size={18} />, prompt: 'Identifica esta planta carnívora y dime su especie probable.', pickImage: true },
  { id: 'diag', label: 'Diagnóstico', icon: <Stethoscope size={18} />, prompt: 'Diagnostica el estado de salud de mi planta y detecta posibles plagas o problemas.', pickImage: true },
  { id: 'alerta', label: 'Crear alerta', icon: <Bell size={18} />, prompt: 'Créame una alerta de riego para mi planta para dentro de 3 días.', pickImage: false },
  { id: 'nota', label: 'Crear nota de diario', icon: <NotebookPen size={18} />, prompt: 'Agrega una nota de diario de observación para mi planta: ', pickImage: false },
];

const AIAssistant: React.FC = () => {
  const location = useLocation();
  const { plants, addAlert, addDiaryEntry } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'model', text: '¡Hola! Soy CarniBot 🌿. Puedo identificar tus plantas carnívoras, darte consejos de cuidado o diagnosticar problemas. Envíame una foto o describime tu consulta.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    const st = location.state as { initialImage?: string; initialPrompt?: string } | null;
    if (st) {
      if (st.initialImage) setImage(st.initialImage);
      if (st.initialPrompt) setInput(st.initialPrompt);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const lastImage = useMemo(() => [...messages].reverse().find(m => m.image)?.image || image, [messages, image]);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(f); }
    if (e.target) e.target.value = '';
  };

  const quick = (q: typeof QUICK[number]) => { setInput(q.prompt); if (q.pickImage) fileRef.current?.click(); };

  const send = async () => {
    if ((!input.trim() && !image) || loading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: input, image: image || undefined };
    setMessages(prev => [...prev, userMsg]); setInput(''); setImage(null); setLoading(true);
    try {
      const res = await askCarniBot([...messages, userMsg].map(m => ({ role: m.role, text: m.text })), userMsg.image || null, plants, { addAlert, addDiaryEntry });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: res }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'model', text: `Hubo un error al conectar con CarniBot. ${e.message || ''}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1500px] mx-auto">
      <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={onImage} />
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><AssetIcon name="icon-bot" size={26} /></div>
        <div className="flex-1">
          <h1 className="font-accent text-[32px] font-bold text-brand-dark leading-none">CarniBot <span className="text-[16px] text-brand-dark/40">(IA)</span></h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Pregunta, analiza y aprende sobre tus plantas carnívoras</p>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 bg-violet-50 text-violet-700 rounded-full px-3 py-1.5 text-[12px] font-bold"><Sparkles size={14} /> IA</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Chat */}
        <div className="xl:col-span-8 flex flex-col">
          {/* Herramientas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {QUICK.map(q => (
              <button key={q.id} onClick={() => quick(q)} className="flex flex-col items-center gap-1.5 bg-app-card border border-app-border rounded-2xl p-3 hover:bg-app-bg transition-colors">
                <span className="w-9 h-9 rounded-xl bg-[#C9A24B]/12 text-[#C9A24B] flex items-center justify-center">{q.icon}</span>
                <span className="text-[11.5px] font-semibold text-brand-dark/70 text-center leading-tight">{q.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col h-[560px]">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-brand-primary text-white rounded-tr-sm' : 'bg-app-bg/70 text-brand-dark rounded-tl-sm border border-app-border'}`}>
                    {m.image && <div className="rounded-xl overflow-hidden mb-2 border border-white/20"><img src={m.image} alt="" className="w-full max-h-56 object-cover" /></div>}
                    <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start"><div className="bg-app-bg/70 border border-app-border rounded-2xl rounded-tl-sm p-4 flex gap-1.5">
                  <span className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce" /><span className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce delay-75" /><span className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce delay-150" />
                </div></div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t border-app-border p-3">
              {image && (
                <div className="relative w-16 h-16 mb-2 ml-1">
                  <img src={image} alt="" className="w-full h-full object-cover rounded-lg border border-app-border" />
                  <button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center"><X size={11} /></button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => fileRef.current?.click()} className="w-11 h-11 rounded-xl bg-app-bg text-[#C9A24B] flex items-center justify-center hover:bg-app-bg/70 shrink-0"><Camera size={18} /></button>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={1} placeholder="Escribe tu pregunta o describe el problema de tu planta…"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  className="flex-1 bg-app-bg/60 border border-app-border rounded-xl px-3 py-2.5 text-[13.5px] text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none max-h-32" />
                <button onClick={send} disabled={loading || (!input.trim() && !image)} className="w-11 h-11 rounded-xl bg-brand-primary text-white flex items-center justify-center hover:brightness-110 disabled:opacity-50 shrink-0"><Send size={17} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="xl:col-span-4 space-y-5">
          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3"><span className="text-[#C9A24B]"><ScanSearch size={15} /></span> Análisis de CarniBot</h3>
            {lastImage ? (
              <div className="rounded-xl overflow-hidden border border-app-border mb-3"><img src={lastImage} alt="" className="w-full h-44 object-cover" /></div>
            ) : (
              <div className="rounded-xl border border-dashed border-app-border bg-app-bg/40 h-44 flex flex-col items-center justify-center text-brand-dark/35 mb-3"><ImageIcon size={28} /><span className="text-[12px] mt-1">Sin imagen analizada</span></div>
            )}
            <p className="text-[12.5px] text-brand-dark/55 leading-relaxed">Sube una foto y CarniBot identificará la especie, evaluará su salud y te dará recomendaciones directamente en la conversación.</p>
          </div>

          <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
            <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-3"><span className="text-[#C9A24B]"><Bot size={15} /></span> ¿Qué puede hacer?</h3>
            <ul className="space-y-2.5">
              {['Identificar especies de plantas carnívoras por foto.', 'Diagnosticar salud y detectar plagas.', 'Crear alertas de cuidado por comando.', 'Agregar notas a tu diario de cultivo.'].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-brand-dark/65"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A24B] shrink-0" /> {t}</li>
              ))}
            </ul>
            <p className="text-[11px] text-brand-dark/40 mt-3">CarniBot necesita conexión a internet solo al usarse.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
