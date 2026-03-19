// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Function: send-push initialized");

serve(async (req) => {
    // 0. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Request received. Method:", req.method);

        // 1. Check Payload
        const bodyText = await req.text();
        console.log("Raw Body:", bodyText);

        let bodyJson;
        try {
            bodyJson = JSON.parse(bodyText);
        } catch (e) {
            throw new Error(`Invalid JSON Body: ${e.message}`);
        }

        const { user_id, title, body, data, owner_key } = bodyJson;

        // 2. Check Environment Variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const vapidSubject = Deno.env.get('VAPID_SUBJECT');
        const vapidPub = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPriv = Deno.env.get('VAPID_PRIVATE_KEY');

        const missing = [];
        if (!supabaseUrl) missing.push('SUPABASE_URL');
        if (!supabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
        if (!vapidSubject) missing.push('VAPID_SUBJECT');
        if (!vapidPub) missing.push('VAPID_PUBLIC_KEY');
        if (!vapidPriv) missing.push('VAPID_PRIVATE_KEY');

        if (missing.length > 0) {
            throw new Error(`Missing Server Secrets: ${missing.join(', ')}`);
        }

        // 3. Init Supabase
        const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseKey ?? '');

        // 4. Resolve User
        let targetUserId = user_id;
        if (!targetUserId && owner_key) {
            console.log("Resolving owner_key:", owner_key);
            const { data: keyData, error: keyError } = await supabaseAdmin
                .from('access_keys')
                .select('device_id')
                .eq('key', owner_key)
                .maybeSingle();

            if (keyError) {
                console.error("Key Lookup Error:", keyError);
                throw new Error(`DB Error looking up key: ${keyError.message}`);
            }

            if (keyData?.device_id) {
                targetUserId = keyData.device_id;
            } else {
                throw new Error(`License Key ${owner_key} has no linked user id.`);
            }
        }

        if (!targetUserId) {
            throw new Error("No Target User ID determined.");
        }

        // 5. Check Subscriptions
        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId);

        if (subError) {
            throw new Error(`Subscription fetch error: ${subError.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
            // Not partial success, but success=false with "No devices"
            return new Response(
                JSON.stringify({ success: false, error: "No devices subscribed for this user.", count: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 6. Config Web Push
        try {
            webpush.setVapidDetails(vapidSubject, vapidPub, vapidPriv);
        } catch (e) {
            throw new Error(`VAPID Config Error: ${e.message}`);
        }

        // 7. Send
        const payload = JSON.stringify({ title, body, url: data?.url });
        let sentCount = 0;
        let failCount = 0;
        const results = [];

        console.log(`Sending to ${subscriptions.length} devices...`);

        const promises = subscriptions.map(async (sub) => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            try {
                await webpush.sendNotification(pushConfig, payload);
                sentCount++;
                results.push({ id: sub.id, status: 'ok' });
            } catch (error: any) {
                console.error("Push Send Error:", error);
                failCount++;
                results.push({ id: sub.id, status: 'error', msg: error.message });

                if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
                }
            }
        });

        await Promise.all(promises);

        return new Response(
            JSON.stringify({ success: true, sent: sentCount, failed: failCount, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error("Critical Caught Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: `Server Logic Error: ${error.message}`,
                stack: error.stack
            }),
            {
                status: 200, // FORCE 200 to show message in UI
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
