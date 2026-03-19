import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../../components/Icon';

const THEMES = [
    {
        id: 'default',
        name: 'Organic CarniLab',
        description: 'Clean, scientific, professional.',
        bg: '#f7f9f6',
        primary: '#27ae60'
    },
    {
        id: 'christmas',
        name: 'Christmas',
        description: 'Festive red & green holiday spirit.',
        bg: '#fffbfb',
        primary: '#c0392b'
    },
    {
        id: 'halloween',
        name: 'Halloween',
        description: 'Spooky dark mode with pumpkin orange.',
        bg: '#1a1a1a',
        primary: '#e67e22'
    },
    {
        id: 'spring',
        name: 'Primavera',
        description: 'Fresh blooms, pastels, renewal.',
        bg: '#fef9f3',
        primary: '#ff69b4'
    },
    {
        id: 'summer',
        name: 'Verano',
        description: 'Bright sunshine, vibrant energy.',
        bg: '#fff8dc',
        primary: '#ffa500'
    },
    {
        id: 'autumn',
        name: 'Otoño',
        description: 'Warm earth tones, cozy vibes.',
        bg: '#faf0e6',
        primary: '#d2691e'
    },
    {
        id: 'winter',
        name: 'Invierno',
        description: 'Cool blues, crisp and serene.',
        bg: '#f0f8ff',
        primary: '#4682b4'
    }
] as const;

const AdminThemeScreen: React.FC = () => {
    const navigate = useNavigate();
    const { currentTheme, updateGlobalTheme } = useTheme();
    const [loading, setLoading] = useState<string | null>(null);

    const handleThemeChange = async (themeId: any) => {
        if (themeId === currentTheme) return;
        setLoading(themeId);
        await updateGlobalTheme(themeId);
        setLoading(null);
    };

    return (
        <div className="min-h-screen p-6 font-sans text-[var(--color-brand-dark)]">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600 hover:scale-105 transition-transform"
                    >
                        <Icon name="arrow_back" className="text-xl" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-brand-dark)' }}>Global Themes</h1>
                        <p className="text-slate-500 font-medium">Control the visual experience for all users.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            disabled={loading !== null}
                            className={`
                relative overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 group
                ${currentTheme === theme.id ? 'ring-4 ring-offset-4 ring-teal-500 shadow-2xl scale-[1.02]' : 'hover:scale-105 shadow-xl hover:shadow-2xl'}
              `}
                            style={{ backgroundColor: theme.bg }}
                        >
                            <div className="absolute top-4 right-4">
                                {currentTheme === theme.id && (
                                    <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                        <Icon name="check" className="text-lg font-bold" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col h-full justify-between">
                                <div className="mb-8">
                                    <div className="w-12 h-12 rounded-2xl mb-4 shadow-lg" style={{ backgroundColor: theme.primary }}></div>
                                    <h3 className={`text-xl font-black mb-2 ${theme.id === 'halloween' ? 'text-white' : 'text-slate-800'}`}>
                                        {theme.name}
                                    </h3>
                                    <p className={`text-sm font-bold opacity-70 ${theme.id === 'halloween' ? 'text-white' : 'text-slate-600'}`}>
                                        {theme.description}
                                    </p>
                                </div>

                                <div className={`
                   py-3 px-6 rounded-xl text-center font-black uppercase text-xs tracking-widest transition-colors
                   ${currentTheme === theme.id
                                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                        : 'bg-black/5 text-black/40 group-hover:bg-black/10'}
                `}>
                                    {loading === theme.id ? 'Activating...' : (currentTheme === theme.id ? 'Active' : 'Apply Theme')}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl">
                    <div className="flex gap-4">
                        <div className="text-blue-500"><Icon name="info" className="text-2xl" /></div>
                        <div>
                            <h4 className="font-bold text-blue-800 mb-1">Real-time Broadcast</h4>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Changing the theme here will instantly update the interface for <strong>all connected users</strong> without requiring a page reload.
                                Use with caution during high-traffic events.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminThemeScreen;
