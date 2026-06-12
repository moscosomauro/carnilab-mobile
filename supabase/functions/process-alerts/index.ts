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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 1. Fetch pending alerts due now or in the past
        const now = new Date().toISOString();
        console.log(`Checking alerts at: ${now}`);

        const { data: alerts, error: fetchError } = await supabaseAdmin
            .from('alerts')
            .select('*')
            .eq('completada', false)
            .eq('notified', false)
            .lte('fecha', now)
            .limit(50);

        console.log(`Found ${alerts?.length || 0} alerts to process`);

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
                // Call send-push function via HTTP with Service Role Key
                const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceRoleKey}`
                    },
                    body: JSON.stringify({
                        owner_key: alert.owner_key,
                        title: `⏰ Recordatorio: ${alert.planta}`,
                        body: alert.mensaje,
                        data: { url: '/alerts' }
                    })
                });

                const pushResult = await pushResponse.json();
                console.log(`Push result for alert ${alert.id}:`, pushResult);

                if (!pushResponse.ok || pushResult.error) {
                    console.error(`Failed to push for alert ${alert.id}:`, pushResult);
                    results.push({ id: alert.id, status: 'failed', error: pushResult.error });
                } else {
                    // 3. Mark as notified
                    await supabaseAdmin
                        .from('alerts')
                        .update({ notified: true })
                        .eq('id', alert.id);

                    results.push({ id: alert.id, status: 'sent', sent: pushResult.sent });
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
