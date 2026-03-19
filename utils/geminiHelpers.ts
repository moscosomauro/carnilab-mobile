

import { GoogleGenAI } from "@google/genai";

// ✅ API Keys movidas a variables de entorno por seguridad
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDQn8rNeNKDQaW8PILkaOnFDuK3Kz1-VWI";
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
    throw new Error("❌ GEMINI_API_KEY no configurado. Verifica tu archivo .env");
}

if (!STABILITY_API_KEY) {
    console.warn("⚠️ STABILITY_API_KEY no configurado. La generación de imágenes no estará disponible.");
}

export interface CultivarAnalysisResult {
    description: string;
    suggestedNames: string[];
    colors: {
        primary: string; // Hex code
        accent: string;  // Hex code
    };
}

export const analyzeCultivar = async (
    imageFile: File,
    motherName: string,
    fatherName: string
): Promise<CultivarAnalysisResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Convert File to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove prefix "data:image/jpeg;base64,"
                resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
        });

        const prompt = `
            Actúa como un experto botánico y diseñador gráfico.
            Analiza esta imagen de una planta carnívora (Sarracenia), cruce de ${motherName} x ${fatherName}.

            1. **Descripción**: Escribe una descripción DETALLADA (60-80 palabras) en ESPAÑOL. Analiza el patrón de venas, la coloración del labio, la forma del opérculo y la elegancia general. Usa un lenguaje técnico pero poético y evocador.
            2. **Nombres**: Sugiere 3 nombres comerciales épicos en Inglés o Latín (ej: "Royal Crimson").
            3. **Colores**: Extrae los 2 colores más dominantes y vibrantes de la planta en formato HEX.
               - "primary": El color principal del cuerpo/tubo.
               - "accent": El color de las venas o el detalle más llamativo (ej: rojo intenso, burdeos).

            **IMPORTANTE: LA DESCRIPCIÓN DEBE SER EN ESPAÑOL.**

            Formato JSON exacto:
            {
                "description": "...",
                "names": ["Nombre 1", "Nombre 2", "Nombre 3"],
                "colors": { "primary": "#RRGGBB", "accent": "#RRGGBB" }
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "{}";
        const json = JSON.parse(text);

        return {
            description: json.description || "Un espécimen exquisito con un potencial único.",
            suggestedNames: json.names || ["S. Unnamed", "S. Hybrid", "S. Selection"],
            colors: json.colors || { primary: "#C8E6C9", accent: "#2E7D32" }
        };

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Failed to analyze cultivar.");
    }
};

// ✅ Nueva interfaz para escenarios genéticos
export interface GeneticScenario {
    name: string;
    description: string;
    imagePrompt: string;
    traits: {
        colorPattern: string;
        size: string;
        shape: string;
        uniqueFeature: string;
    };
    probability: number;
}

export interface GeneticSimulationResult {
    scenarios: GeneticScenario[];
    parentalAnalysis: string;
}

// ✅ Función para generar 3 escenarios genéticos usando Gemini
export const generateGeneticScenarios = async (
    motherImage: File,
    fatherImage: File,
    motherName: string,
    fatherName: string,
    species: string
): Promise<GeneticSimulationResult> => {
    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

        // Convert images to Base64
        const motherBase64 = await fileToBase64(motherImage);
        const fatherBase64 = await fileToBase64(fatherImage);

        const prompt = `
            Actúa como un genetista experto en ${species}, especializado en herencia mendeliana y poligenética.
            
            **PASO 1: ANÁLISIS FENOTÍPICO DETALLADO Y MUTACIONES**
            Analiza estas imágenes de parentales de ${species} e identifica:
            - **Mutaciones Estructurales (CRÍTICO)**: ¿Tiene forma 'Alien' (trampas arqueadas/fusionadas)? ¿'Cup Trap' (forma de copa)? ¿'Wacky Traps' (dientes locos)? ¿'Pom Pom'?
            - Madre (${motherName}): Color, patrón, y sobre todo **FORMA Y ESTRUCTURA DE LA TRAMPA/JARRA**.
            - Padre (${fatherName}): Color, patrón, y sobre todo **FORMA Y ESTRUCTURA DE LA TRAMPA/JARRA**.
            
            **PASO 2: ASIGNACIÓN GENOTÍPICA**
            Basándote en el conocimiento de genética de ${species}:
            - Dionaea 'Alien'/'Fused': Rasgos a menudo recesivos o de herencia compleja.
            - Dionaea 'Cup Trap': Rasgo recesivo.
            - Estructuras "deformes" (mutaciones) deben mantenerse si la genética lo sugiere.
            
            REGLAS DE DOMINANCIA POR ESPECIE:
            - Sarracenia: Rojo (R) > Verde (r), Venas prominentes (V) > Sin venas (v)
            - Dionaea: Dientes normales suele dominar a dientes cortos/fusionados (intermedia en F1)
            
            **PASO 3: CUADROS DE PUNNETT Y HERENCIA DE MUTACIONES**
            - Si cruzas dos mutantes, la descendencia debe ser muy mutante.
            - Si cruzas mutante x normal, busca fenotipos intermedios interesantes.
            
            **PASO 4: GENERAR 3 ESCENARIOS REALISTAS**
            Crea exactamente 3 escenarios basados en las combinaciones genéticas MÁS PROBABLES:
            
            Para cada escenario:
            1. **name**: Nombre científico (ej: "${species} 'Nombre Cultivar'")
            2. **description**: Descripción GENÉTICAMENTE PRECISA en español (60-80 palabras):
               - Explica QUÉ rasgos heredó de cada parental
               - Menciona si es dominancia completa, intermedia o codominancia
               - Usa terminología científica correcta
            3. **imagePrompt**: Prompt DETALLADO en inglés para ${species}, ENFATIZANDO LA FORMA:
               - Si hay mutación (Alien, Cup, Wacky), descríbela FÍSICAMENTE: "traps fused at the spine", "cup-shaped traps", "jagged irregular teeth", "recurved margins".
               - NO uses solo el nombre del cultivar, describe la FORMA EXÓTICA.
               - Ejemplo deformidad: "Close-up of a Dionaea with elongated, arched traps fused at the far end, creating an 'Alien' head shape, with short bristly teeth."
               - Morfología precisa: color, patrón, tamaño, forma única.
            4. **traits**: 
               - colorPattern: patrón exacto heredado
               - size: small/medium/large
               - shape: describir la deformidad/forma con precisión (ej: "Fused Arched Trap")
               - uniqueFeature: rasgo distintivo heredado
            5. **probability**: Probabilidad CALCULADA basada en cuadros de Punnett (las 3 deben sumar 100%)
            
            **VALIDACIÓN CIENTÍFICA:**
            - Los 3 escenarios deben representar las 3 combinaciones más probables
            - NO inventes rasgos imposibles (ej: Dionaea azul)
            - Respeta las limitaciones genéticas conocidas de ${species}
            - Las probabilidades deben reflejar frecuencias mendelianas reales
            
            Formato JSON:
            {
                "parentalAnalysis": "Análisis genético detallado (3-4 líneas): fenotipos observados, genotipos asignados, patrón de herencia esperado",
                "scenarios": [
                    {
                        "name": "${species} 'Nombre Único'",
                        "description": "Descripción genéticamente precisa...",
                        "imagePrompt": "Detailed prompt for ${species}...",
                        "traits": {
                            "colorPattern": "específico",
                            "size": "medium",
                            "shape": "específica para especie",
                            "uniqueFeature": "heredada de parental"
                        },
                        "probability": 25
                    }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: motherBase64 } },
                    { inlineData: { mimeType: 'image/jpeg', data: fatherBase64 } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "{}";
        const json = JSON.parse(text);

        return {
            parentalAnalysis: json.parentalAnalysis || "Análisis de parentales en progreso...",
            scenarios: json.scenarios || []
        };

    } catch (error) {
        console.error("Genetic Scenario Generation Error:", error);
        throw new Error("Failed to generate genetic scenarios.");
    }
};

// ✅ Función para generar imagen usando Supabase Edge Function (Stability AI Proxy)
export const generateScenarioImage = async (imagePrompt: string): Promise<string> => {
    try {
        console.log('🎨 Generating image via Supabase Edge Function:', imagePrompt);

        // Get Supabase URL from environment
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('Supabase configuration missing');
        }

        // Call Supabase Edge Function
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                prompt: imagePrompt
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Edge Function error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.success || !data.image) {
            throw new Error(data.error || 'No image data returned');
        }

        console.log('✅ Image generated successfully via Edge Function ($0.004)');
        return data.image;

    } catch (error: any) {
        console.error("❌ Image Generation Error:", error);

        // Log más detallado del error
        if (error.message) {
            console.error("Error Message:", error.message);
        }

        // Retornar string vacío en caso de error para mostrar placeholder
        return '';
    }
};

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};
