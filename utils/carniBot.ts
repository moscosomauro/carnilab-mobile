// ============================================================
// CARNI BOT - 100% en el dispositivo
// Antes vivía en una Edge Function de Supabase; ahora llama a
// Gemini directo con tu API key y las herramientas (alertas y
// diario) escriben en los datos locales de la app.
// ============================================================
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Plant, Alert, DiaryEntry } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface CarniBotActions {
    addAlert: (alert: Omit<Alert, 'id'>) => Promise<boolean>;
    addDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => Promise<boolean>;
}

export interface CarniBotMessage {
    role: 'user' | 'model';
    text: string;
}

const TOOLS: FunctionDeclaration[] = [
    {
        name: "set_alert",
        description: "Crea una alerta o recordatorio para el cuidado de una planta.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                plant_name: { type: Type.STRING, description: "El nombre exacto de la planta (ej: 'Dionaea B52')." },
                message: { type: Type.STRING, description: "El mensaje del recordatorio (ej: 'Regar', 'Revisar plaga')." },
                due_date: { type: Type.STRING, description: "La fecha y hora en formato ISO 8601 (ej: '2026-05-20T09:00:00')." },
                priority: { type: Type.STRING, description: "Prioridad: 'alta', 'media', 'baja'." }
            },
            required: ["plant_name", "message", "due_date"]
        }
    },
    {
        name: "add_diary_entry",
        description: "Agrega una nota al diario de cultivo de una planta.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                plant_name: { type: Type.STRING, description: "El nombre exacto de la planta." },
                category: { type: Type.STRING, description: "Categoría: 'riego', 'fertilizacion', 'poda', 'observacion'." },
                note: { type: Type.STRING, description: "El contenido de la nota o detalles de lo realizado." }
            },
            required: ["plant_name", "category", "note"]
        }
    }
];

export const askCarniBot = async (
    messages: CarniBotMessage[],
    image: string | null,
    plants: Plant[],
    actions: CarniBotActions
): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key-here") {
        return "⚠️ Falta configurar VITE_GEMINI_API_KEY en el archivo .env para usar Carni Bot.";
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const plantContext = plants.length > 0
        ? "MIS PLANTAS ACTUALES:\n" + plants.slice(0, 20).map(p =>
            `- ${p.nombre} (${p.especie}): Estado ${p.estado}${p.fecha_adquisicion ? `, Adquirida el ${p.fecha_adquisicion}` : ''} (ID: ${p.id})`
        ).join("\n")
        : "No tengo plantas registradas aún.";

    const currentMessage = messages[messages.length - 1]?.text || '';

    try {
        let response;

        if (image) {
            // Modo visión: diagnóstico de fotos
            const prompt = `
            ACTÚA COMO UN EXPERTO BOTÁNICO MUNDIAL ESPECIALIZADO EN PLANTAS CARNÍVORAS.

            Analiza la imagen adjunta con extrema precisión.

            TU OBJETIVO PRINCIPAL ES IDENTIFICAR EL CULTIVAR EXACTO SI ES POSIBLE.

            CONTEXTO DE MIS PLANTAS (Usa esto para cruzar datos):
            ${plantContext}

            INSTRUCCIONES DE ANÁLISIS:
            1. IDENTIFICACIÓN:
               - ¿Coincide visualmente con alguna planta de mi lista?
               - Si es una Dionaea, busca rasgos de cultivares famosos (ej: B52=dientes gigantes, Red Dragon=roja total, Alien=trampa alargada).
               - Si es Sarracenia/Nepenthes, fíjate en la forma del opérculo y peristoma.
               - Si NO estás 100% seguro del cultivar, di "Parece visualmente un [nombre], pero sin etiqueta genética es difícil confirmar".

            2. ESTADO DE SALUD Y SUSTRATO:
               - Evalúa salud general, plagas y si el sustrato es el correcto (musgo/perlita vs tierra).

            MENSAJE DEL USUARIO: "${currentMessage}"

            Responde en formato amigable, conciso y profesional.
            `;

            response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [
                    { inlineData: { mimeType: 'image/jpeg', data: image.split(',')[1] } },
                    { text: prompt }
                ]
            });
        } else {
            // Modo chat + herramientas
            const prompt = `
      Eres Carni Bot, el asistente experto y proactivo de CarniLab.

      CONTEXTO DE PLANTAS DEL USUARIO:
      ${plantContext}

      TUS CAPACIDADES:
      - Puedes responder preguntas botánicas.
      - Puedes programar ALERTAS reales usando la función 'set_alert'.
      - Puedes escribir notas en el DIARIO usando la función 'add_diary_entry'.
      - Puedes Diagnosticar fotos (si el usuario adjunta una).

      DIRECTRICES:
      - Si el usuario dice "Recuérdame regar la B52 mañana", USA la herramienta 'set_alert'.
      - Si el usuario dice "Anota que hoy podé la Nepenthes", USA la herramienta 'add_diary_entry'.
      - Si no sabes el nombre exacto de la planta, pregunta o usa el más parecido del contexto.
      - Hoy es ${new Date().toISOString()}.
      - Responde siempre amablemente confirmando la acción realizada.

      USUARIO DICE: "${currentMessage}"
    `;

            response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ text: prompt }],
                config: {
                    tools: [{ functionDeclarations: TOOLS }]
                }
            });
        }

        let finalText = response.text ?? '';

        // Ejecutar herramientas contra los datos LOCALES
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                const args: any = call.args || {};

                if (call.name === 'set_alert') {
                    const ok = await actions.addAlert({
                        planta: args.plant_name,
                        mensaje: args.message,
                        fecha: args.due_date || new Date().toISOString(),
                        tipo: 'Cuidado',
                        prioridad: (args.priority as Alert['prioridad']) || 'media',
                        completada: false,
                    });
                    finalText += ok
                        ? `\n\n✅ Alerta creada: "${args.message}" para ${args.plant_name}.`
                        : `\n\n⚠️ No pude crear la alerta.`;
                }

                if (call.name === 'add_diary_entry') {
                    const plant = plants.find(p => p.nombre === args.plant_name);
                    const ok = await actions.addDiaryEntry({
                        planta_nombre: args.plant_name,
                        planta_especie: plant?.especie || 'Desconocida',
                        fecha: new Date().toISOString().split('T')[0],
                        tipo: (args.category as DiaryEntry['tipo']) || 'observacion',
                        descripcion: args.note,
                        imagen: null,
                    });
                    finalText += ok
                        ? `\n\n📝 Nota guardada en el diario de ${args.plant_name}.`
                        : `\n\n⚠️ No pude guardar la nota en el diario.`;
                }
            }
        }

        return finalText || "Lo siento, no pude procesar esa solicitud.";
    } catch (error: any) {
        console.error("CarniBot error:", error);
        return `⚠️ Error de Carni Bot: ${error?.message || 'Error desconocido'}. ${navigator.onLine ? '' : 'Parece que no hay conexión a internet (la IA necesita internet).'}`;
    }
};
