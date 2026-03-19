
import React, { useMemo } from 'react';

interface VisualizerProps {
    height: 'S' | 'M' | 'L' | 'XL';
    shape: string;
    colorDesc: string;
    primaryColor: string;
    secondaryColor: string;
}

export const GeneticVisualizer: React.FC<VisualizerProps> = ({ height, shape, primaryColor, secondaryColor }) => {

    const { bodyPath, hoodPath, lipPath, veins } = useMemo(() => {
        // 1. Dimensions logic
        const hVal = height === 'S' ? 120 : height === 'M' ? 220 : height === 'L' ? 300 : 380;
        const isBulbous = shape.toLowerCase().includes('bulbosa') || shape === 'bulbous';
        const isParrot = shape.toLowerCase().includes('parrot') || shape.includes('psittacina');

        // Width parameters
        let widthBase = isBulbous ? 100 : isParrot ? 70 : 45; // Wider for bulbous
        let neckWidth = isBulbous ? 40 : isParrot ? 30 : 35; // Narrow neck for bulbous

        // Center X = 150, Bottom Y = 450
        // ViewBox 0 0 300 500
        const bottomY = 460;
        const topY = bottomY - hVal;

        // Control Points for Body
        const c1y = bottomY - (hVal * 0.3); // Lower bulge
        const c2y = topY + (hVal * 0.2); // Upper neck constriction

        // Body Path Generator
        // Left Side
        const startL = [150 - 10, bottomY];
        const bulgeL = [150 - (widthBase * 0.6), c1y];
        const neckL = [150 - (neckWidth), c2y];
        const lipL = [150 - (neckWidth + 10), topY];

        // Right Side
        const startR = [150 + 10, bottomY];
        const bulgeR = [150 + (widthBase * 0.6), c1y];
        const neckR = [150 + (neckWidth), c2y];
        const lipR = [150 + (neckWidth + 10), topY];

        const bodyD = `
            M 150 ${bottomY}
            L ${startL[0]} ${startL[1]}
            C ${startL[0]} ${startL[1]}, ${bulgeL[0]} ${bulgeL[1]}, ${neckL[0]} ${neckL[1]}
            Q ${lipL[0]} ${lipL[1]} ${lipL[0]} ${lipL[1]}
            L ${lipR[0]} ${lipR[1]}
            Q ${neckR[0]} ${neckR[1]} ${neckR[0]} ${neckR[1]}
            C ${neckR[0]} ${neckR[1]}, ${bulgeR[0]} ${bulgeR[1]}, ${startR[0]} ${startR[1]}
            Z
        `;

        // Hood Logic
        const hoodHeight = isParrot ? 80 : 70;
        // Parrot hoods curve heavily over the opening

        const hoodD = isParrot ? `
            M ${lipL[0]} ${lipL[1]}
            C ${lipL[0] - 30} ${topY - 50}, ${lipR[0] + 60} ${topY - 80}, ${150 + 60} ${topY + 30}
            Q ${150 + 20} ${topY + 60} ${lipR[0]} ${lipR[1]}
        ` : `
            M ${lipL[0]} ${lipL[1]}
            C ${lipL[0] - 20} ${topY - hoodHeight}, ${lipR[0] + 20} ${topY - hoodHeight}, ${lipR[0]} ${lipR[1]}
            Q ${150} ${topY + 20} ${lipL[0]} ${lipL[1]}
        `;

        // Veins Generator
        const vPaths = [];
        const veinCount = isBulbous ? 7 : 5;
        for (let i = 0; i < veinCount; i++) {
            // distribute veins across width
            // Interpolate X based on i from -1 to 1 range (approx)
            // (i - (veinCount-1)/2)
            const centerOffset = i - ((veinCount - 1) / 2);
            const factor = centerOffset / ((veinCount - 1) / 2); // -1 to 1

            const spread = widthBase * 0.7;

            const vStart = [150 + (factor * 5), bottomY];
            const vMid = [150 + (factor * spread), bottomY - hVal * 0.5];
            const vEnd = [150 + (factor * (neckWidth + 10)), topY];

            vPaths.push(
                <path
                    key={`v-${i}`}
                    d={`M ${vStart[0]} ${vStart[1]} Q ${vMid[0]} ${vMid[1]} ${vEnd[0]} ${vEnd[1]}`}
                    stroke={secondaryColor}
                    strokeWidth={1.5}
                    fill="none"
                    opacity="0.6"
                    className="mix-blend-multiply"
                />
            );
        }

        // Horizontal veins (Reticulation)
        for (let j = 1; j < 6; j++) {
            const yPos = bottomY - (hVal * (j / 6));
            vPaths.push(
                <path
                    key={`h-${j}`}
                    d={`M ${150 - (widthBase / 2)} ${yPos} Q ${150} ${yPos + 20} ${150 + (widthBase / 2)} ${yPos}`}
                    stroke={secondaryColor}
                    strokeWidth={0.5}
                    fill="none"
                    opacity="0.3"
                />
            );
        }


        return {
            bodyPath: bodyD,
            hoodPath: hoodD,
            lipPath: `M ${lipL[0]} ${lipL[1]} Q ${150} ${topY + 15} ${lipR[0]} ${lipR[1]}`, // Front lip curve
            veins: vPaths,
            dimensions: { width: 300, height: 500, topY }
        };

    }, [height, shape, primaryColor, secondaryColor]);

    return (
        <div className="w-full h-full flex items-center justify-center filter drop-shadow-xl">
            <svg width="100%" height="100%" viewBox="0 0 300 500" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {/* 1. Organic Noise Texture (Optimized) */}
                    <filter id="organicTexture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="1" result="noise" />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2" /> {/* Low opacity noise */}
                        </feComponentTransfer>
                        <feComposite operator="in" in="noise" in2="SourceGraphic" result="textured" />
                    </filter>

                    {/* 2. Volumetric Body Gradient (Side darkening) */}
                    <linearGradient id="volumetric" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
                        <stop offset="30%" stopColor="#fff" stopOpacity="0.1" /> {/* Highlight */}
                        <stop offset="50%" stopColor="#000" stopOpacity="0" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
                    </linearGradient>

                    {/* 3. Main Color Gradient (Vertical) */}
                    <linearGradient id="mainColor" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#388E3C" /> {/* Green base */}
                        <stop offset="40%" stopColor={primaryColor} />
                        <stop offset="90%" stopColor={primaryColor} />
                        <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.5" /> {/* Top fade */}
                    </linearGradient>
                </defs>

                {/* --- RENDER --- */}

                {/* Shadow */}
                <ellipse cx="150" cy="460" rx="40" ry="10" fill="#000" opacity="0.2" filter="blur(4px)" />

                {/* Back Wall (Interior) - Darker */}
                <path d={bodyPath} fill={primaryColor} filter="brightness(0.7)" />

                {/* Main Body */}
                <g filter="url(#organicTexture)">
                    <path d={bodyPath} fill="url(#mainColor)" />
                </g>

                {/* Veins */}
                <g style={{ mask: 'url(#bodyMask)' }}>
                    {veins}
                </g>

                {/* Volumetric Overlay */}
                <path d={bodyPath} fill="url(#volumetric)" style={{ mixBlendMode: 'overlay' }} />

                {/* Hood (Lid) */}
                <path d={hoodPath} fill={primaryColor} stroke={secondaryColor} strokeWidth="2" />
                <path d={hoodPath} fill="url(#volumetric)" style={{ mixBlendMode: 'overlay' }} opacity="0.5" />

                {/* Lip (Peristome) - Glossy */}
                <path d={lipPath} stroke={secondaryColor} strokeWidth="4" fill="none" opacity="0.8" />
                <path d={lipPath} stroke="#fff" strokeWidth="2" fill="none" opacity="0.4" style={{ mixBlendMode: 'screen' }} />


            </svg>
        </div>
    );
};
