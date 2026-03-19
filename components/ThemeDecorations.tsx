import { useTheme } from '../context/ThemeContext';

export const ThemeDecorations = () => {
    const { currentTheme } = useTheme();

    if (currentTheme === 'halloween') {
        return (
            <>
                {/* Hanging Spiders */}
                <div className="fixed top-0 left-1/4 pointer-events-none z-[90]" style={{ animation: 'ghostFloat 4s ease-in-out infinite' }}>
                    <div className="text-2xl">🕷️</div>
                    <div className="w-0.5 h-20 bg-gray-600 mx-auto"></div>
                </div>

                <div className="fixed top-0 right-1/3 pointer-events-none z-[90]" style={{ animation: 'ghostFloat 5s ease-in-out infinite', animationDelay: '1s' }}>
                    <div className="text-xl">🕷️</div>
                    <div className="w-0.5 h-16 bg-gray-600 mx-auto"></div>
                </div>
            </>
        );
    }

    if (currentTheme === 'christmas') {
        return (
            <>
                {/* Christmas Lights Border */}
                <div className="fixed top-0 left-0 right-0 h-8 pointer-events-none z-[90] flex justify-around items-center">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{
                                backgroundColor: i % 3 === 0 ? '#c0392b' : i % 3 === 1 ? '#27ae60' : '#ffd700',
                                animation: `sparkle ${2 + (i % 3)}s ease-in-out infinite`,
                                animationDelay: `${i * 0.1}s`,
                                boxShadow: '0 0 10px currentColor'
                            }}
                        />
                    ))}
                </div>

                {/* Christmas Stars in corners */}
                <div className="fixed top-4 left-4 text-4xl pointer-events-none z-[90]" style={{ animation: 'sparkle 3s ease-in-out infinite' }}>⭐</div>
                <div className="fixed top-4 right-4 text-4xl pointer-events-none z-[90]" style={{ animation: 'sparkle 3s ease-in-out infinite', animationDelay: '1s' }}>⭐</div>
            </>
        );
    }

    if (currentTheme === 'spring') {
        return (
            <>
                {/* Butterflies */}
                <div className="fixed top-1/4 right-10 text-3xl pointer-events-none z-[90]" style={{ animation: 'petalFloat 4s ease-in-out infinite alternate' }}>🦋</div>
                <div className="fixed top-1/3 left-10 text-2xl pointer-events-none z-[90]" style={{ animation: 'petalFloat 5s ease-in-out infinite alternate', animationDelay: '1s' }}>🦋</div>

                {/* Flowers in corners */}
                <div className="fixed bottom-4 left-4 text-3xl pointer-events-none z-[90]">🌷</div>
                <div className="fixed bottom-4 right-4 text-3xl pointer-events-none z-[90]">🌻</div>
            </>
        );
    }

    if (currentTheme === 'summer') {
        return (
            <>
                {/* Sun in corner */}
                <div className="fixed top-8 right-8 text-5xl pointer-events-none z-[90]" style={{ animation: 'sunPulse 3s ease-in-out infinite' }}>☀️</div>

                {/* Beach elements */}
                <div className="fixed bottom-0 left-0 right-0 h-16 pointer-events-none z-[90] flex justify-around items-end opacity-40">
                    <span className="text-2xl">🏖️</span>
                    <span className="text-2xl">🌊</span>
                    <span className="text-2xl">🐚</span>
                    <span className="text-2xl">⛱️</span>
                    <span className="text-2xl">🌊</span>
                </div>
            </>
        );
    }

    if (currentTheme === 'autumn') {
        return (
            <>
                {/* Leaves pile at bottom */}
                <div className="fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-[90] flex justify-around items-end">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <span
                            key={i}
                            className="text-2xl"
                            style={{
                                transform: `rotate(${Math.random() * 360}deg)`,
                                opacity: 0.7
                            }}
                        >
                            {i % 3 === 0 ? '🍂' : i % 3 === 1 ? '🍁' : '🌰'}
                        </span>
                    ))}
                </div>

                {/* Acorns in corners */}
                <div className="fixed top-8 left-8 text-3xl pointer-events-none z-[90]">🌰</div>
                <div className="fixed top-8 right-8 text-3xl pointer-events-none z-[90]">🍄</div>
            </>
        );
    }

    if (currentTheme === 'winter') {
        return (
            <>
                {/* Snowman in corner */}
                <div className="fixed bottom-8 right-8 text-5xl pointer-events-none z-[90]" style={{ animation: 'iceFloat 4s ease-in-out infinite' }}>⛄</div>

                {/* Icicles at top */}
                <div className="fixed top-0 left-0 right-0 h-12 pointer-events-none z-[90] flex justify-around">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="text-2xl"
                            style={{
                                animation: `iceFloat ${3 + (i % 3)}s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`
                            }}
                        >
                            🧊
                        </div>
                    ))}
                </div>
            </>
        );
    }

    return null;
};
