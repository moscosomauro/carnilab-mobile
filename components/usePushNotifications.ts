import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const PUBLIC_VAPID_KEY = 'BG6W4jrj0EASfxrS4Tb_PfeHWc7mqlzobCDDABdOXVa0qUMCPWmhyBE3yzgviN7sEpjVYZAW3SQo8hX_wMnSlw8';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


export const usePushNotifications = () => {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
            checkSubscription();
        }
    }, [user]);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
    };

    const subscribeToPush = async () => {
        if (!user) return;
        setLoading(true);
        try {
            if (!('serviceWorker' in navigator)) throw new Error('No service worker support');

            if (!('Notification' in window)) {
                // Mensaje específico para iOS
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                if (isIOS) {
                    throw new Error('En iPhone, DEBES instalar la App: Botón Compartir (cuadrado con flecha) -> "Añadir a inicio". Luego abre la App desde el icono nuevo.');
                }
                throw new Error('Tu navegador no soporta notificaciones. Intenta usar Chrome o Instalar la App.');
            }

            const registration = await navigator.serviceWorker.ready;

            // 1. Request Permission
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission !== 'granted') {
                throw new Error('Permission denied');
            }

            // 2. Subscribe
            const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // 3. Save to DB
            const { error } = await supabase
                .from('user_push_subscriptions')
                .upsert({
                    user_id: user.key,
                    subscription_json: subscription.toJSON()
                }, { onConflict: 'user_id, subscription_json' });

            if (error) throw error;

            setIsSubscribed(true);
            return true;
        } catch (error: any) {
            console.error('Error subscribing:', error);
            alert(`Error de suscripción: ${error.message}`);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            return true;
        } catch (error) {
            console.error('Unsubscribe error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async () => {
        if (!user) return;
        setTestLoading(true);
        try {
            // Corrected function name to 'send-push'
            const { data, error } = await supabase.functions.invoke('send-push', {
                body: {
                    owner_key: user.key,
                    title: "🔔 Prueba de Servidor",
                    body: "¡Si lees esto, el sistema funciona!",
                    data: { url: '/profile' }
                },
            });

            if (error) throw error;

            console.log("Test result:", data);

            if (data?.success === false) {
                // Try to handle the specific case of "No Key"
                alert(`Result: ${JSON.stringify(data)}`);
            } else {
                alert("✅ Servidor: Envío procesado. Espera 5 segundos.");
            }

        } catch (error: any) {
            console.error('Error enviando prueba:', error);
            alert(`❌ Error del servidor: ${error.message}`);
        } finally {
            setTestLoading(false);
        }
    };

    const sendLocalNotification = async () => {
        if (!('serviceWorker' in navigator)) {
            alert("No hay Service Worker activo.");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("🔔 Prueba Local", {
                body: "El Service Worker está activo y puede mostrar alertas.",
                icon: '/carnibot.png',
                vibrate: [200, 100, 200],
                tag: 'test-local'
            } as any);
            alert("✅ Se ha enviado una notificación local. ¿La ves?");
        } catch (e: any) {
            console.error(e);
            alert(`❌ Error Local: ${e.message}`);
        }
    };

    return {
        isSubscribed,
        loading,
        testLoading,
        permissionStatus,
        subscribeToPush,
        unsubscribeFromPush,
        sendTestNotification,
        sendLocalNotification
    };
};
