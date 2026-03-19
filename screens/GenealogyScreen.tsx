import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GenealogyTree } from '../components/GenealogyTree';

// --- CUSTOM SVG ICONS (Dark Glow) ---
const IconBack = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
   </svg>
);

const GenealogyScreen: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { crosses } = useApp();

   const cross = crosses.find(c => c.id === Number(id));

   if (!cross) {
      return (
         <div className="min-h-screen bg-[#1A231E] flex flex-col items-center justify-center p-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">🧬</div>
            <h2 className="text-2xl font-black text-white mb-2">Cruza no encontrada</h2>
            <button onClick={() => navigate(-1)} className="text-[#8E877F] font-bold underline">Volver</button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#1A231E] font-display flex flex-col items-center overflow-hidden">
         {/* Background Decor */}
         <div className="fixed inset-0 pointer-events-none z-0">
            <img src="./assets/backgrounds/genealogy_bg.jpg" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-[#1A231E]/60 mix-blend-multiply"></div>
         </div>

         {/* Header Section */}
         <div className="w-full max-w-[390px] lg:max-w-6xl px-6 pt-12 pb-6 flex flex-col gap-6 relative z-10">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform border border-white/20">
                  <IconBack />
               </button>
            </div>

            <div className="text-center animate-in fade-in slide-in-from-top duration-700">
               <div className="inline-block bg-[#2E2E2E] px-4 py-1.5 rounded-full text-[10px] font-black text-[#8E877F] tracking-[0.3em] uppercase mb-3 border border-white/5">
                  Mapa Genético
               </div>
               <h1 className="text-[34px] font-black text-white leading-tight mb-1 drop-shadow-md">{cross.nombre}</h1>
               <p className="text-[14px] font-bold text-[#8E877F] opacity-70 italic">Linaje Completo</p>
            </div>
         </div>

         {/* Tree Visualization Container */}
         <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center p-0 md:p-6 animate-in zoom-in duration-1000">
            <GenealogyTree cross={cross} />
         </div>

         <div className="mt-8 text-center pb-12 relative z-10">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">CarniLab Bio-Informatics</p>
         </div>

      </div>
   );
};

export default GenealogyScreen;
