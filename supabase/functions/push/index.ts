import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        console.log('Payload recibido:', JSON.stringify(body))

        const { record } = body
        const targetOwnerKey = record?.owner_key

        // 1. Configurar VAPID Keys (Sanitizando Private Key)
        const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
        let privateKey = Deno.env.get('VAPID_PRIVATE_KEY')

        if (!publicKey || !privateKey) {
            throw new Error('Faltan secretas VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY')
        }

        // Limpieza defensiva de la llave privada (quitar padding si existe)
        if (privateKey.endsWith('=')) {
            privateKey = privateKey.replace(/=+$/, '');
            console.log("Private key sanitized (padding removed)");
        }

        webpush.setVapidDetails('mailto:admin@carnilab.com', publicKey, privateKey)

        // 2. Cliente Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (!targetOwnerKey) {
            return new Response(JSON.stringify({ success: false, error: 'La alerta no tiene owner_key' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 4. Buscar suscripciones activas
        const { data: subscriptions, error: subError } = await supabaseClient
            .from('user_push_subscriptions')
            .select('*')
            .eq('user_id', targetOwnerKey)

        if (subError) throw subError

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ success: true, count: 0, message: 'No hay dispositivos suscritos para esta cuenta.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 5. Enviar notificaciones
        const alertMsg = record?.mensaje || record?.descripcion || 'Nueva alerta de cultivo 🌿';
        const notificationPayload = JSON.stringify({
            title: 'CarniLab',
            body: alertMsg,
            url: '/alerts'
        })

        const results = await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub.subscription_json, notificationPayload)
                return { ok: true, id: sub.id }
            } catch (err) {
                console.error(`Error en dispositivo ${sub.id}:`, err.message)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseClient.from('user_push_subscriptions').delete().eq('id', sub.id)
                }
                return { ok: false, error: err.message }
            }
        }))

        return new Response(JSON.stringify({
            success: true,
            count: subscriptions.length,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
