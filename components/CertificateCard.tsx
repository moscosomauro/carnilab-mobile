
import { forwardRef } from 'react';
import { Leaf, Droplets, Sun, User, Share2, MapPin, BookOpen } from 'lucide-react'; // Removed unused imports

// Custom DNA Icon SVG since it might not be in the Lucide version installed
const DnaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
        <path d="M17 6l-2.5-2.5" />
        <path d="M14 8l-1-1" />
        <path d="M7 18l2.5 2.5" />
        <path d="M3.5 14.5l-1 1" />
        <path d="M20 9c-1.798 1.998-2.518 3.995-2.807 5.993" />
        <path d="M14 16l-1 1" />
        <path d="M9.5 20.5l-1 1" />
        <path d="M4 4c6.667 6 13.333 0 20 6" />
        <path d="M6 8l-2-2" />
        <path d="M12 14l-2 2" />
    </svg>
);

export interface CertificateProps {
    cultivarName: string;
    motherName: string;
    fatherName: string;
    motherPhoto?: string;
    fatherPhoto?: string;
    seedlingPhoto: string;
    description: string;
    genNumber: string;
    date: string;
    primaryColor?: string;
    accentColor?: string;
    cultivatorName?: string;
}

export const CertificateCard = forwardRef<HTMLDivElement, CertificateProps>(({
    cultivarName, motherName, fatherName, motherPhoto, fatherPhoto, seedlingPhoto, description, genNumber, date,
    primaryColor = "#E8F5E9", accentColor = "#C8E6C9", cultivatorName = "CarniLab"
}, ref) => {
    return (
        <div ref={ref} className="w-[390px] h-[844px] relative overflow-hidden flex flex-col items-center select-none font-sans" style={{ background: '#F5F5F5' }}>

            {/* 1. Dynamic Background Blurs */}
            <div className="absolute inset-0 z-0 bg-white">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` }}></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-30 blur-[100px]"
                    style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}></div>
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full flex flex-col px-5 pt-8 pb-8">

                {/* HEAD: TITLE & PARENTS */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                            Ficha Técnica • {date} • ID: {genNumber}
                        </span>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-gray-800 tracking-tight leading-none" style={{ fontFamily: '"Manrope", sans-serif' }}>
                                {cultivarName}
                            </h1>
                            <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center border border-white/60">
                                <DnaIcon />
                            </div>
                        </div>
                    </div>

                    {/* Floating Parent Bubbles - Overlapping */}
                    <div className="flex items-center -space-x-4">
                        <div className="relative flex flex-col items-center z-10">
                            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100">
                                <img src={motherPhoto || '/placeholder_leaf.png'} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[6px] font-bold bg-white/80 backdrop-blur px-1.5 py-0.5 rounded-full mt-[-6px] z-20 shadow-sm uppercase">{motherName.split(' ')[0]}</span>
                        </div>
                        <div className="relative flex flex-col items-center z-0 scale-90 opacity-90">
                            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100">
                                <img src={fatherPhoto || '/placeholder_leaf.png'} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[6px] font-bold bg-white/80 backdrop-blur px-1.5 py-0.5 rounded-full mt-[-6px] z-20 shadow-sm uppercase">{fatherName.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>

                {/* VISUAL: MAIN PHOTO CARD */}
                <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl mb-[-20px] z-20 border-[4px] border-white">
                    <img src={seedlingPhoto} className="w-full h-full object-cover" />

                    {/* Top Right Index Badge? */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold">
                        1/1
                    </div>

                    {/* Genetics DNA Bubble Button */}
                    <div className="absolute bottom-8 right-6 w-12 h-12 rounded-full bg-[#1A1A1A] border-2 border-white/20 shadow-lg flex items-center justify-center">
                        <span className="text-xl">🧬</span>
                    </div>
                </div>

                {/* INFO CARD (White Sheet) */}
                <div className="bg-white/90 backdrop-blur-xl rounded-[24px] shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] pt-10 px-5 pb-6 w-full flex-grow flex flex-col gap-4 border border-white">

                    {/* SECTION: GENETICS */}
                    <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                                <Leaf size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Genética</h3>
                                <p className="text-xs font-bold text-gray-800 leading-tight">
                                    Cruza Registrada: {motherName.split('\'').join('')} x {fatherName.split('\'').join('')}
                                </p>
                            </div>
                        </div>
                        <button className="text-gray-400">
                            <Share2 size={16} />
                        </button>
                    </div>

                    {/* SECTION: CARE */}
                    <div className="flex flex-col gap-2 border-b border-gray-100 pb-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuidados</h3>
                        <div className="grid grid-cols-1 gap-1.5">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Sun size={12} className="text-orange-400" />
                                <span>Luz: 8-10h sol directo</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Droplets size={12} className="text-blue-400" />
                                <span>Riego: Siempre húmedo, agua destilada</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={12} className="text-amber-700" />
                                <span>Sustrato: Turba Rubia + Perlita (1:1)</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: COMMUNITY */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700">
                                <User size={16} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comunidad</h3>
                                <p className="text-xs font-bold text-gray-800">
                                    Seguir Cultivador: @{cultivatorName.replace(/\s+/g, '_').toLowerCase()}
                                </p>
                                <div className="flex text-yellow-400 text-[10px] mt-0.5">★★★★★ <span className="text-gray-400 ml-1">(New)</span></div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 flex flex-col items-center">
                            <MapPin size={16} />
                            <span className="text-[8px]">Cerca de ti</span>
                        </div>
                    </div>

                    {/* SECTION: NOTES */}
                    <div className="flex gap-3">
                        <div className="mt-1 text-gray-400">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notas del Cultivador</h3>
                            <p className="text-[10px] leading-relaxed text-gray-600 italic line-clamp-3">
                                "{description}"
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
});

CertificateCard.displayName = "CertificateCard";
