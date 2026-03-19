import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const PUBLIC_VAPID_KEY = 'BInwbj8qR2W_q2-qX4Bgw7q4tG57n4d10pX4q-qX4Bg'; // Placeholder

export const PushNotificationManager: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !user.isAuthenticated) return;

        const registerSubscription = async () => {
            try {
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    console.log('Push messaging is not supported');
                    return;
                }

                const registration = await navigator.serviceWorker.ready;

                if (Notification.permission === 'default') {
                    // Request permission (this usually requires a user gesture in modern browsers,
                    // so auto-running it in useEffect might be blocked, but asking status is fine)
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') return;
                }

                if (Notification.permission !== 'granted') return;

                // Subscribe
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: PUBLIC_VAPID_KEY // DUMMY KEY - NEEDS REPLACEMENT
                }).catch(err => {
                    console.log('Failed to subscribe to Push', err);
                    return null;
                });

                if (!subscription) return;

                // Save to Supabase
                const { error } = await supabase
                    .from('user_push_subscriptions')
                    .upsert({
                        user_id: user.uid,
                        subscription_json: subscription.toJSON()
                    }, { onConflict: 'user_id, subscription_json' });

                if (error) throw error;
                console.log('Push subscription saved!');

            } catch (error) {
                console.error('Error registering push:', error);
            }
        };

        registerSubscription();
    }, [user]);

    return null;
};
