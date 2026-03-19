import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { payment_id } = await req.json()

        if (!payment_id) {
            throw new Error("Missing payment_id")
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing environment variables")
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Buscar en access_keys donde el label contenga el ID de pago
        // El label se guarda como "MP_ID:123456 | ..."
        const { data: keys, error } = await supabase
            .from('access_keys')
            .select('*')
            .ilike('label', `%MP_ID:${payment_id}%`)
            .order('created_at', { ascending: false })
            .limit(1)

        if (error) throw error

        if (!keys || keys.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: "Licencia no encontrada aún. El proceso puede tardar unos segundos."
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const key = keys[0]

        return new Response(JSON.stringify({
            success: true,
            key: key.key,
            plan: key.plan,
            expires_at: key.expires_at
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
            status: 400,
        })
    }
})
