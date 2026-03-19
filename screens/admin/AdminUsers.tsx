import React, { useState, useMemo } from 'react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { PlanType, AccessKey } from '../../types';
import { LineChart, PieChart, Search, Plus, Settings, Trash, Key, CheckCircle, Circle, Check, Calendar, Megaphone, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { BroadcastManager } from '../../components/admin/BroadcastManager';
import { UserInspector } from '../../components/admin/UserInspector';

const AdminUsers: React.FC = () => {
  const { keys, generateKey, deleteKey, updateKeyPlan, updateKeyExpiry } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Generar Key State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [duration, setDuration] = useState<number | null>(30); // 30 dias default
  const [customDate, setCustomDate] = useState<string>(''); // Para fecha custom al generar
  const [plan, setPlan] = useState<PlanType>('basic');

  // Modal Editar Plan State
  const [editingKey, setEditingKey] = useState<AccessKey | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState<string | null>(null);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [inspectingKey, setInspectingKey] = useState<AccessKey | null>(null);

  // --- ANALYTICS DATA ---
  const statsPlans = useMemo(() => {
    const counts = { basic: 0, pro: 0, elite: 0 };
    keys.forEach(k => {
      if (counts[k.plan] !== undefined) counts[k.plan]++;
    });
    return [
      { name: 'Basic', value: counts.basic, color: '#22c55e' }, // Green
      { name: 'Pro', value: counts.pro, color: '#3b82f6' },   // Blue
      { name: 'Elite', value: counts.elite, color: '#a855f7' }, // Purple
    ];
  }, [keys]);

  const statsGrowth = useMemo(() => {
    // 1. Sort keys by creation date
    const sorted = [...keys].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    // 2. Group by Month-Year
    const grouped: { [key: string]: number } = {};
    let cumulative = 0;

    sorted.forEach(k => {
      if (!k.createdAt) return;
      const date = new Date(k.createdAt);
      const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().substr(-2)}`; // "Jan 24"
      cumulative++;
      grouped[key] = cumulative;
    });

    // 3. Convert to Array
    return Object.keys(grouped).map(k => ({ name: k, users: grouped[k] }));
  }, [keys]);

  // --- ACTIONS ---
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
    setShowGenerateModal(false);
  };

  const openEditModal = (keyData: AccessKey) => {
    setEditingKey(keyData);
    setNewExpiryDate(keyData.expiresAt); // Initialize with current expiry
    setIsEditingExpiry(false);
  };

  const handleUpdatePlan = (newPlan: PlanType) => {
    if (editingKey) {
      updateKeyPlan(editingKey.key, newPlan);

      // Also update expiry if changed
      if (editingKey.expiresAt !== newExpiryDate) {
        updateKeyExpiry(editingKey.key, newExpiryDate);
      }

      setEditingKey(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPlanColor = (p: string) => {
    switch (p) {
      case 'elite': return 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] border-purple-400';
      case 'pro': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-blue-400';
      default: return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-400';
    }
  };

  const getPlanStyle = (p: string) => {
    switch (p) {
      case 'elite': return 'bg-purple-500/20 border-purple-500/50 text-purple-300';
      case 'pro': return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
      default: return 'bg-green-500/20 border-green-500/50 text-green-300';
    }
  };

  const filteredKeys = keys.filter(k =>
    k.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="pt-8 pb-32 px-4 md:px-10 max-w-7xl mx-auto space-y-8 font-display">

        {/* HEADER: Control Center - Reduced sizes and better alignment */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 tracking-tighter drop-shadow-2xl">
              CONTROL UNIT
            </h1>
            <p className="text-blue-400/60 font-medium tracking-widest text-[10px] uppercase mt-1">Advanced User Management System v2.0</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Server Status</span>
              <span className="text-emerald-400 text-[10px] font-black flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* ANALYTICS HUD - Spaced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Growth Chart */}
          <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col gap-4">
            {/* Decorative HUD Lines - Behind Content */}
            <div className="absolute top-0 left-0 w-20 h-[1px] bg-blue-500/50 z-0"></div>
            <div className="absolute top-0 left-0 w-[1px] h-20 bg-blue-500/50 z-0"></div>

            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-xs font-bold text-white/60 mb-4 uppercase tracking-widest flex items-center gap-2">
                <LineChart className="w-3.5 h-3.5 text-blue-400" />
                Crecimiento de Usuarios
              </h3>

              <div className="h-[200px] w-full mt-auto"> {/* Fixed height container */}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      dy={10}
                      interval="preserveStartEnd" // Avoid tick overlap
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', zIndex: 100 }}
                      itemStyle={{ color: '#60a5fa' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 2. Plan Distribution */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative flex flex-col items-center justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-20 h-[1px] bg-purple-500/50 z-0"></div>
            <div className="absolute top-0 right-0 w-[1px] h-20 bg-purple-500/50 z-0"></div>

            <h3 className="text-sm font-bold text-white/60 w-full text-left flex items-center gap-2 relative z-10">
              <PieChart className="w-4 h-4 text-purple-400" />
              Distribución
            </h3>

            <div className="relative w-full flex-1 flex items-center justify-center my-4 z-10">
              <div className="w-[180px] h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statsPlans}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statsPlans.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', zIndex: 100 }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white">{keys.length}</span>
                  <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Total</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 w-full relative z-10">
              {statsPlans.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                  <span className="text-[10px] font-bold text-white/50 uppercase">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTROLS - More compact */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
          {/* Search */}
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search connection ID or alias..."
              className="block w-full pl-10 pr-3 py-2 bg-black/20 border border-white/5 rounded-lg text-xs font-bold text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-black/40 transition-all font-mono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Stats (Inline) */}
          <div className="hidden md:flex items-center gap-6 px-6 border-l border-white/10">
            <div className="text-center">
              <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">TOTAL USERS</p>
              <p className="text-lg font-black text-white leading-none">{keys.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-0.5">Elite Plan</p>
              <p className="text-lg font-black text-purple-400 leading-none">{keys.filter(k => k.plan === 'elite').length}</p>
            </div>
          </div>



          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all flex items-center justify-center shrink-0"
              title="Centro de Difusión"
            >
              <Megaphone className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              NUEVA LICENCIA
            </button>
          </div>
        </div>

        {/* GLASS GRID - USER CARDS - Refined Sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredKeys.map((key) => {
            const isBound = !!key.deviceId;
            return (
              <div
                key={key.key}
                className="group relative bg-[#0a0a0a]/60 backdrop-blur-md rounded-[20px] border border-white/5 overflow-hidden hover:border-white/20 transition-all hover:translate-y-[-2px] hover:shadow-xl"
              >
                {/* Top Colored Line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${key.plan === 'elite' ? 'bg-purple-500' : key.plan === 'pro' ? 'bg-blue-500' : 'bg-green-500'}`} />

                <div className="p-5 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col gap-1">
                      {/* Plan Badge */}
                      <div className={`px-2 py-0.5 rounded-full border bg-opacity-10 backdrop-blur-md flex items-center gap-1.5 w-fit ${key.plan === 'elite' ? 'border-purple-500/30 bg-purple-500/10' : key.plan === 'pro' ? 'border-blue-500/30 bg-blue-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${getPlanColor(key.plan)} animate-pulse shadow-[0_0_10px_currentColor]`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${key.plan === 'elite' ? 'text-purple-300' : key.plan === 'pro' ? 'text-blue-300' : 'text-green-300'}`}>
                          {key.plan.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setInspectingKey(key)}
                        className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/30 flex items-center justify-center text-blue-500 transition-colors border border-blue-500/20"
                        title="Inspeccionar Usuario"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(key)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors border border-white/5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteKey(key.key)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/30 flex items-center justify-center text-red-500 transition-colors border border-red-500/20"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-0.5 leading-tight">{key.label}</h3>
                    <div
                      onClick={() => copyToClipboard(key.key)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-white/40 hover:text-white hover:border-white/30 cursor-pointer transition-colors group/key"
                    >
                      <Key className="w-2.5 h-2.5 group-hover/key:text-blue-400" />
                      {key.key.substring(0, 18)}...
                    </div>
                  </div>

                  {/* Stats Footer */}
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                    <div className="flex-1">
                      <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-0.5">ESTADO</p>
                      <div className="flex items-center gap-1.5">
                        {isBound ? <CheckCircle className="w-2.5 h-2.5 text-blue-400" /> : <Circle className="w-2.5 h-2.5 text-yellow-500" />}
                        <span className="text-[10px] font-bold text-white/80">{isBound ? 'Vinculado' : 'Pendiente'}</span>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-0.5">VENCE</p>
                      <span className="text-[10px] font-bold text-white/80 font-mono">
                        {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : '∞ PERMANENTE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Background Glow */}
                <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40
                    ${key.plan === 'elite' ? 'bg-purple-600' : key.plan === 'pro' ? 'bg-blue-600' : 'bg-green-600'}`}
                />
              </div>
            );
          })}
        </div>

      </div>

      {/* GENERATE MODAL (Styled) */}
      {
        showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0f172a] rounded-[30px] border border-white/10 shadow-2xl overflow-hidden relative">
              {/* Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

              <div className="p-8">
                <h2 className="text-2xl font-black text-white mb-2">Generar Licencia</h2>
                <p className="text-sm text-blue-300/60 mb-8 font-medium">Crear nuevo acceso para cliente</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">NOMBRE / ETIQUETA</label>
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                      placeholder="Ej: Cliente Juan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">TIPO DE PLAN</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['basic', 'pro', 'elite'].map(p => (
                        <button
                          key={p}
                          onClick={() => setPlan(p as PlanType)}
                          className={`py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${plan === p ?
                            getPlanStyle(p) + ' text-white scale-105' :
                            'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">DURACIÓN</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[7, 30, 365, -1].map(d => (
                        <button
                          key={d}
                          onClick={() => setDuration(d === -1 ? -1 : d)}
                          className={`py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${duration === (d === -1 ? -1 : d) ?
                            'bg-white text-black border-white' :
                            'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                            }`}
                        >
                          {d === -1 ? 'Personalizado' : (d === 365 ? '1 Año' : `${d} Días`)}
                        </button>
                      ))}
                    </div>
                    {/* Custom Date Input - Only shows if 'Personalizado' (-1) is selected */}
                    {duration === -1 && (
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full mt-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowGenerateModal(false)}
                      className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={!newLabel}
                      className="flex-1 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase shadow-lg shadow-blue-600/20"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* EDIT PLAN MODAL */}
      {
        editingKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0f172a] rounded-[30px] border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="p-8 relative z-10">
                <h3 className="text-xl font-bold text-white mb-1">Editar Suscripción</h3>
                <p className="text-xs text-blue-300/60 mb-6 font-mono">{editingKey.label}</p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {['basic', 'pro', 'elite'].map(p => (
                        <button
                          key={p}
                          onClick={() => handleUpdatePlan(p as PlanType)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all group ${editingKey.plan === p ?
                            'bg-white/10 border-white/30 text-white' :
                            'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getPlanColor(p)}`} />
                            <span className="text-xs font-black uppercase">{p}</span>
                          </div>
                          {editingKey.plan === p && <Check className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>

                    {/* EXPIRY EDITOR IN MODAL */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">FECHA DE VENCIMIENTO</label>
                        <button
                          onClick={() => setIsEditingExpiry(!isEditingExpiry)}
                          className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase"
                        >
                          {isEditingExpiry ? 'Cancelar' : 'Modificar'}
                        </button>
                      </div>

                      {!isEditingExpiry ? (
                        <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                          <span className="text-white font-mono text-sm font-bold">
                            {newExpiryDate ? new Date(newExpiryDate).toLocaleDateString() : 'PERMANENTE'}
                          </span>
                          <Calendar className="w-4 h-4 text-white/30" />
                        </div>
                      ) : (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <input
                            type="date"
                            value={newExpiryDate ? newExpiryDate.split('T')[0] : ''}
                            onChange={(e) => setNewExpiryDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white text-sm font-bold outline-none focus:border-blue-500/50"
                          />
                          <button
                            onClick={() => setNewExpiryDate(null)}
                            className={`w-full py-3 rounded-xl border text-[10px] font-black uppercase transition-colors ${!newExpiryDate ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-white/5 border-white/10 text-white/50'}`}
                          >
                            Hacer Permanente (∞)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Save date changes if modified
                      if (isEditingExpiry && editingKey.expiresAt !== newExpiryDate) {
                        updateKeyExpiry(editingKey.key, newExpiryDate);
                      }
                      setEditingKey(null);
                    }}
                    className="w-full py-4 rounded-xl bg-white text-black font-black text-xs uppercase hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showBroadcastModal && (
          <BroadcastManager onClose={() => setShowBroadcastModal(false)} />
        )
      }

      {inspectingKey && (
        <UserInspector userKey={inspectingKey} onClose={() => setInspectingKey(null)} />
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
