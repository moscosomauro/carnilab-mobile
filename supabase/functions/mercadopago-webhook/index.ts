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
        const url = new URL(req.url)
        const topic = url.searchParams.get('topic') || url.searchParams.get('type')
        const id = url.searchParams.get('id') || url.searchParams.get('data.id')

        console.log(`Webhook recibida: ${topic} - ${id}`)

        if (topic !== 'payment' && topic !== 'payment_intent') {
            return new Response(JSON.stringify({ message: "Ignored topic" }), { status: 200 })
        }

        const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!accessToken || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing environment variables")
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener detalles del pago desde Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        if (!mpResponse.ok) {
            throw new Error(`Error fetching payment: ${mpResponse.statusText}`)
        }

        const payment = await mpResponse.json()
        const status = payment.status
        const ref = payment.external_reference // user_id|plan

        console.log(`Pago ${id} estado: ${status}, ref: ${ref}`)

        if (status === 'approved' && ref) {
            const [userId, plan] = ref.split('|')

            if (userId === 'NEW') {
                // GENERAR NUEVA LICENCIA PARA USUARIO ANÓNIMO
                const randomKey = `${plan.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

                const { data, error } = await supabase
                    .from('access_keys')
                    .insert({
                        key: randomKey,
                        plan: plan,
                        label: `MP_ID:${id} | Email: ${payment.metadata?.buyer_email || payment.payer?.email || 'N/A'}`,
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })

                if (error) throw error
                console.log(`Licencia generada: ${randomKey} para pago ${id}`)

                // 2. ENVIAR EMAIL VIA RESEND (Opcional si la clave existe)
                const resendKey = Deno.env.get('RESEND_API_KEY')
                if (resendKey) {
                    try {
                        const email = payment.metadata?.buyer_email || payment.payer?.email
                        if (email) {
                            await fetch('https://api.resend.com/emails', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${resendKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    from: 'CarniLab <licencias@carnilabstudio.com>',
                                    to: [email],
                                    subject: '¡Tu Licencia CarniLab está lista! 🌿',
                                    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Bienvenido a CarniLab!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f9f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7f9f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    <!-- Cabecera -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #2d9b82 0%, #1e293b 100%); padding: 60px 40px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">¡Tu Laboratorio está listo! 🌿</h1>
                            <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Plan ${plan.toUpperCase()} Activado</p>
                        </td>
                    </tr>
                    
                    <!-- Contenido -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #475569; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                ¡Hola! Gracias por unirte a la mayor comunidad de cultivo genético. Hemos generado tu licencia exclusiva para que puedas empezar a explorar todas las herramientas PRO.
                            </p>
                            
                            <!-- Tarjeta de Licencia -->
                            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 35px;">
                                <p style="color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">TU CLAVE DE ACCESO</p>
                                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #1e293b; letter-spacing: 4px;">${randomKey}</span>
                            </div>

                            <!-- Pasos -->
                            <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 20px 0;">¿Cómo activo mi cuenta?</h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td style="padding: 0 0 15px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="28" height="28" align="center" style="background-color: #2d9b82; color: #ffffff; border-radius: 50%; font-size: 14px; font-weight: 700;">1</td>
                                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">Abre la App y ve a la sección de <strong>Registro</strong>.</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 0 15px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="28" height="28" align="center" style="background-color: #2d9b82; color: #ffffff; border-radius: 50%; font-size: 14px; font-weight: 700;">2</td>
                                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">Completa tus datos y <strong>pega la clave</strong> arriba.</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="28" height="28" align="center" style="background-color: #2d9b82; color: #ffffff; border-radius: 50%; font-size: 14px; font-weight: 700;">3</td>
                                                <td style="padding-left: 12px; color: #475569; font-size: 14px;">¡Listo! Ya tienes acceso total a tu nivel <strong>${plan.toUpperCase()}</strong>.</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 0 40px 40px 40px;">
                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 0 0 30px 0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0;">© 2026 CarniLab Systems. Todos los derechos reservados.</p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Recibiste este correo porque realizaste una compra en carnilab.com</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                                    `
                                })
                            })
                            console.log(`Email enviado a ${email}`)
                        }
                    } catch (emailErr) {
                        console.error("Error enviando email:", emailErr)
                    }
                }
            } else {
                // ACTUALIZAR PLAN DE USUARIO EXISTENTE
                const { error } = await supabase
                    .from('access_keys')
                    .update({
                        plan: plan,
                        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .eq('device_id', userId) // En este esquema, device_id suele mapearse al User ID o Device ID único del AuthContext

                if (error) {
                    // Si falla por device_id, intentamos buscar si hay una licencia activa para el slug del usuario
                    // Pero lo más seguro es que el external_reference traiga la KEY o el ID correcto.
                    console.error("Error actualizando plan:", error)
                } else {
                    console.log(`Plan actualizado para usuario ${userId} a ${plan}`)
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error("Webhook error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
