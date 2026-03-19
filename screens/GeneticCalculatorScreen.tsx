import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { generateGeneticScenarios, generateScenarioImage, GeneticScenario } from '../utils/geminiHelpers';

interface ParentPlant {
    name: string;
    image: File | null;
    imageUrl: string | null;
}

const GeneticCalculatorScreen: React.FC = () => {
    const navigate = useNavigate();

    // Species Selection
    const [species, setSpecies] = useState<string>('Dionaea');

    // Parent State
    const [mother, setMother] = useState<ParentPlant>({ name: '', image: null, imageUrl: null });
    const [father, setFather] = useState<ParentPlant>({ name: '', image: null, imageUrl: null });

    // Simulation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [scenarios, setScenarios] = useState<GeneticScenario[]>([]);
    const [parentalAnalysis, setParentalAnalysis] = useState<string>('');
    const [scenarioImages, setScenarioImages] = useState<string[]>([]);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);

    // Handle Image Upload
    const handleImageUpload = (parent: 'mother' | 'father', file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (parent === 'mother') {
                setMother(prev => ({ ...prev, image: file, imageUrl }));
            } else {
                setFather(prev => ({ ...prev, image: file, imageUrl }));
            }
        };
        reader.readAsDataURL(file);
    };

    // Generate Genetic Scenarios
    const handleGenerateScenarios = async () => {
        if (!mother.image || !father.image || !mother.name || !father.name) {
            alert('Por favor completa todos los campos (nombre e imagen de ambos parentales)');
            return;
        }

        setIsGenerating(true);
        setScenarios([]);
        setParentalAnalysis('');
        setScenarioImages([]);

        try {
            const result = await generateGeneticScenarios(
                mother.image,
                father.image,
                mother.name,
                father.name,
                species
            );

            setScenarios(result.scenarios);
            setParentalAnalysis(result.parentalAnalysis);

            // Auto-generate images for scenarios
            await generateImages(result.scenarios);

        } catch (error) {
            console.error('Error generating scenarios:', error);
            alert('Error al generar escenarios. Por favor intenta nuevamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate Images for Scenarios
    const generateImages = async (scenariosToGenerate: GeneticScenario[]) => {
        setIsGeneratingImages(true);
        const images: string[] = [];

        try {
            for (const scenario of scenariosToGenerate) {
                const imageData = await generateScenarioImage(scenario.imagePrompt);
                images.push(imageData);
            }
            setScenarioImages(images);
        } catch (error) {
            console.error('Error generating images:', error);
        } finally {
            setIsGeneratingImages(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F1EB] font-display flex flex-col items-center">
            {/* Texture */}
            <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />

            {/* Header */}
            <div className="relative z-10 w-full max-w-6xl px-6 pt-10 pb-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4A5D4F]">
                    <Icon name="arrow_back" className="text-xl" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-[#2E2E2E] tracking-tight">Simulador Genético</h1>
                    <p className="text-[#8E877F] text-xs font-medium uppercase tracking-widest">Plantas Carnívoras • Análisis IA</p>
                </div>
            </div>

            {/* Species Selector */}
            <div className="relative z-10 w-full max-w-6xl px-6 pb-6">
                <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-[#4A5D4F]/10">
                    <label className="block text-xs font-black text-[#8E877F] uppercase tracking-wider mb-2">
                        Especie de Planta Carnívora
                    </label>
                    <select
                        value={species}
                        onChange={(e) => setSpecies(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F5F1EB] rounded-xl border-2 border-[#4A5D4F]/20 focus:border-[#4A5D4F] outline-none font-bold text-[#2E2E2E] cursor-pointer"
                    >
                        <option value="Dionaea">🪤 Dionaea (Venus Atrapamoscas)</option>
                        <option value="Sarracenia">🏺 Sarracenia (Trompeta Norteamericana)</option>
                        <option value="Nepenthes">🍶 Nepenthes (Planta Jarro Tropical)</option>
                        <option value="Drosera">💧 Drosera (Rocío de Sol)</option>
                        <option value="Cephalotus">🎩 Cephalotus (Planta Jarro Australiana)</option>
                        <option value="Darlingtonia">🐍 Darlingtonia (Lirio Cobra)</option>
                        <option value="Pinguicula">🌸 Pinguicula (Grasilla)</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-6xl px-6 pb-32 space-y-8">

                {/* PARENT SELECTORS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mother */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[#EF4444]/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                                🌸
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#2E2E2E]">Madre (♀)</h3>
                                <p className="text-xs text-[#8E877F]">Parental Femenino</p>
                            </div>
                        </div>

                        <input
                            type="text"
                            placeholder="Nombre del cultivar (ej: Alien)"
                            value={mother.name}
                            onChange={(e) => setMother(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full mb-4 px-4 py-3 bg-[#F5F1EB] rounded-xl border-2 border-transparent focus:border-[#EF4444] outline-none font-bold text-[#2E2E2E] placeholder:text-[#8E877F]/50"
                        />

                        <div className="relative">
                            {mother.imageUrl ? (
                                <div className="relative group">
                                    <img
                                        src={mother.imageUrl}
                                        alt="Madre"
                                        className="w-full h-64 object-cover rounded-2xl"
                                    />
                                    <button
                                        onClick={() => setMother({ name: mother.name, image: null, imageUrl: null })}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <label className="block w-full h-64 border-2 border-dashed border-[#EF4444]/30 rounded-2xl cursor-pointer hover:bg-red-50 transition-colors flex flex-col items-center justify-center gap-3">
                                    <Icon name="add_photo_alternate" className="text-5xl text-[#EF4444]/40" />
                                    <span className="text-sm font-bold text-[#8E877F]">Subir Foto</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload('mother', e.target.files[0])}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Father */}
                    <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-[#3B82F6]/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                                🌿
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-[#2E2E2E]">Padre (♂)</h3>
                                <p className="text-xs text-[#8E877F]">Parental Masculino</p>
                            </div>
                        </div>

                        <input
                            type="text"
                            placeholder="Nombre del cultivar (ej: Wine Mouth)"
                            value={father.name}
                            onChange={(e) => setFather(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full mb-4 px-4 py-3 bg-[#F5F1EB] rounded-xl border-2 border-transparent focus:border-[#3B82F6] outline-none font-bold text-[#2E2E2E] placeholder:text-[#8E877F]/50"
                        />

                        <div className="relative">
                            {father.imageUrl ? (
                                <div className="relative group">
                                    <img
                                        src={father.imageUrl}
                                        alt="Padre"
                                        className="w-full h-64 object-cover rounded-2xl"
                                    />
                                    <button
                                        onClick={() => setFather({ name: father.name, image: null, imageUrl: null })}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <label className="block w-full h-64 border-2 border-dashed border-[#3B82F6]/30 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-3">
                                    <Icon name="add_photo_alternate" className="text-5xl text-[#3B82F6]/40" />
                                    <span className="text-sm font-bold text-[#8E877F]">Subir Foto</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload('father', e.target.files[0])}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleGenerateScenarios}
                        disabled={isGenerating || !mother.image || !father.image || !mother.name || !father.name}
                        className="px-8 py-4 bg-gradient-to-r from-[#4A5D4F] to-[#6B8E23] text-white font-black rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                        {isGenerating ? (
                            <>
                                <Icon name="autorenew" className="text-xl animate-spin" />
                                Generando Escenarios...
                            </>
                        ) : (
                            <>
                                <Icon name="science" className="text-xl" />
                                Generar 3 Escenarios Genéticos
                            </>
                        )}
                    </button>
                </div>

                {/* Parental Analysis */}
                {parentalAnalysis && (
                    <div className="bg-white rounded-3xl p-6 shadow-lg">
                        <h3 className="text-sm font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Icon name="analytics" />
                            Análisis de Parentales
                        </h3>
                        <p className="text-base text-[#4A5D4F] leading-relaxed font-medium">
                            {parentalAnalysis}
                        </p>
                    </div>
                )}

                {/* SCENARIOS */}
                {scenarios.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-[#2E2E2E] text-center">
                            Escenarios Genéticos Posibles
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {scenarios.map((scenario, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-[#4A5D4F]/10 hover:border-[#4A5D4F]/30 transition-all"
                                >
                                    {/* Image */}
                                    <div className="relative h-64 bg-gradient-to-br from-[#4A5D4F]/10 to-[#6B8E23]/10">
                                        {isGeneratingImages ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Icon name="autorenew" className="text-5xl text-[#4A5D4F] animate-spin mb-2" />
                                                    <p className="text-xs font-bold text-[#8E877F]">Analizando genética...</p>
                                                </div>
                                            </div>
                                        ) : scenarioImages[index] ? (
                                            <img
                                                src={`data:image/png;base64,${scenarioImages[index]}`}
                                                alt={scenario.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                                <div className="text-6xl mb-3">🧬</div>
                                                <p className="text-xs font-bold text-[#4A5D4F] text-center">
                                                    Visualización conceptual
                                                </p>
                                                <p className="text-[9px] text-[#8E877F] text-center mt-1">
                                                    {scenario.traits.colorPattern}
                                                </p>
                                            </div>
                                        )}

                                        {/* Probability Badge */}
                                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                                            <span className="text-white text-xs font-black">{scenario.probability}%</span>
                                        </div>

                                        {/* Scenario Number */}
                                        <div className="absolute top-3 left-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-lg font-black text-[#4A5D4F]">{index + 1}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black text-[#2E2E2E] italic mb-2">
                                                {scenario.name}
                                            </h3>
                                            <p className="text-sm text-[#4A5D4F] leading-relaxed">
                                                {scenario.description}
                                            </p>
                                        </div>

                                        {/* Traits */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-[#F5F1EB] rounded-xl p-3">
                                                <p className="text-[9px] font-black text-[#8E877F] uppercase mb-1">Tamaño</p>
                                                <p className="text-xs font-bold text-[#2E2E2E] capitalize">{scenario.traits.size}</p>
                                            </div>
                                            <div className="bg-[#F5F1EB] rounded-xl p-3">
                                                <p className="text-[9px] font-black text-[#8E877F] uppercase mb-1">Forma</p>
                                                <p className="text-xs font-bold text-[#2E2E2E] capitalize">{scenario.traits.shape}</p>
                                            </div>
                                            <div className="bg-[#F5F1EB] rounded-xl p-3 col-span-2">
                                                <p className="text-[9px] font-black text-[#8E877F] uppercase mb-1">Patrón</p>
                                                <p className="text-xs font-bold text-[#2E2E2E]">{scenario.traits.colorPattern}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-[#4A5D4F]/10 to-[#6B8E23]/10 rounded-xl p-3 col-span-2 border border-[#4A5D4F]/20">
                                                <p className="text-[9px] font-black text-[#4A5D4F] uppercase mb-1">Característica Única</p>
                                                <p className="text-xs font-bold text-[#2E2E2E]">{scenario.traits.uniqueFeature}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {scenarios.length === 0 && !isGenerating && (
                    <div className="bg-white/50 border-2 border-dashed border-[#4A5D4F]/20 rounded-3xl p-12 text-center">
                        <Icon name="science" className="text-7xl text-[#8E877F]/30 mb-4 block mx-auto" />
                        <h3 className="text-xl font-black text-[#2E2E2E] mb-2">
                            Laboratorio Genético
                        </h3>
                        <p className="text-sm font-medium text-[#8E877F] max-w-md mx-auto">
                            Carga las imágenes de ambos parentales y genera 3 posibles escenarios genéticos con IA.
                            Las imágenes se generarán automáticamente basándose en las características de los padres.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneticCalculatorScreen;
