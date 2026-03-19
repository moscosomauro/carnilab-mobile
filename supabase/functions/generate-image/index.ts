// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const { prompt } = await req.json();
        if (!prompt) throw new Error('Prompt required');

        // @ts-ignore
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');

        console.log('🍌 Generating image with Nano Banana');

        // Detect species
        const isSarracenia = prompt.toLowerCase().includes('sarracenia');
        const isDionaea = prompt.toLowerCase().includes('dionaea') || prompt.toLowerCase().includes('venus flytrap');

        // Detect MUTATIONS (The "Cool" Deformities)
        // If prompt contains these, we DISABLE "accurate anatomy" constraints
        const isMutant = prompt.toLowerCase().match(/alien|fused|arched|cup|wacky|pom pom|crested|variegated|double|mirror|dracula|teethless/);

        // ANATOMICAL PROMPTS for Gemini
        // Base prompt
        let enhancedPrompt = `Generate a photorealistic 8k macro image of a ${prompt}.`;

        if (isMutant) {
            // MUTANT MODE: Emphasize the weirdness!
            console.log('🧬 Mutation detected! Enabling exotic shapes.');
            enhancedPrompt = `Generate a photorealistic macro shot of a RARE MUTANT Carnivorous Plant: ${prompt}. Focus on the unique mutated shape (e.g. fused traps, arched leaves, cup structures). High detail.`;
        }
        else if (isSarracenia) {
            // NORMAL SARRACENIA: Enforce perfection
            enhancedPrompt = `Generate a photorealistic macro image of a Sarracenia pitcher plant: ${prompt}. Ensure accurate anatomy: single trumpet-shaped pitcher, distinct hood, no deformities.`;
        }
        else if (isDionaea) {
            // NORMAL DIONAEA: Enforce classic shape
            enhancedPrompt = `Generate a photorealistic macro image of a Venus flytrap: ${prompt}. Classic trap anatomy with distinct teeth.`;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: enhancedPrompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Parse response
        const partWithImage = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        const imageData = partWithImage?.inlineData?.data;

        if (!imageData) {
            console.log('Gemini Text Response:', JSON.stringify(data).substring(0, 300));
            throw new Error('No image returned. Try a different prompt.');
        }

        return new Response(
            JSON.stringify({ success: true, image: imageData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
