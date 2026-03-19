
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlanType, AccessKey } from '../types';

// ICONS (Inline if Icon component not available or specific ones needed)
const IconBack = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>);
const IconKey = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>);

const AdminKeys: React.FC = () => {
  const navigate = useNavigate();
  const { keys, generateKey, deleteKey, updateKeyPlan, updateKeyExpiry } = useAuth();

  // Estados Generación
  const [newLabel, setNewLabel] = useState('');
  const [duration, setDuration] = useState<number | null>(30); // Default 30 dias
  const [customDate, setCustomDate] = useState<string>(''); // Para fecha custom al generar
  const [plan, setPlan] = useState<PlanType>('basic');

  // Estados Edición
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const [editPlan, setEditPlan] = useState<PlanType>('basic');
  const [newExpiryDate, setNewExpiryDate] = useState<string | null>(null);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);


  React.useEffect(() => {
    // Auth handled by AdminRoute now
  }, []);


  const handleGenerate = () => {
    if (!newLabel) return;

    let finalDuration = duration;
    if (duration === -1 && customDate) {
      const now = new Date();
      const target = new Date(customDate);
      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      finalDuration = diffDays > 0 ? diffDays : 1;
    }

    generateKey(newLabel, finalDuration, plan);
    setNewLabel('');
    setDuration(30);
    setPlan('basic');
    setCustomDate('');
  };

  const openEditModal = (keyData: AccessKey) => {
    setEditingKey(keyData);
    setEditPlan(keyData.plan);
    setNewExpiryDate(keyData.expiresAt);
    setIsEditingExpiry(false);
  };

  const handleUpdatePlan = async () => {
    if (editingKey) {
      let success = await updateKeyPlan(editingKey.key, editPlan);

      if (editingKey.expiresAt !== newExpiryDate) {
        const dateSuccess = await updateKeyExpiry(editingKey.key, newExpiryDate);
        success = success && dateSuccess;
      }

      if (success) setEditingKey(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Podríamos poner un toast aquí
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '∞ Infinito';
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanStyle = (p: string) => {
    switch (p) {
      case 'elite': return 'border-purple-500/50 text-purple-300 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case 'pro': return 'border-blue-500/50 text-blue-300 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      default: return 'border-green-500/50 text-green-300 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center selection:bg-purple-500/30 font-display text-white">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-slate-900 via-[#0a0f1c] to-black" />
      <div className="fixed inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-[390px] px-6 pt-10 pb-32 flex flex-col items-center">

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={() => navigate('/admin')} className="p-3 -ml-2 rounded-xl active:bg-white/5 transition-all text-white/70 hover:text-white">
            <IconBack />
          </button>
          <div className="text-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white leading-tight tracking-tight">CarniLab</h1>
            <p className="text-[10px] text-blue-400/80 font-bold tracking-[0.2em] uppercase">Control Unit</p>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Generator Card "Lab Console" */}
        <div className="w-full bg-white/5 backdrop-blur-xl rounded-[24px] p-1 border border-white/10 mb-8 shadow-2xl relative overflow-hidden">
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="bg-[#0F172A]/80 rounded-[20px] p-5 relative z-10">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <IconKey />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Nueva Licencia</h2>
                <p className="text-[10px] text-white/40">Generar acceso seguro</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Nombre del Cliente"
                  className="w-full h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-sm font-bold text-white outline-none placeholder-white/20 focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['basic', 'pro', 'elite'].map((p) => (
                  <button key={p} onClick={() => setPlan(p as PlanType)} className={`h-9 rounded-lg text-[10px] font-black uppercase transition-all border ${plan === p ? getPlanStyle(p) : 'bg-white/5 border-white/5 text-white/30'}`}>
                    {p}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[7, 30, null].map((d) => (
                  <button key={d || 'inf'} onClick={() => setDuration(d)} className={`h-9 rounded-lg text-[10px] font-black uppercase transition-all border ${duration === d ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/30'}`}>
                    {d ? `${d}D` : '∞'}
                  </button>
                ))}
                <button onClick={() => setDuration(-1)} className={`h-9 rounded-lg text-[10px] font-black uppercase transition-all border ${duration === -1 ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/30'}`}>
                  Auto
                </button>
              </div>

              {duration === -1 && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full h-10 rounded-lg bg-black/40 border border-white/10 px-4 text-xs font-bold text-white/70 outline-none focus:text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              )}

              <button
                onClick={handleGenerate}
                disabled={!newLabel}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/30 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none mt-2"
              >
                Generar ID
              </button>
            </div>
          </div>
        </div>

        {/* Keys List (Specimen Tags) */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Base de Datos ({keys.length})</h3>
            <div className="h-px flex-1 bg-white/5 ml-4"></div>
          </div>

          {keys.map((k) => (
            <div key={k.key} className="relative group">
              {/* Glow behind */}
              <div className={`absolute inset-0 bg-gradient-to-r ${k.plan === 'elite' ? 'from-purple-500/20' : k.plan === 'pro' ? 'from-blue-500/20' : 'from-green-500/20'} to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md overflow-hidden hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getPlanStyle(k.plan)}`}>{k.plan}</span>
                      <span className="text-[10px] font-bold text-white/30 font-mono tracking-tight">{formatDate(k.expiresAt)}</span>
                    </div>
                    <h4 className="font-bold text-white text-base mb-1">{k.label}</h4>
                    <div
                      onClick={() => copyToClipboard(k.key)}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded bg-black/30 border border-white/5 text-[9px] font-mono text-white/50 active:text-white active:border-white/20 transition-all cursor-copy"
                    >
                      <IconKey />
                      {k.key}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pl-4 border-l border-white/5 ml-2">
                    <button onClick={() => deleteKey(k.key)} className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center active:scale-90 transition-transform">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                    <button onClick={() => openEditModal(k)} className="w-8 h-8 rounded-xl bg-white/5 text-white/70 border border-white/10 flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10 hover:text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal (Dark Glass) */}
        {editingKey && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-[#0F172A] p-6 rounded-[32px] shadow-2xl w-full max-w-sm border border-white/10 relative overflow-hidden">
              {/* Background effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-lg font-bold text-white mb-1">Editar Plan</h3>
              <p className="text-xs text-blue-300 mb-6 font-mono">{editingKey.label}</p>

              <div className="grid grid-cols-1 gap-2 mb-6">
                {['basic', 'pro', 'elite'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditPlan(p as PlanType)}
                    className={`h-12 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-between px-4 border ${editPlan === p ? getPlanStyle(p) : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                    {p}
                    {editPlan === p && <span>✓</span>}
                  </button>
                ))}
              </div>

              {/* Expiry Editor */}
              <div className="mb-6 bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Vencimiento</label>
                  <button
                    onClick={() => setIsEditingExpiry(!isEditingExpiry)}
                    className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                  >
                    {isEditingExpiry ? 'CANCELAR' : 'MODIFICAR'}
                  </button>
                </div>

                {!isEditingExpiry ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm tracking-wide">
                      {formatDate(newExpiryDate)}
                    </span>
                    {newExpiryDate && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2">
                    <input
                      type="date"
                      value={newExpiryDate ? newExpiryDate.split('T')[0] : ''}
                      onChange={(e) => setNewExpiryDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={() => setNewExpiryDate(null)}
                      className={`w-full py-2.5 rounded-lg border text-[10px] font-black uppercase transition-colors ${!newExpiryDate ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-white/50'}`}
                    >
                      Hacer Infinito (∞)
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setEditingKey(null)} className="h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs">Cancelar</button>
                <button onClick={handleUpdatePlan} className="h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg text-xs">Guardar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminKeys;
