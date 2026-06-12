

import { GoogleGenAI } from "@google/genai";

// ✅ API Keys movidas a variables de entorno por seguridad
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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
            model: 'gemini-2.0-flash-lite',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                { text: prompt }
            ]
        });

        const text = response.text ?? "{}";
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
            model: 'gemini-2.0-flash-lite',
            contents: [
                { inlineData: { mimeType: 'image/jpeg', data: motherBase64 } },
                { inlineData: { mimeType: 'image/jpeg', data: fatherBase64 } },
                { text: prompt }
            ]
        });

        const text = response.text ?? "{}";
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

// ✅ Generación de imagen llamando directo a Stability AI (sin Supabase)
export const generateScenarioImage = async (imagePrompt: string): Promise<string> => {
    try {
        if (!STABILITY_API_KEY) {
            console.warn('⚠️ STABILITY_API_KEY no configurado; se omite la generación de imagen.');
            return '';
        }

        console.log('🎨 Generating image via Stability AI:', imagePrompt);

        const formData = new FormData();
        formData.append('prompt', imagePrompt);
        formData.append('output_format', 'jpeg');
        formData.append('aspect_ratio', '1:1');

        const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STABILITY_API_KEY}`,
                'Accept': 'application/json',
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.text().catch(() => '');
            throw new Error(`Stability API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        if (!data.image) {
            throw new Error('No image data returned');
        }

        console.log('✅ Image generated successfully via Stability AI');
        return `data:image/jpeg;base64,${data.image}`;

    } catch (error: any) {
        console.error("❌ Image Generation Error:", error?.message || error);
        // Retornar string vacío en caso de error para mostrar placeholder
        return '';
    }
};

// ✅ Análisis genético/fenotípico de progenie (antes Edge Function con Claude)
const ANALYSIS_SYSTEM_PROMPT = `Eres un experto botánico especializado en plantas carnívoras, específicamente en genética y fenotipado de Dionaea muscipula (Venus Flytrap).

Analiza la fotografía y responde EXCLUSIVAMENTE en formato JSON válido con esta estructura exacta:

{
  "coloration": { "dominant": "red" | "green" | "mixed", "percentage": <0-100>, "description": "<patrón de coloración>" },
  "trap_size": { "category": "miniature" | "small" | "medium" | "large" | "giant", "estimated_cm": <número> },
  "teeth_shape": { "type": "short" | "medium" | "long" | "fused", "description": "<dientes/cilios>" },
  "vigor": { "level": "low" | "medium" | "high", "score": <1-10> },
  "anthocyanins": { "present": true | false, "intensity": "none" | "light" | "moderate" | "strong" },
  "growth_pattern": { "type": "upright" | "prostrate" | "rosette", "description": "<patrón>" },
  "traits": ["<rasgo 1>", "<rasgo 2>"],
  "raw_analysis": "<análisis en texto libre, máximo 3 párrafos>",
  "confidence": <0.0-1.0>
}

REGLAS: Sé preciso basándote SOLO en lo visible. Los "traits" son características heredables notables. NUNCA inventes datos no visibles.`;

export const analyzeCrossImage = async (
    imageBase64: string,
    crossName?: string | null,
    parentInfo?: string | null
): Promise<any> => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    let contextPrompt = "Analiza esta planta carnívora y extrae toda la información fenotípica visible.";
    if (crossName || parentInfo) {
        contextPrompt = `Analiza esta planta carnívora que es PROGENIE de una cruza.
${crossName ? `Nombre de la cruza: ${crossName}` : ''}
${parentInfo ? `Información de parentales: ${parentInfo}` : ''}
Evalúa qué rasgos podrían haberse heredado de los parentales y cuáles son únicos de este espécimen.`;
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: `${ANALYSIS_SYSTEM_PROMPT}\n\n${contextPrompt}` }
        ]
    });

    const text = response.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    // Fallback si el modelo no devolvió JSON
    return {
        coloration: { dominant: "mixed", percentage: 50, description: "No se pudo analizar automáticamente" },
        trap_size: { category: "medium", estimated_cm: 2 },
        teeth_shape: { type: "medium", description: "No se pudo analizar automáticamente" },
        vigor: { level: "medium", score: 5 },
        anthocyanins: { present: false, intensity: "none" },
        growth_pattern: { type: "rosette", description: "No se pudo analizar automáticamente" },
        traits: [],
        raw_analysis: text,
        confidence: 0.3
    };
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
