
import React from 'react';
import { CarniBotIcon } from '../components/CarniBotIcon';

// --- ICONS ---
const IconDNA = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5-2.5" />
      <path d="M14 8l-1-1" />
      <path d="M7 18l2.5 2.5" />
      <path d="M3.5 14.5l.5.5" />
      <path d="M20 9l.5.5" />
      <path d="M6.5 12.5l1.5 1.5" />
      <path d="M16.5 10.5l-1.5-1.5" />
      <path d="M10 16l1.5 1.5" />
   </svg>
);

const IconLeaf = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
   </svg>
);

const IconExperiment = () => (
   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 19h12a3 3 0 0 0 3-3v-3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3a3 3 0 0 0 3 3z" />
      <path d="M6 19v-5.6a9 9 0 0 1 12 0V19" />
      <line x1="12" y1="19" x2="12" y2="4" />
      <path d="M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
   </svg>
);

// --- MOCK DATA ---
const MOCK_STATS = [
   { label: 'Total Especies', value: '124', unit: 'Sp.', color: 'text-teal-600', bg: 'bg-teal-50' },
   { label: 'En Incubación', value: '18', unit: 'Semillas', color: 'text-amber-600', bg: 'bg-amber-50' },
   { label: 'Cruzas Activas', value: '7', unit: 'Proyectos', color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const DesignConcept: React.FC = () => {
   return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex justify-center">
         {/* Simulation Mobile Frame */}
         <div className="w-full max-w-[420px] bg-white min-h-screen relative shadow-2xl overflow-hidden">

            {/* TOP COMPONENT: Header & Status */}
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 z-10 relative">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                        <CarniBotIcon className="w-7 h-7" />
                     </div>
                     <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-none">CarniLab</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Research Dashboard</p>
                     </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-slate-200 p-0.5">
                     <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" className="w-full h-full rounded-full object-cover" />
                  </div>
               </div>

               {/* BIO-METRIC STATS SCROLL */}
               <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {MOCK_STATS.map((stat, i) => (
                     <div key={i} className={`min-w-[120px] p-4 rounded-2xl ${stat.bg} border border-transparent`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-1">
                           <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                           <span className="text-[10px] text-slate-500 font-medium">{stat.unit}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="p-6 bg-slate-50/50 min-h-[500px]">

               {/* SECTION: ACTIVE EXPERIMENTS */}
               <div className="mb-8">
                  <div className="flex justify-between items-baseline mb-4">
                     <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <IconDNA /> Laboratorio Genético
                     </h2>
                     <button className="text-xs font-bold text-teal-600">Ver Todo</button>
                  </div>

                  <div className="space-y-4">
                     {/* Card 1 */}
                     <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 transition-transform group-hover:scale-110" />

                        <div className="relative z-10">
                           <div className="flex justify-between items-start mb-2">
                              <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-lg">PROY-001</span>
                              <span className="text-xs font-mono text-slate-400">Hace 2d</span>
                           </div>
                           <h3 className="text-lg font-bold text-slate-800 mb-1">Dionaea "B52" x "Giant"</h3>
                           <p className="text-xs text-slate-500 mb-4">Fase 2: Germinación Temprana</p>

                           {/* Progress Bar */}
                           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full w-[65%]" />
                           </div>
                           <div className="flex justify-between mt-1">
                              <span className="text-[9px] font-bold text-slate-400">Progreso Estimado</span>
                              <span className="text-[9px] font-bold text-teal-600">65%</span>
                           </div>
                        </div>
                     </div>

                     {/* Card 2 */}
                     <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-800 relative z-10">Sarracenia Leucophylla</h3>
                        <p className="text-xs text-slate-500 relative z-10">Cruza Experimental - Lote 4B</p>
                     </div>
                  </div>
               </div>

               {/* GRID MENU */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 aspect-square hover:shadow-md transition-shadow cursor-pointer">
                     <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <IconLeaf />
                     </div>
                     <span className="font-bold text-sm text-slate-700">Inventario</span>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 aspect-square hover:shadow-md transition-shadow cursor-pointer">
                     <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <IconExperiment />
                     </div>
                     <span className="font-bold text-sm text-slate-700">Bitácora</span>
                  </div>
               </div>

            </div>

            {/* BOTTOM NAV */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center z-50">
               <button className="text-teal-600 flex flex-col items-center gap-1">
                  <div className="w-10 h-1 bg-teal-600 rounded-full mb-1" />
                  <span className="text-[10px] font-bold uppercase">Inicio</span>
               </button>
               <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <IconLeaf />
               </button>
               <button className="w-12 h-12 bg-slate-900 rounded-full text-white flex items-center justify-center shadow-lg transform -translate-y-4 border-4 border-slate-50">
                  +
               </button>
               <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <IconExperiment />
               </button>
               <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-slate-200" />
               </button>
            </div>

         </div>
      </div>
   );
};

export default DesignConcept;
