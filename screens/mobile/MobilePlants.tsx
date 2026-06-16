import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MobileHeader } from '../../components/MobileLayout';
import { SpeciesIcon } from '../../components/SpeciesIcon';
import { Search, Plus, MapPin } from 'lucide-react';

const estadoMeta: Record<string, { label: string; dot: string; text: string }> = {
  saludable: { label: 'Saludable', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  regular: { label: 'Regular', dot: 'bg-amber-500', text: 'text-amber-600' },
  critico: { label: 'Crítico', dot: 'bg-rose-500', text: 'text-rose-600' },
};
const FILTERS = [['todos', 'Todas'], ['saludable', 'Saludables'], ['regular', 'Regular'], ['critico', 'Crítico']];

const MobilePlants: React.FC = () => {
  const navigate = useNavigate();
  const { plants } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('todos');

  const list = useMemo(() => plants.filter(p => {
    const ms = !q || p.nombre.toLowerCase().includes(q.toLowerCase()) || p.especie.toLowerCase().includes(q.toLowerCase());
    const me = filter === 'todos' || p.estado === filter;
    return ms && me;
  }), [plants, q, filter]);

  return (
    <>
      <MobileHeader title="Plantas" subtitle={`${plants.length} en tu colección`} />
      <div className="px-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar planta…" className="w-full h-11 rounded-full bg-app-card border border-app-border pl-9 pr-4 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {FILTERS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold border transition-colors ${filter === v ? 'bg-brand-primary text-white border-brand-primary' : 'bg-app-card text-brand-dark/60 border-app-border'}`}>{l}</button>
          ))}
        </div>

        <div className="space-y-2.5">
          {list.length === 0 && <p className="text-center text-[13px] text-brand-dark/35 py-10">No hay plantas 🌿</p>}
          {list.map(p => {
            const m = estadoMeta[p.estado] || estadoMeta.saludable;
            return (
              <button key={p.id} onClick={() => navigate(`/plant/${p.id}`)} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-2xl p-2.5 text-left active:scale-[0.98] transition-all">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
                  {p.imagen ? <img src={p.imagen} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={p.especie} size={36} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-bold text-brand-dark truncate">{p.nombre}</p>
                  <p className="text-[12px] italic text-brand-dark/45 truncate">{p.especie}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${m.text}`}><span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {m.label}</span>
                    {p.ubicacion && <span className="inline-flex items-center gap-1 text-[11px] text-brand-dark/45 truncate"><MapPin size={11} /> {p.ubicacion}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/add')} className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 active:scale-95 transition-all"><Plus size={26} /></button>
    </>
  );
};

export default MobilePlants;
