import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

        // ... existing imports

        try {
            const { plan_id, user_id, user_email } = await req.json()
            const origin = req.headers.get('origin') || 'https://carnilabstudio.com'

            // Initialize Supabase Client
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            // Parse logic
            const isAnnual = plan_id.endsWith('-annual');
            const basePlanId = isAnnual ? plan_id.replace('-annual', '') : plan_id;

            // Fetch Plan from DB
            const { data: planData, error: planError } = await supabase
                .from('plans')
                .select('name, price_monthly, price_annual')
                .eq('id', basePlanId)
                .single();

            if (planError || !planData) {
                throw new Error("Plan no encontrado o inválido");
            }

            const unit_price = isAnnual ? planData.price_annual : planData.price_monthly;
            const title = `CarniLab - ${planData.name} (${isAnnual ? '1 Año' : '1 Mes'})`;

            if (unit_price <= 0) throw new Error("Precio inválido");

            // ... existing MP code

            const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
            if (!accessToken) {
                throw new Error("Falta MP_ACCESS_TOKEN en las variables de entorno")
            }

            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: [
                        {
                            title: title,
                            quantity: 1,
                            currency_id: 'ARS',
                            unit_price: unit_price,
                            description: `Upgrade de cuenta CarniLab para ${user_email}`
                        }
                    ],
                    payer: {
                        email: user_email
                    },
                    back_urls: {
                        success: `${origin}/#/login?payment=success&id={payment_id}&plan=${plan_id}`,
                        failure: `${origin}/#/login?payment=failure`,
                        pending: `${origin}/#/login?payment=pending`
                    },
                    auto_return: "approved",
                    external_reference: `${user_id}|${plan_id}`, // Importante para el webhook
                    metadata: {
                        buyer_email: user_email
                    }
                })
            })

            const data = await response.json()

            return new Response(JSON.stringify({
                id: data.id,
                init_point: data.init_point
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
