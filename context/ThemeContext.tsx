import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type Theme = 'default' | 'christmas' | 'halloween' | 'spring' | 'summer' | 'autumn' | 'winter' | 'neon';

interface ThemeContextType {
    currentTheme: Theme;
    currentLogo: string;
    isDarkMode: boolean;
    setTheme: (theme: Theme) => void;
    updateGlobalTheme: (theme: Theme) => Promise<void>;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>('default');
    const [currentLogo, setCurrentLogo] = useState<string>('/carnibot.png');
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('carnilab_dark_mode');
        return saved === 'true';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('carnilab_dark_mode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('carnilab_dark_mode', 'false');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    // Load initial theme and subscribe to changes
    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const { data } = await supabase
                    .from('global_settings')
                    .select('value')
                    .eq('key', 'theme')
                    .single();

                if (data && data.value) {
                    console.log("Initial Theme Data:", data.value);
                    // Handle if value is wrapped in quotes or is a plain string
                    const rawValue = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
                    const themeValue = rawValue.replace(/['"]+/g, '') as Theme;
                    applyTheme(themeValue);
                }
            } catch (e) {
                console.error("Error fetching initial theme:", e);
            }
        };

        fetchTheme();

        const channel = supabase
            .channel('global_theme_updates') // Unique channel name
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE
                    schema: 'public',
                    table: 'global_settings',
                    // Removed filter to ensure we catch ALL events for debugging
                },
                (payload) => {
                    console.log('REALTIME EVENT RECEIVED:', payload);

                    const newData = payload.new as any;
                    if (newData && newData.key === 'theme' && newData.value) {
                        const rawValue = typeof newData.value === 'string' ? newData.value : JSON.stringify(newData.value);
                        const themeValue = rawValue.replace(/['"]+/g, '') as Theme;
                        console.log("Applying Realtime Theme:", themeValue);
                        applyTheme(themeValue);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Realtime Subscription Status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const applyTheme = (theme: Theme) => {
        setCurrentTheme(theme);

        // Set Logo based on theme
        let logoPath = '/brand-logo.png';
        if (theme === 'christmas') logoPath = '/assets/themes/christmas/logo.png';
        else if (theme === 'halloween') logoPath = '/assets/themes/halloween/logo.png';
        else if (theme === 'spring') logoPath = '/assets/themes/spring/logo.png';
        else if (theme === 'summer') logoPath = '/assets/themes/summer/logo.png';
        else if (theme === 'autumn') logoPath = '/assets/themes/autumn/logo.png';
        else if (theme === 'winter') logoPath = '/assets/themes/winter/logo.png';

        setCurrentLogo(logoPath);

        // Remove all theme classes first
        document.body.classList.remove('theme-christmas', 'theme-halloween', 'theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');

        // Add new theme class if not default
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    };

    // Function to update global theme (Admin only usually)
    const updateGlobalTheme = async (theme: Theme) => {
        // Optimistic update
        applyTheme(theme);

        // Use RPC function to bypass RLS issues
        const { error } = await supabase.rpc('update_global_theme', { theme_name: theme });

        if (error) {
            console.error('Error updating theme:', error);
            // Revert or show notification if needed
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, currentLogo, isDarkMode, setTheme: applyTheme, updateGlobalTheme, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
