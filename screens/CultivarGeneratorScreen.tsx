
import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Cross } from '../types';
import { analyzeCultivar } from '../utils/geminiHelpers';
import { CertificateCard } from '../components/CertificateCard';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';

export const CultivarGeneratorScreen: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const crossData = location.state?.cross as Cross;

    // States
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Photo, 2: AI Analysis, 3: Finalize
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(crossData.hibrido_imagen || null);
    const [analysis, setAnalysis] = useState<{ description: string; suggestedNames: string[]; colors: { primary: string; accent: string } } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedName, setSelectedName] = useState("");
    const [customName, setCustomName] = useState("");
    const [finalDescription, setFinalDescription] = useState("");

    const cardRef = useRef<HTMLDivElement>(null);

    // Safeguard
    if (!crossData) {
        return (
            <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center p-6 text-center">
                <p>No se seleccionó una cruza válida.</p>
                <button onClick={() => navigate(-1)} className="block mt-4 text-blue-600">Volver</button>
            </div>
        );
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const runAnalysis = async () => {
        if (!imageFile) return;
        setIsLoading(true);
        try {
            const result = await analyzeCultivar(imageFile, crossData.madre_nombre, crossData.padre_nombre);
            setAnalysis(result);
            setFinalDescription(result.description);
            setStep(2);
        } catch (error: any) {
            console.error("Cultivar Analysis Error:", error);
            alert(`Error al analizar: ${error?.message || error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!cardRef.current) return;
        setIsLoading(true);
        try {
            // Render High Quality Canvas
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // Retina quality
                backgroundColor: null,
                logging: false,
                useCORS: true
            });

            // For now, just download it to simulate "Saving"
            const link = document.createElement('a');
            link.download = `Certificado-${selectedName || customName || 'Cultivar'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // TODO: Upload to Supabase and Save Plant Record
            // await uploadCultivar(blob, ...);

            alert("¡Certificado generado y descargado! (Simulación: En producción se guardaría en tu inventario)");
            navigate('/dashboard');

        } catch (err) {
            console.error(err);
            alert("Error al generar la imagen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center pb-20 overflow-x-hidden">
            {/* Header */}
            <div className="w-full max-w-[390px] pt-12 px-6 mb-6">
                <button onClick={() => navigate(-1)} className="text-[#8E877F] mb-4 flex items-center gap-2 text-sm font-bold">
                    ← Volver
                </button>
                <h1 className="text-2xl font-black text-[#2E2E2E]">Nuevo Cultivar</h1>
                <p className="text-sm text-[#8E877F] italic">De: {crossData.nombre}</p>
            </div>

            <div className="w-full max-w-[390px] px-6 flex flex-col items-center">

                {/* STEP 1: PHOTO */}
                {step === 1 && (
                    <div className="w-full animate-in slide-in-from-right">
                        <div className="aspect-[3/4] bg-white rounded-3xl border-2 border-dashed border-[#A5A98F] flex flex-col items-center justify-center relative overflow-hidden mb-6 shadow-sm">
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-6">
                                    <span className="text-4xl block mb-2">📸</span>
                                    <p className="text-sm font-bold text-[#8E877F]">Sube la foto del "Elegido"</p>
                                </div>
                            )}
                            <input type="file" onChange={handlePhotoSelect} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={!imageFile || isLoading}
                            className="w-full h-14 bg-[#2E2E2E] text-white font-black rounded-full shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? 'ANALIZANDO GENÉTICA...' : 'ANALIZAR CON IA ✨'}
                        </button>
                    </div>
                )}

                {/* STEP 2: DETAILS */}
                {step === 2 && analysis && (
                    <div className="w-full animate-in slide-in-from-right space-y-6">

                        {/* Name Selection */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-black text-[#8E877F] uppercase tracking-wider mb-4">ELIGE UN NOMBRE</h3>
                            <div className="space-y-3">
                                {analysis.suggestedNames.map((name: string) => (
                                    <button
                                        key={name}
                                        onClick={() => { setSelectedName(name); setCustomName(""); }}
                                        className={`w-full py-3 px-4 rounded-xl text-left text-sm font-bold border transition-all ${selectedName === name ? 'border-[#4CAF50] bg-[#E8F5E9] text-[#2E7D32]' : 'border-[#F0F0F0] text-[#4A5D4F]'}`}
                                    >
                                        S. '{name}'
                                    </button>
                                ))}
                                <input
                                    placeholder="O escribe uno propio..."
                                    value={customName}
                                    onChange={e => { setCustomName(e.target.value); setSelectedName(""); }}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-bold border border-[#F0F0F0] bg-[#F9F9F9] focus:outline-none focus:border-[#2E2E2E]"
                                />
                            </div>
                        </div>

                        {/* Description Editing */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm">
                            <h3 className="text-sm font-black text-[#8E877F] uppercase tracking-wider mb-2">ANÁLISIS BOTÁNICO</h3>
                            <textarea
                                value={finalDescription}
                                onChange={e => setFinalDescription(e.target.value)}
                                className="w-full text-sm text-[#5D5750] italic bg-transparent resize-none focus:outline-none h-24"
                            />
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            disabled={(!selectedName && !customName)}
                            className="w-full h-14 bg-[#4A5D4F] text-white font-black rounded-full shadow-xl"
                        >
                            VER CERTIFICADO →
                        </button>
                    </div>
                )}

                {/* STEP 3: PREVIEW */}
                {step === 3 && imagePreview && (
                    <div className="w-full flex flex-col items-center animate-in zoom-in">

                        <div className="scale-[0.85] origin-top shadow-2xl rounded-sm">
                            <CertificateCard
                                ref={cardRef}
                                cultivarName={`${customName || selectedName}`}
                                motherName={crossData.madre_nombre}
                                fatherName={crossData.padre_nombre}
                                motherPhoto={crossData.madre_imagen || undefined}
                                fatherPhoto={crossData.padre_imagen || undefined}
                                seedlingPhoto={imagePreview}
                                description={finalDescription}
                                genNumber={`CL-${Math.floor(Math.random() * 10000)}`} // Sim ID
                                date={new Date().toLocaleDateString()}
                                primaryColor={analysis?.colors.primary}
                                accentColor={analysis?.colors.accent}
                                cultivatorName={user?.slug || user?.label || "Invitado"}
                            />
                        </div>

                        <div className="w-full flex gap-3 mt-[-40px] z-10 px-4">
                            <button onClick={() => setStep(2)} className="flex-1 h-12 bg-white text-[#8E877F] font-black rounded-full shadow-lg"> EDITAR </button>
                            <button onClick={handleGenerate} className="flex-[2] h-12 bg-[#D4AF37] text-white font-black rounded-full shadow-lg flex items-center justify-center gap-2">
                                {isLoading ? 'GENERANDO...' : 'CERTIFICAR 🏅'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CultivarGeneratorScreen;
