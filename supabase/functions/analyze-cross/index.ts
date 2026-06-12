// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de análisis genético estructurado
const ANALYSIS_SYSTEM_PROMPT = `Eres un experto botánico especializado en plantas carnívoras, específicamente en genética y fenotipado de Dionaea muscipula (Venus Flytrap).

Tu tarea es analizar fotografías de plantas carnívoras y extraer información genética/fenotípica detallada.

DEBES responder EXCLUSIVAMENTE en formato JSON válido con esta estructura exacta:

{
  "coloration": {
    "dominant": "red" | "green" | "mixed",
    "percentage": <número 0-100>,
    "description": "<descripción del patrón de coloración>"
  },
  "trap_size": {
    "category": "miniature" | "small" | "medium" | "large" | "giant",
    "estimated_cm": <número estimado en cm>
  },
  "teeth_shape": {
    "type": "short" | "medium" | "long" | "fused",
    "description": "<descripción de los dientes/cilios>"
  },
  "vigor": {
    "level": "low" | "medium" | "high",
    "score": <número 1-10>
  },
  "anthocyanins": {
    "present": true | false,
    "intensity": "none" | "light" | "moderate" | "strong"
  },
  "growth_pattern": {
    "type": "upright" | "prostrate" | "rosette",
    "description": "<descripción del patrón de crecimiento>"
  },
  "traits": ["<rasgo 1>", "<rasgo 2>", ...],
  "raw_analysis": "<tu análisis completo en texto libre, máximo 3 párrafos>",
  "confidence": <número 0.0-1.0 indicando tu confianza en el análisis>
}

REGLAS:
1. Sé preciso y objetivo basándote SOLO en lo visible en la imagen
2. Si algo no es claramente visible, indícalo en la descripción
3. Los "traits" son características heredables notables (ej: "Trampas gigantes", "Coloración roja intensa", "Dientes fusionados")
4. El "raw_analysis" debe explicar tu razonamiento de forma clara para el cultivador
5. NUNCA inventes datos que no puedas ver en la imagen`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_url, image_base64, cross_id, cross_name, parent_info } = await req.json();

    // Validar que tenemos imagen
    if (!image_url && !image_base64) {
      return new Response(
        JSON.stringify({ error: "Se requiere image_url o image_base64" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Obtener usuario
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (!user || authError) {
      return new Response(
        JSON.stringify({ error: `Error de autenticación: ${authError?.message}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener license key
    const { data: licenseData } = await supabaseClient
      .from('access_keys')
      .select('key')
      .eq('device_id', user.id)
      .maybeSingle();

    const ownerKey = licenseData?.key;
    if (!ownerKey) {
      return new Response(
        JSON.stringify({ error: "Usuario sin licencia válida" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Anthropic
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Construir el contenido de la imagen
    let imageContent;
    if (image_base64) {
      // Base64 directo
      const base64Data = image_base64.includes(',') ? image_base64.split(',')[1] : image_base64;
      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Data
        }
      };
    } else {
      // URL
      imageContent = {
        type: "image",
        source: {
          type: "url",
          url: image_url
        }
      };
    }

    // Contexto adicional si tenemos info de la cruza
    let contextPrompt = "Analiza esta planta carnívora y extrae toda la información fenotípica visible.";
    if (cross_name || parent_info) {
      contextPrompt = `Analiza esta planta carnívora que es PROGENIE de una cruza.

${cross_name ? `Nombre de la cruza: ${cross_name}` : ''}
${parent_info ? `Información de parentales: ${parent_info}` : ''}

Evalúa qué rasgos podrían haberse heredado de los parentales y cuáles son rasgos únicos de este espécimen.`;
    }

    // Llamada a Claude Vision
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: contextPrompt
            }
          ]
        }
      ]
    });

    // Extraer y parsear respuesta
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error("No se recibió respuesta de texto del modelo");
    }

    let analysisResult;
    try {
      // Intentar parsear el JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se encontró JSON en la respuesta");
      }
    } catch (parseError) {
      // Si falla el parse, crear estructura básica con el texto raw
      analysisResult = {
        coloration: { dominant: "mixed", percentage: 50, description: "No se pudo analizar automáticamente" },
        trap_size: { category: "medium", estimated_cm: 2 },
        teeth_shape: { type: "medium", description: "No se pudo analizar automáticamente" },
        vigor: { level: "medium", score: 5 },
        anthocyanins: { present: false, intensity: "none" },
        growth_pattern: { type: "rosette", description: "No se pudo analizar automáticamente" },
        traits: [],
        raw_analysis: textContent.text,
        confidence: 0.3
      };
    }

    // Guardar análisis en la base de datos
    const { data: savedAnalysis, error: insertError } = await supabaseClient
      .from('cross_analyses')
      .insert({
        cross_id: cross_id || 0,
        owner_key: ownerKey,
        image_url: image_url || `data:image/jpeg;base64,${image_base64?.substring(0, 50)}...`,
        image_type: 'progeny',
        analysis_result: analysisResult,
        confidence_score: analysisResult.confidence || 0.8,
        model_used: 'claude-sonnet-4'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error guardando análisis:", insertError);
      // Aún así retornamos el análisis aunque no se haya guardado
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        saved_id: savedAnalysis?.id || null,
        model: 'claude-sonnet-4'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error en analyze-cross:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error interno del servidor",
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
