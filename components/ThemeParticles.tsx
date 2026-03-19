import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeParticles = () => {
    const { currentTheme } = useTheme();
    const [particles, setParticles] = useState<JSX.Element[]>([]);

    useEffect(() => {
        if (currentTheme === 'christmas') {
            // Generate snowflakes
            const snowflakes = Array.from({ length: 50 }, (_, i) => (
                <div
                    key={`snow-${i}`}
                    className="absolute text-white opacity-70 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        fontSize: `${Math.random() * 10 + 10}px`,
                        animation: `snowfall ${Math.random() * 7 + 8}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                    }}
                >
                    ❄
                </div>
            ));
            setParticles(snowflakes);
        } else if (currentTheme === 'halloween') {
            // Generate floating particles
            const ghosts = Array.from({ length: 20 }, (_, i) => (
                <div
                    key={`ghost-${i}`}
                    className="absolute opacity-20 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 20 + 20}px`,
                        animation: `ghostFloat ${Math.random() * 4 + 3}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 3}s`,
                        color: '#e67e22',
                    }}
                >
                    👻
                </div>
            ));
            setParticles(ghosts);
        } else if (currentTheme === 'spring') {
            // Generate flower petals
            const petals = Array.from({ length: 30 }, (_, i) => (
                <div
                    key={`petal-${i}`}
                    className="absolute opacity-60 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 15 + 15}px`,
                        animation: `petalFloat ${Math.random() * 4 + 3}s ease-in-out infinite alternate`,
                        animationDelay: `${Math.random() * 3}s`,
                        color: i % 3 === 0 ? '#ff69b4' : i % 3 === 1 ? '#ffd700' : '#98d8c8',
                    }}
                >
                    🌸
                </div>
            ));
            setParticles(petals);
        } else if (currentTheme === 'summer') {
            // Generate sun rays/sparkles
            const rays = Array.from({ length: 25 }, (_, i) => (
                <div
                    key={`ray-${i}`}
                    className="absolute opacity-50 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 12 + 12}px`,
                        animation: `sunPulse ${Math.random() * 2 + 2}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`,
                        color: i % 2 === 0 ? '#ffa500' : '#ff6347',
                    }}
                >
                    ✨
                </div>
            ));
            setParticles(rays);
        } else if (currentTheme === 'autumn') {
            // Generate falling leaves
            const leaves = Array.from({ length: 35 }, (_, i) => (
                <div
                    key={`leaf-${i}`}
                    className="absolute opacity-70 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        fontSize: `${Math.random() * 12 + 12}px`,
                        animation: `snowfall ${Math.random() * 8 + 10}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        color: i % 3 === 0 ? '#d2691e' : i % 3 === 1 ? '#cd853f' : '#dc143c',
                    }}
                >
                    🍂
                </div>
            ));
            setParticles(leaves);
        } else if (currentTheme === 'winter') {
            // Generate snowflakes (similar to Christmas but blue-tinted)
            const winterSnow = Array.from({ length: 40 }, (_, i) => (
                <div
                    key={`winter-snow-${i}`}
                    className="absolute opacity-60 pointer-events-none"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        fontSize: `${Math.random() * 10 + 10}px`,
                        animation: `snowfall ${Math.random() * 7 + 8}s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        color: '#87ceeb',
                    }}
                >
                    ❄
                </div>
            ));
            setParticles(winterSnow);
        } else {
            setParticles([]);
        }
    }, [currentTheme]);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles}
        </div>
    );
};
