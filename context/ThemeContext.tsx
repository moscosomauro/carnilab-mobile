import React, { createContext, useContext, useEffect, useState } from 'react';

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

const THEME_STORAGE_KEY = 'carnilab_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>('default');
    const [currentLogo, setCurrentLogo] = useState<string>('./sarracenia-logo.png');
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

    // Cargar tema guardado localmente al iniciar
    useEffect(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (saved) applyTheme(saved);
    }, []);

    const applyTheme = (theme: Theme) => {
        setCurrentTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        // Set Logo based on theme
        let logoPath = './sarracenia-logo.png';
        if (theme === 'christmas') logoPath = './assets/themes/christmas/logo.png';
        else if (theme === 'halloween') logoPath = './assets/themes/halloween/logo.png';
        else if (theme === 'spring') logoPath = './assets/themes/spring/logo.png';
        else if (theme === 'summer') logoPath = './assets/themes/summer/logo.png';
        else if (theme === 'autumn') logoPath = './assets/themes/autumn/logo.png';
        else if (theme === 'winter') logoPath = './assets/themes/winter/logo.png';

        setCurrentLogo(logoPath);

        // Remove all theme classes first
        document.body.classList.remove('theme-christmas', 'theme-halloween', 'theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');

        // Add new theme class if not default
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    };

    // El tema ahora es 100% local (antes lo definía un admin en la nube)
    const updateGlobalTheme = async (theme: Theme) => {
        applyTheme(theme);
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
