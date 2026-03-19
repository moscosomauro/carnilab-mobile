import React from 'react';
import { Cross } from '../types';
import { motion } from 'framer-motion';

interface GenealogyTreeProps {
    cross: Cross;
}

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({ cross }) => {
    // Determine Images with robust fallbacks (using 'any' to bypass strict type for now)
    const c = cross as any;
    const motherImg = c.madre_imagen || 'https://images.unsplash.com/photo-1596525737130-141979b006c4?auto=format&fit=crop&w=150';
    const fatherImg = c.padre_imagen || 'https://images.unsplash.com/photo-1616254519985-703358055c3c?auto=format&fit=crop&w=150';
    const childImg = c.hibrido_imagen;

    return (
        <div className="relative w-full h-[500px] flex items-center justify-center">

            {/* Floating Particles */}
            <motion.div
                animate={{
                    x: [0, 100], y: [0, -100], opacity: [0, 0.5, 0], rotate: [0, 360]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute top-[80%] left-[20%] w-1 h-1 bg-white/20 rounded-full"
            />
            <motion.div
                animate={{
                    x: [0, -100], y: [0, -100], opacity: [0, 0.5, 0], rotate: [0, 360]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
                className="absolute top-[60%] left-[80%] w-1 h-1 bg-white/10 rounded-full"
            />

            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
                {/* Pink Flow (Mother - Left: 25,15 to 50,50) */}
                <motion.path
                    d="M25 15 C 25 60, 50 20, 50 50"
                    fill="none"
                    stroke="#F472B6"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.path
                    d="M25 15 C 25 60, 50 20, 50 50"
                    fill="none"
                    stroke="#F472B6"
                    strokeWidth="0.5"
                    strokeDasharray="20"
                    strokeLinecap="round"
                    filter="drop-shadow(0 0 1px #F472B6)"
                    vectorEffect="non-scaling-stroke"
                    animate={{ strokeDashoffset: [1000, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Blue Flow (Father - Right: 75,15 to 50,50) */}
                <motion.path
                    d="M75 15 C 75 60, 50 20, 50 50"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                />
                <motion.path
                    d="M75 15 C 75 60, 50 20, 50 50"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="0.5"
                    strokeDasharray="20"
                    strokeLinecap="round"
                    filter="drop-shadow(0 0 1px #38BDF8)"
                    vectorEffect="non-scaling-stroke"
                    animate={{ strokeDashoffset: [1000, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 1 }}
                />

                {/* Mixing Point (Center 50,50) */}
                <motion.circle
                    cx="50" cy="50" r="3"
                    fill="#8B5CF6" fillOpacity="0.5"
                    filter="blur(1px)"
                    animate={{ scale: [1, 1.5, 1], filter: ["blur(1px)", "blur(3px)", "blur(1px)"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </svg>

            {/* NODES CONTAINER */}
            <div className="relative w-full h-full z-10 font-sans">

                {/* MADRE (Top Left) */}
                <motion.div
                    initial={{ opacity: 0, x: -50, y: -20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    className="absolute top-[5%] left-[10%] w-[30%] flex flex-col items-center gap-2"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="w-20 h-20 rounded-full border-[3px] bg-cover bg-center transition-transform hover:scale-110 duration-500 cursor-pointer shadow-[0_0_30px_rgba(236,72,153,0.4)] border-[#F472B6]"
                        style={{
                            backgroundImage: `url('${motherImg}')`,
                        }}
                    />
                    <span className="bg-[#1A231E]/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-pink-400 tracking-widest uppercase border border-pink-500/30">
                        {c.madre_nombre || 'Madre'}
                    </span>
                </motion.div>

                {/* PADRE (Top Right) */}
                <motion.div
                    initial={{ opacity: 0, x: 50, y: -20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
                    className="absolute top-[5%] right-[10%] w-[30%] flex flex-col items-center gap-2"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="w-20 h-20 rounded-full border-[3px] bg-cover bg-center transition-transform hover:scale-110 duration-500 cursor-pointer shadow-[0_0_30px_rgba(56,189,248,0.4)] border-[#38BDF8]"
                        style={{
                            backgroundImage: `url('${fatherImg}')`,
                        }}
                    />
                    <span className="bg-[#1A231E]/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-cyan-400 tracking-widest uppercase border border-cyan-500/30">
                        {c.padre_nombre || 'Padre'}
                    </span>
                </motion.div>

                {/* HÍBRIDO (Center Bottom) */}
                <div className="absolute top-[45%] inset-x-0 flex justify-center pointer-events-none z-20">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.8 }}
                        className="flex flex-col items-center pointer-events-auto"
                    >
                    <motion.div
                        animate={{ scale: [1, 1.02, 1], filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-40 h-40 rounded-[40px] bg-[#2E2E2E] border-[3px] flex items-center justify-center relative overflow-hidden group cursor-pointer bg-cover bg-center shadow-[0_0_50px_rgba(139,92,246,0.6)] border-[#8B5CF6]"
                        style={{
                            backgroundImage: childImg ? `url('${childImg}')` : undefined
                        }}
                    >
                        {/* Inner glow check */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-60 pointer-events-none"></div>

                        {/* Fallback Icon if no image */}
                        {!childImg && (
                            <span className="text-6xl relative z-10 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">🌱</span>
                        )}

                        {/* HIBRIDO LABEL (VIOLET) */}
                        <div className="absolute -bottom-10 group-hover:bottom-4 transition-all duration-500 bg-[#1A231E]/90 backdrop-blur-md text-[#A78BFA] border border-[#8B5CF6]/50 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_25px_rgba(139,92,246,0.6)] z-20">
                            HÍBRIDO
                        </div>
                    </motion.div>

                    {/* Stats Cards below */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        className="flex gap-3 mt-6"
                    >
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 px-4 flex flex-col items-center min-w-[70px]">
                            <span className="text-xs font-bold text-white/50 mb-1">FECHA</span>
                            <span className="text-[11px] font-bold text-white">{cross.fecha_cruza ? new Date(cross.fecha_cruza).toLocaleDateString() : '---'}</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 px-4 flex flex-col items-center min-w-[70px]">
                            <span className="text-xs font-bold text-white/50 mb-1">ESTADO</span>
                            <span className="text-[11px] font-bold text-green-400">Activo</span>
                        </div>
                    </motion.div>
                </motion.div>
                </div>

            </div>
        </div>
    );
};
