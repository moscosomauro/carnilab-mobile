// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { messages, image } = await req.json();

        // 1. Initialize Supabase Client (User Context)
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            return new Response(
                JSON.stringify({ text: "Error: No se recibió header Authorization." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // 2. Get User ID
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (!user || authError) {
            console.error("Auth Error:", authError);
            return new Response(
                JSON.stringify({
                    text: `Error de Autenticación: ${authError?.message || 'Usuario no encontrado'}. 
                    Debug: HeaderLen=${authHeader.length}, URL=${!!Deno.env.get('SUPABASE_URL')}, KEY=${!!Deno.env.get('SUPABASE_ANON_KEY')}`
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. GET LICENSE KEY (Standard User Lookup)
        // Reverted to User Client to avoid Service Role Key issues.
        // AuthContext proves this query works for the authenticated user.
        const { data: licenseData, error: licenseError } = await supabaseClient
            .from('access_keys')
            .select('key')
            .eq('device_id', user.id)
            .maybeSingle();

        if (licenseError) {
            console.error("License fetch error:", licenseError);
            return new Response(
                JSON.stringify({ text: `Error de Sistema (Licencia): ${licenseError.message}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const ownerKey = licenseData?.key;

        if (!ownerKey) {
            console.error("No license key found for user", user.id);
            return new Response(
                JSON.stringify({ text: "Error Crítico: Tu usuario no tiene una Licencia vinculada. Contacta a soporte." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Fetch Context
        const { data: plants } = await supabaseClient
            .from('plants')
            .select('id, name, species, status, acquisition_date')
            .eq('owner_key', ownerKey)
            .limit(10);

        const plantContext = plants && plants.length > 0
            ? "MIS PLANTAS ACTUALES:\n" + plants.map((p: any) => `- ${p.name} (${p.species}): Estado ${p.status}, Adquirida el ${p.acquisition_date} (ID: ${p.id})`).join("\n")
            : "No tengo plantas registradas aún.";

        // 5. Initialize Gemini
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) {
            return new Response(
                JSON.stringify({ text: "Error de Configuración: GEMINI_API_KEY no encontrada." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // ... Tools Definition ...
        const tools = [
            {
                function_declarations: [
                    {
                        name: "set_alert",
                        description: "Crea una alerta o recordatorio para el cuidado de una planta.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                plant_name: { type: "STRING", description: "El nombre exacto de la planta (ej: 'Dionaea B52')." },
                                message: { type: "STRING", description: "El mensaje del recordatorio (ej: 'Regar', 'Revisar plaga')." },
                                due_date: { type: "STRING", description: "La fecha y hora en formato ISO 8601 (ej: '2024-05-20T09:00:00') o fecha relativa." },
                                priority: { type: "STRING", description: "Prioridad: 'alta', 'media', 'baja'." }
                            },
                            required: ["plant_name", "message", "due_date"]
                        }
                    },
                    {
                        name: "add_diary_entry",
                        description: "Agrega una nota al diario de cultivo de una planta.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                plant_name: { type: "STRING", description: "El nombre exacto de la planta." },
                                category: { type: "STRING", description: "Categoría: 'riego', 'fertilizacion', 'poda', 'observacion'." },
                                note: { type: "STRING", description: "El contenido de la nota o detallles de lo realizado." }
                            },
                            required: ["plant_name", "category", "note"]
                        }
                    }
                ]
            }
        ];

        // CORRECTED: tools passed as 'tools', not 'toolConfig'
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools: tools }, { apiVersion: 'v1beta' });

        // 6. Build System Prompt & Chat
        const currentMessage = messages[messages.length - 1].text;

        let prompt = `
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
      - Responde siempre amablemente confirmando la acción realizada.

      USUARIO DICE: "${currentMessage}"
    `;

        // Handle Image if provided (Vision Model - Vision model DOES NOT support Tools yet typically, check docs)
        // Gemini Pro 1.5 may support both. For now, if image exists, we skip tools or do a 2-step process.
        // Let's assume text-only for Tools for this iteration to ensure stability.
        // If image is present, we prioritize Diagnosis/Analysis over Tools.

        let result;
        if (image) {
            // Upgrade to PRO model for better vision accuracy
            const modelVision = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

            prompt = `
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

            const imagePart = {
                inlineData: {
                    data: image.split(',')[1],
                    mimeType: 'image/jpeg'
                }
            };
            result = await modelVision.generateContent([prompt, imagePart]);
        } else {
            // Chat + Tools
            const chat = model.startChat({
                history: [], // We could pass history if formatted correctly
            });
            result = await chat.sendMessage(prompt);
        }

        const response = await result.response;
        let finalText = response.text();

        // 7. Handle Function Calls
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
                if (call.name === 'set_alert') {
                    const { plant_name, message, due_date, priority } = call.args;
                    // Insert into DB
                    const { error: insertError } = await supabaseClient.from('alerts').insert({
                        planta: plant_name,
                        mensaje: message,
                        fecha: due_date || new Date().toISOString(),
                        tipo: 'Cuidado',
                        prioridad: priority || 'media',
                        completada: false,
                        owner_key: ownerKey
                    });

                    if (insertError) {
                        finalText += `\n\n(Error BD Alerta: ${insertError.message})`;
                    } else {
                        finalText += `\n\n✅ Alerta creada: "${message}" para ${plant_name}.`;

                        // FIRE & FORGET PUSH NOTIFICATION
                        // We trigger it but don't await the result to keep the chat snappy.
                        supabaseClient.functions.invoke('send-push', {
                            body: {
                                user_id: user.id,
                                title: `🌱 Alerta: ${plant_name}`,
                                body: message,
                                data: { url: '/alerts' }
                            }
                        }).then(({ error }) => {
                            if (error) console.error("Push Error warning:", error);
                        });
                    }
                }

                if (call.name === 'add_diary_entry') {
                    const { plant_name, category, note } = call.args;
                    // We need to find the plant ID ideally, or just save the name if schema permits
                    // Getting full plant details for cleaner insertion
                    const plant = plants?.find((p: any) => p.name === plant_name);

                    const { error: insertError } = await supabaseClient.from('diary').insert({
                        planta_nombre: plant_name,
                        planta_especie: plant?.species || 'Desconocida',
                        fecha: new Date().toISOString(),
                        tipo: category,
                        descripcion: note,
                        owner_key: ownerKey
                    });

                    if (insertError) {
                        finalText += `\n\n(Error BD Diario: ${insertError.message})`;
                    } else {
                        finalText += `\n\n📝 Nota guardada en el diario de ${plant_name}.`;
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ text: finalText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        // Return 200 OK so client sees the error in the chat
        return new Response(
            JSON.stringify({ text: `⚠️ Error Interno del Bot: ${error.message}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
