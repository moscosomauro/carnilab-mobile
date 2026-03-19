import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SystemMessage } from '../types';

interface BroadcastContextType {
    activeBroadcasts: SystemMessage[];
    refreshBroadcasts: () => Promise<void>;
    dismissBroadcast: (id: string) => void;
    dismissedIds: string[];
}

const BroadcastContext = createContext<BroadcastContextType | undefined>(undefined);

export const BroadcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeBroadcasts, setActiveBroadcasts] = useState<SystemMessage[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        // Load dismissed IDs from local storage on mount
        const saved = localStorage.getItem('dismissedBroadcasts');
        return saved ? JSON.parse(saved) : [];
    });

    const fetchBroadcasts = async () => {
        try {
            const { data, error } = await supabase.rpc('get_active_broadcasts');
            if (error) {
                console.error('Error fetching broadcasts:', error);
                // Fallback to table select if RPC fails or doesn't exist yet
                const { data: tableData } = await supabase
                    .from('system_messages')
                    .select('*')
                    .eq('active', true)
                    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                    .order('created_at', { ascending: false });

                if (tableData) setActiveBroadcasts(tableData);
            } else if (data) {
                setActiveBroadcasts(data);
            }
        } catch (e) {
            console.error('Broadcast fetch error:', e);
        }
    };

    const dismissBroadcast = (id: string) => {
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem('dismissedBroadcasts', JSON.stringify(newDismissed));
    };

    useEffect(() => {
        fetchBroadcasts();

        // Subscribe to realtime changes
        const subscription = supabase
            .channel('public:system_messages')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_messages' }, () => {
                fetchBroadcasts();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Filter out dismissed broadcasts
    const visibleBroadcasts = activeBroadcasts.filter(b => !dismissedIds.includes(b.id));

    return (
        <BroadcastContext.Provider value={{ activeBroadcasts: visibleBroadcasts, refreshBroadcasts: fetchBroadcasts, dismissBroadcast, dismissedIds }}>
            {children}
        </BroadcastContext.Provider>
    );
};

export const useBroadcast = () => {
    const context = useContext(BroadcastContext);
    if (context === undefined) {
        throw new Error('useBroadcast must be used within a BroadcastProvider');
    }
    return context;
};
