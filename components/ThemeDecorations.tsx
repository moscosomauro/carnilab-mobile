import { useTheme } from '../context/ThemeContext';

export const ThemeDecorations = () => {
    const { currentTheme } = useTheme();

    // Christmas: subtle light bar at top
    if (currentTheme === 'christmas') {
        return (
            <div className="fixed top-0 left-0 right-0 h-1 pointer-events-none z-[90]">
                <div
                    className="w-full h-full"
                    style={{
                        background: 'linear-gradient(90deg, #c0392b 0%, #27ae60 25%, #ffd700 50%, #c0392b 75%, #27ae60 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 3s linear infinite',
                    }}
                />
            </div>
        );
    }

    // Halloween: subtle orange glow at edges
    if (currentTheme === 'halloween') {
        return (
            <>
                <div
                    className="fixed top-0 left-0 w-32 h-32 pointer-events-none z-[90] rounded-full blur-2xl opacity-20"
                    style={{
                        background: 'radial-gradient(circle, #e67e22 0%, transparent 70%)',
                        animation: 'subtlePulse 4s ease-in-out infinite',
                    }}
                />
                <div
                    className="fixed bottom-0 right-0 w-32 h-32 pointer-events-none z-[90] rounded-full blur-2xl opacity-20"
                    style={{
                        background: 'radial-gradient(circle, #8e44ad 0%, transparent 70%)',
                        animation: 'subtlePulse 4s ease-in-out infinite',
                        animationDelay: '2s',
                    }}
                />
            </>
        );
    }

    // Spring: soft pink/green accent line
    if (currentTheme === 'spring') {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-0.5 pointer-events-none z-[90]">
                <div
                    className="w-full h-full"
                    style={{
                        background: 'linear-gradient(90deg, #98d8c8 0%, #ffb6c1 50%, #98d8c8 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 4s linear infinite',
                    }}
                />
            </div>
        );
    }

    // Summer: warm glow at top
    if (currentTheme === 'summer') {
        return (
            <div
                className="fixed top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none z-[90] rounded-full blur-2xl opacity-15"
                style={{
                    background: 'radial-gradient(ellipse, #ffa500 0%, transparent 70%)',
                    animation: 'subtlePulse 5s ease-in-out infinite',
                }}
            />
        );
    }

    // Autumn: elegant warm light rays from corners
    if (currentTheme === 'autumn') {
        return (
            <>
                {/* Top-left warm light */}
                <div
                    className="fixed top-0 left-0 w-80 h-80 pointer-events-none z-[1]"
                    style={{
                        background: 'radial-gradient(ellipse at 0% 0%, rgba(199, 93, 32, 0.08) 0%, transparent 70%)',
                    }}
                />
                {/* Bottom-right golden glow */}
                <div
                    className="fixed bottom-0 right-0 w-96 h-96 pointer-events-none z-[1]"
                    style={{
                        background: 'radial-gradient(ellipse at 100% 100%, rgba(184, 134, 11, 0.06) 0%, transparent 70%)',
                    }}
                />
                {/* Subtle top accent line */}
                <div className="fixed top-0 left-0 right-0 h-[2px] pointer-events-none z-[90]">
                    <div
                        className="w-full h-full"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(199, 93, 32, 0.4) 20%, rgba(184, 134, 11, 0.5) 50%, rgba(199, 93, 32, 0.4) 80%, transparent 100%)',
                        }}
                    />
                </div>
            </>
        );
    }

    // Winter: cool blue accent at top
    if (currentTheme === 'winter') {
        return (
            <div className="fixed top-0 left-0 right-0 h-0.5 pointer-events-none z-[90]">
                <div
                    className="w-full h-full"
                    style={{
                        background: 'linear-gradient(90deg, #87ceeb 0%, #b0e0e6 50%, #87ceeb 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 4s linear infinite',
                    }}
                />
            </div>
        );
    }

    return null;
};
