


import { useTheme } from '../context/ThemeContext';

export const DynamicBackground = () => {
    const { currentTheme } = useTheme();

    // Mapping of themes to background images
    const getBackgroundImage = () => {
        switch (currentTheme) {
            case 'christmas': return '/assets/themes/christmas/background.png';
            case 'halloween': return '/assets/themes/halloween/background.png';
            case 'neon': return '/assets/themes/neon/background.png';
            default: return '/assets/backgrounds/bg-paper-texture.jpg';
        }
    };

    const bgImage = getBackgroundImage();
    const isDefaultTheme = currentTheme === 'default';

    return (
        <div className="fixed inset-0 z-[-50] pointer-events-none overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: 'var(--color-brand-bg)' }}>

            {/* Theme Background Image */}
            <div className="absolute inset-0 animate-in fade-in duration-700">
                <img
                    key={currentTheme} // Force re-render on theme change
                    src={bgImage}
                    alt="Background"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isDefaultTheme ? 'opacity-100' : 'opacity-80'}`}
                    onError={(e) => {
                        // Fallback if theme background missing
                        if (!isDefaultTheme) e.currentTarget.style.display = 'none';
                    }}
                />
            </div>

            {/* Overlay sutil para asegurar legibilidad */}
            <div className={`absolute inset-0 transition-colors duration-500 ${isDefaultTheme ? 'bg-white/10 mix-blend-soft-light' : 'bg-black/10'}`} />
        </div>
    );
};
