import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getLastSync } from '../../db/syncClient';
import { MobileHeader } from '../../components/MobileLayout';
import { NotebookPen, Leaf, Dna, Bot, Hourglass, Package, Bell, Wifi, ChevronRight, Check } from 'lucide-react';

const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const { plants, crosses, seedBank, alerts, completeAlert } = useApp();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const pend = useMemo(() => alerts.filter(a => !a.completada).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()), [alerts]);
  const hoy = pend.filter(a => new Date(a.fecha).getTime() <= startToday.getTime() + 86400000);
  const cruzasAct = crosses.filter(c => c.estado === 'en_proceso').length;
  const estrat = seedBank.filter(s => s.estado === 'estratificando').length;
  const last = getLastSync();

  const actions = [
    { label: 'Nueva entrada', icon: <NotebookPen size={22} />, to: '/diary' },
    { label: 'Agregar planta', icon: <Leaf size={22} />, to: '/add' },
    { label: 'Registrar cruza', icon: <Dna size={22} />, to: '/crosses' },
    { label: 'CarniBot', icon: <Bot size={22} />, to: '/ai' },
  ];

  return (
    <>
      <MobileHeader title="Inicio" subtitle={new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div className="px-5 space-y-5">
        {/* Tareas de hoy */}
        <div>
          <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider text-brand-primary mb-2"><span className="text-[#C9A24B]"><Bell size={14} /></span> Tareas de hoy</p>
          <div className="space-y-2">
            {hoy.length === 0 && <p className="text-[12.5px] text-brand-dark/35 bg-app-card border border-app-border rounded-xl px-4 py-3">No hay tareas para hoy 🌿</p>}
            {hoy.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0"><p className="text-[13px] font-bold text-brand-dark truncate">{a.mensaje}</p><p className="text-[11px] text-brand-dark/45">{a.planta}</p></div>
                <button onClick={() => completeAlert(a.id)} className="w-8 h-8 rounded-lg border border-app-border flex items-center justify-center text-brand-secondary"><Check size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3">
          {actions.map(a => (
            <button key={a.to} onClick={() => navigate(a.to)} className="flex flex-col items-start gap-2 bg-app-card border border-app-border rounded-2xl p-4 active:scale-95 transition-all">
              <span className="w-11 h-11 rounded-xl bg-[#C9A24B]/12 text-[#C9A24B] flex items-center justify-center">{a.icon}</span>
              <span className="text-[13.5px] font-bold text-brand-dark">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-2">
          <Mini icon={<Leaf size={16} />} value={plants.length} label="Plantas" />
          <Mini icon={<Hourglass size={16} />} value={cruzasAct} label="Cruzas" />
          <Mini icon={<Package size={16} />} value={estrat} label="Estrat." />
          <Mini icon={<Bell size={16} />} value={pend.length} label="Alertas" danger />
        </div>

        {/* Sync */}
        <button onClick={() => navigate('/sync')} className="w-full flex items-center gap-3 bg-app-card border border-app-border rounded-xl px-4 py-3">
          <Wifi size={18} className="text-[#C9A24B]" />
          <div className="flex-1 text-left"><p className="text-[13px] font-bold text-brand-dark">Sincronización</p><p className="text-[11px] text-brand-dark/45">Última: {last ? new Date(last).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca'}</p></div>
          <ChevronRight size={16} className="text-brand-dark/30" />
        </button>
      </div>
    </>
  );
};

const Mini: React.FC<{ icon: React.ReactNode; value: number; label: string; danger?: boolean }> = ({ icon, value, label, danger }) => (
  <div className="bg-app-card border border-app-border rounded-xl p-2.5 text-center">
    <span className={`flex justify-center mb-0.5 ${danger ? 'text-brand-accent' : 'text-brand-secondary'}`}>{icon}</span>
    <p className="text-[18px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[9.5px] text-brand-dark/45 mt-0.5">{label}</p>
  </div>
);

export default MobileHome;
