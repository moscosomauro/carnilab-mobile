// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch pending alerts due now or in the past
        const now = new Date().toISOString();
        const { data: alerts, error: fetchError } = await supabaseAdmin
            .from('alerts')
            .select('*, auth_users:user_id(id)') // Join if needed, but user_id is on alert
            .eq('completada', false)
            .eq('notified', false) // Only un-notified
            .lte('fecha', now)
            .limit(50); // Process in batches

        if (fetchError) throw fetchError;

        if (!alerts || alerts.length === 0) {
            return new Response(
                JSON.stringify({ message: "No pending alerts to process" }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Processing ${alerts.length} alerts...`);
        const results = [];

        // 2. Loop through alerts and send push
        for (const alert of alerts) {
            try {
                // Call send-push function
                // We use invoke to reuse the logic we already built
                const { data, error: pushError } = await supabaseAdmin.functions.invoke('send-push', {
                    body: {
                        owner_key: alert.owner_key, // Use license key to find user
                        title: `⏰ Recordatorio: ${alert.planta}`,
                        body: alert.mensaje,
                        data: { url: '/alerts' }
                    }
                });

                if (pushError) {
                    console.error(`Failed to push for alert ${alert.id}:`, pushError);
                    results.push({ id: alert.id, status: 'failed', error: pushError });
                } else {
                    // 3. Mark as notified
                    await supabaseAdmin
                        .from('alerts')
                        .update({ notified: true })
                        .eq('id', alert.id);

                    results.push({ id: alert.id, status: 'sent' });
                }

            } catch (e) {
                console.error(`Error processing alert ${alert.id}:`, e);
                results.push({ id: alert.id, status: 'error', error: e.message });
            }
        }

        return new Response(
            JSON.stringify({ success: true, processed: results.length, details: results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
