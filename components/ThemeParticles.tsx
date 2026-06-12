import { useTheme } from '../context/ThemeContext';

export const ThemeParticles = () => {
    const { currentTheme } = useTheme();

    // No particles for default theme
    if (currentTheme === 'default' || currentTheme === 'neon') return null;

    // Theme-specific gradient configurations
    const themeConfigs: Record<string, {
        gradient1: string;
        gradient2: string;
        glowColor: string;
        animationDuration: string;
    }> = {
        christmas: {
            gradient1: 'radial-gradient(circle at 20% 80%, rgba(192, 57, 43, 0.08) 0%, transparent 50%)',
            gradient2: 'radial-gradient(circle at 80% 20%, rgba(39, 174, 96, 0.08) 0%, transparent 50%)',
            glowColor: 'rgba(255, 215, 0, 0.1)',
            animationDuration: '8s',
        },
        halloween: {
            gradient1: 'radial-gradient(circle at 30% 70%, rgba(230, 126, 34, 0.1) 0%, transparent 50%)',
            gradient2: 'radial-gradient(circle at 70% 30%, rgba(142, 68, 173, 0.08) 0%, transparent 50%)',
            glowColor: 'rgba(230, 126, 34, 0.08)',
            animationDuration: '10s',
        },
        spring: {
            gradient1: 'radial-gradient(circle at 25% 75%, rgba(152, 216, 200, 0.12) 0%, transparent 50%)',
            gradient2: 'radial-gradient(circle at 75% 25%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)',
            glowColor: 'rgba(144, 238, 144, 0.08)',
            animationDuration: '12s',
        },
        summer: {
            gradient1: 'radial-gradient(circle at 50% 0%, rgba(255, 165, 0, 0.12) 0%, transparent 60%)',
            gradient2: 'radial-gradient(circle at 50% 100%, rgba(255, 99, 71, 0.08) 0%, transparent 50%)',
            glowColor: 'rgba(255, 215, 0, 0.1)',
            animationDuration: '10s',
        },
        autumn: {
            gradient1: 'radial-gradient(ellipse at 0% 0%, rgba(199, 93, 32, 0.15) 0%, transparent 50%)',
            gradient2: 'radial-gradient(ellipse at 100% 100%, rgba(184, 134, 11, 0.12) 0%, transparent 50%)',
            glowColor: 'rgba(212, 114, 42, 0.1)',
            animationDuration: '15s',
        },
        winter: {
            gradient1: 'radial-gradient(circle at 30% 30%, rgba(135, 206, 235, 0.1) 0%, transparent 50%)',
            gradient2: 'radial-gradient(circle at 70% 70%, rgba(176, 224, 230, 0.08) 0%, transparent 50%)',
            glowColor: 'rgba(173, 216, 230, 0.1)',
            animationDuration: '14s',
        },
    };

    const config = themeConfigs[currentTheme];
    if (!config) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
            {/* Primary gradient orb - moves slowly */}
            <div
                className="absolute w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full blur-2xl"
                style={{
                    background: config.gradient1,
                    animation: `subtleFloat ${config.animationDuration} ease-in-out infinite`,
                    top: '10%',
                    left: '-10%',
                }}
            />

            {/* Secondary gradient orb - moves opposite */}
            <div
                className="absolute w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] rounded-full blur-2xl"
                style={{
                    background: config.gradient2,
                    animation: `subtleFloat ${config.animationDuration} ease-in-out infinite reverse`,
                    bottom: '10%',
                    right: '-10%',
                }}
            />

            {/* Subtle center glow - pulses gently */}
            <div
                className="absolute w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] rounded-full blur-2xl"
                style={{
                    background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                    animation: `subtlePulse 6s ease-in-out infinite`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </div>
    );
};
