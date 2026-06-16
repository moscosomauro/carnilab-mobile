import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SpeciesIcon } from '../components/SpeciesIcon';
import { ChevronLeft, GitBranch, Venus, Mars, Dna, Sprout, Users } from 'lucide-react';

const fmtDate = (f?: string | null) => f ? new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const GenealogyScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { crosses, plants } = useApp();

  const cross = crosses.find(c => c.id === Number(id));

  if (!cross) {
    return (
      <div className="px-8 py-20 text-center">
        <div className="text-5xl mb-3">🧬</div>
        <h2 className="font-accent text-2xl font-bold text-brand-dark mb-2">Cruza no encontrada</h2>
        <button onClick={() => navigate('/crosses')} className="text-brand-primary font-bold underline text-sm">Volver a Genética y cruzas</button>
      </div>
    );
  }

  const tasa = cross.semillas_obtenidas > 0 ? Math.round((cross.plantas_germinadas / cross.semillas_obtenidas) * 100) : 0;
  const plantBy = (nombre: string) => plants.find(p => p.nombre === nombre);

  const Node: React.FC<{ nombre: string; especie: string; imagen?: string | null; sex?: 'f' | 'm'; tag?: string }> = ({ nombre, especie, imagen, sex, tag }) => {
    const p = plantBy(nombre);
    const src = imagen || p?.imagen;
    return (
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-3 flex items-center gap-3 w-[230px]">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
          {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <SpeciesIcon species={especie} size={26} />}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[13px] font-bold text-brand-dark truncate">{nombre}{sex === 'f' && <Venus size={12} className="text-rose-400 shrink-0" />}{sex === 'm' && <Mars size={12} className="text-sky-500 shrink-0" />}</p>
          <p className="text-[11px] italic text-brand-dark/45 truncate">{especie}</p>
          {tag && <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wide text-brand-dark/40">{tag}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-[1100px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/crosses')} className="w-9 h-9 rounded-lg border border-app-border bg-app-card flex items-center justify-center text-brand-dark/60 hover:bg-app-bg shrink-0"><ChevronLeft size={18} /></button>
        <div className="w-11 h-11 rounded-xl bg-[#C9A24B]/12 flex items-center justify-center"><GitBranch size={22} className="text-[#C9A24B]" /></div>
        <div>
          <h1 className="font-accent text-[28px] font-bold text-brand-dark leading-none">{cross.nombre}</h1>
          <p className="text-[12.5px] text-brand-dark/50 mt-1">Linaje completo{cross.objetivo && ` · ${cross.objetivo}`}</p>
        </div>
      </div>

      {/* Árbol */}
      <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 lg:p-10">
        {/* Parentales */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Node nombre={cross.madre_nombre} especie={cross.madre_especie} imagen={cross.madre_imagen} sex="f" tag="Madre" />
          <span className="text-[#C9A24B] font-accent text-2xl">×</span>
          <Node nombre={cross.padre_nombre} especie={cross.padre_especie} imagen={cross.padre_imagen} sex="m" tag="Padre" />
        </div>

        {/* Padres extra */}
        {cross.padres_extra && cross.padres_extra.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
            {cross.padres_extra.map((e, i) => <Node key={i} nombre={e.nombre} especie={e.especie} imagen={e.imagen} tag="Donante extra" />)}
          </div>
        )}

        {/* Conector */}
        <div className="flex flex-col items-center my-3">
          <span className="w-px h-6 bg-app-border" />
          <span className="w-11 h-11 rounded-full bg-[#C9A24B]/15 text-[#C9A24B] flex items-center justify-center shadow-sm"><Dna size={22} /></span>
          <span className="w-px h-6 bg-app-border" />
        </div>

        {/* Cruza (F1) */}
        <div className="flex justify-center">
          <div className="bg-brand-primary/[0.05] border border-brand-primary/15 rounded-2xl p-4 flex items-center gap-3 w-[300px]">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-app-bg border border-app-border shrink-0 flex items-center justify-center">
              {cross.hibrido_imagen ? <img src={cross.hibrido_imagen} alt="" className="w-full h-full object-cover" /> : <Dna size={22} className="text-brand-primary/40" />}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13.5px] font-bold text-brand-dark truncate">{cross.nombre} <span className="text-[9px] font-black bg-[#C9A24B]/20 text-[#9a7b2f] rounded px-1.5 py-0.5">F1</span></p>
              <p className="text-[11.5px] text-brand-dark/50">{fmtDate(cross.fecha_cruza)} · {cross.semillas_obtenidas} semillas</p>
            </div>
          </div>
        </div>

        {/* Descendencia */}
        <div className="flex flex-col items-center mt-3">
          <span className="w-px h-6 bg-app-border" />
          <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex items-center gap-3 w-[300px]">
            <span className="w-11 h-11 rounded-xl bg-brand-secondary/12 text-brand-secondary flex items-center justify-center shrink-0"><Users size={20} /></span>
            <div>
              <p className="text-[13px] font-bold text-brand-dark">Descendencia</p>
              <p className="text-[11.5px] text-brand-dark/50">{cross.plantas_germinadas} plántulas germinadas de {cross.semillas_obtenidas} semillas</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-brand-dark/40 mt-5">F1: Primera generación filial directa del cruce.</p>
      </div>

      {/* Métricas + notas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        <Stat icon={<Sprout size={18} />} value={cross.semillas_obtenidas} label="Semillas" />
        <Stat icon={<Users size={18} />} value={cross.plantas_germinadas} label="Germinadas" />
        <Stat icon={<Dna size={18} />} value={`${tasa}%`} label="Tasa de germinación" />
        <Stat icon={<GitBranch size={18} />} value={Math.floor((Date.now() - new Date(cross.fecha_cruza).getTime()) / 86400000)} label="Días desde la cruza" />
      </div>
      {cross.notas && (
        <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 mt-5">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-brand-dark/40 mb-1">Notas de la cruza</p>
          <p className="text-[13px] text-brand-dark/65 italic leading-relaxed">"{cross.notas}"</p>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; value: React.ReactNode; label: string }> = ({ icon, value, label }) => (
  <div className="bg-app-card border border-app-border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 text-center">
    <span className="text-[#C9A24B] flex justify-center mb-1">{icon}</span>
    <p className="text-[24px] font-black text-brand-dark leading-none">{value}</p>
    <p className="text-[11px] text-brand-dark/45 mt-1">{label}</p>
  </div>
);

export default GenealogyScreen;
