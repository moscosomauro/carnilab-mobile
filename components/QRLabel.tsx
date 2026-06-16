import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plant } from '../types';

interface QRLabelProps {
    plant: Plant;
    onClose: () => void;
    canPrint: boolean;
}

// Paleta de colores orgánicos y terrosos por género - estilo ilustración botánica
const GENUS_THEMES: Record<string, { primary: string; secondary: string; tertiary: string; accent: string; bg: string }> = {
    sarracenia: {
        primary: '#8B5A3C',      // Marrón cálido
        secondary: '#A67C52',    // Beige dorado
        tertiary: '#6B8E23',     // Verde oliva
        accent: '#D4A574',       // Beige claro
        bg: '#F5E6D3'            // Crema
    },
    dionaea: {
        primary: '#7C3A2E',      // Marrón rojizo
        secondary: '#9B5C4C',    // Terracota
        tertiary: '#8B7355',     // Marrón arena
        accent: '#C19A6B',       // Camel
        bg: '#F0E5DC'            // Marfil
    },
    nepenthes: {
        primary: '#6B5D4F',      // Marrón grisáceo
        secondary: '#8C7A6B',    // Taupe
        tertiary: '#556B2F',     // Verde oliva oscuro
        accent: '#B8A07E',       // Beige piedra
        bg: '#EBE3D5'            // Lino
    },
    drosera: {
        primary: '#8B4C39',      // Marrón óxido
        secondary: '#A67B5B',    // Marrón arena
        tertiary: '#6B8E23',     // Verde musgo
        accent: '#D2B48C',       // Tan
        bg: '#F5E8DC'            // Champagne
    },
    pinguicula: {
        primary: '#7A5C52',      // Marrón rosado
        secondary: '#9C7B6B',    // Marrón claro
        tertiary: '#8FBC8F',     // Verde mar
        accent: '#C4A582',       // Beige rosado
        bg: '#F0E6E0'            // Rosa arena
    },
    utricularia: {
        primary: '#6B7C5A',      // Verde grisáceo
        secondary: '#8A9A7B',    // Salvia
        tertiary: '#5F7A61',     // Verde pino
        accent: '#B8C5A8',       // Verde claro
        bg: '#E8F0E0'            // Verde pálido
    },
    cephalotus: {
        primary: '#5D6B4E',      // Verde oscuro
        secondary: '#7A8A68',    // Verde grisáceo
        tertiary: '#4A5D4F',     // Verde bosque
        accent: '#A8B89A',       // Verde salvia
        bg: '#E5EBD9'            // Verde menta
    },
    heliamphora: {
        primary: '#8B6B47',      // Bronce
        secondary: '#A68A5C',    // Oro viejo
        tertiary: '#6B7C5A',     // Verde dorado
        accent: '#C4A572',       // Dorado claro
        bg: '#F5EDE0'            // Hueso
    },
    darlingtonia: {
        primary: '#5B6B52',      // Verde musgo
        secondary: '#7A8C6F',    // Verde grisáceo
        tertiary: '#4F6B4E',     // Verde pino
        accent: '#A3B59C',       // Verde menta
        bg: '#E5F0E0'            // Verde suave
    },
    byblis: {
        primary: '#8B7E3F',      // Dorado viejo
        secondary: '#A39858',    // Amarillo tierra
        tertiary: '#7A8C6F',     // Verde dorado
        accent: '#C4B582',       // Beige dorado
        bg: '#F0EBCC'            // Amarillo pálido
    },
    default: {
        primary: '#6B5D4F',      // Marrón neutral
        secondary: '#8A7C6B',    // Gris cálido
        tertiary: '#5D6B5A',     // Verde gris
        accent: '#B8A896',       // Beige gris
        bg: '#EBE5DC'            // Marfil
    }
};

// Función para detectar el género de la especie
const getGenusFromSpecies = (species: string): string => {
    const lowerSpecies = species.toLowerCase();

    if (lowerSpecies.includes('dionaea')) return 'dionaea';
    if (lowerSpecies.includes('nepenthes')) return 'nepenthes';
    if (lowerSpecies.includes('sarracenia')) return 'sarracenia';
    if (lowerSpecies.includes('drosera')) return 'drosera';
    if (lowerSpecies.includes('pinguicula')) return 'pinguicula';
    if (lowerSpecies.includes('utricularia')) return 'utricularia';
    if (lowerSpecies.includes('cephalotus')) return 'cephalotus';
    if (lowerSpecies.includes('heliamphora')) return 'heliamphora';
    if (lowerSpecies.includes('darlingtonia')) return 'darlingtonia';
    if (lowerSpecies.includes('byblis')) return 'byblis';

    return 'default';
};

// Helper para obtener el nombre del archivo de diseño por género
const getDesignFilename = (genus: string): string => {
    const genusMap: Record<string, string> = {
        'sarracenia': 'QR Sarracenia',
        'dionaea': 'QR Dionaea',
        'nepenthes': 'QR Nephentes',
        'drosera': 'QR Droseras',
        'pinguicula': 'QR Pinguicula',
        'utricularia': 'QR Utricularia',
        'cephalotus': 'QR Cephalotus',
        'heliamphora': 'QR Heliamphoras',
        'darlingtonia': 'QR Darlingtonia',
        'byblis': 'QR Sarracenia', // Fallback a Sarracenia si no existe
        'default': 'QR Sarracenia'
    };
    return genusMap[genus] || genusMap['default'];
};

// Generar HTML para impresión usando tu diseño artístico con QR dinámico
const generateLabelPrintHTML = (plant: Plant): string => {
    const genus = getGenusFromSpecies(plant.especie);
    const theme = GENUS_THEMES[genus];
    const designFile = getDesignFilename(genus);
    const qrValue = `carnilab-plant-${plant.id}`;

    // Convertir color hex a formato URL-safe (sin #)
    const fgColorHex = theme.primary.replace('#', '');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Etiqueta QR - ${plant.nombre}</title>
            <style>
                @page {
                    size: 10cm 10cm;
                    margin: 0;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                body {
                    width: 10cm;
                    height: 10cm;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .label-container {
                    width: 9cm;
                    height: 9cm;
                    position: relative;
                }

                .background-design {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .qr-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 170px;
                    height: 170px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle, ${theme.bg} 60%, ${theme.bg}ee 75%, ${theme.bg}aa 85%, transparent 100%);
                    border-radius: 18px;
                    padding: 8px;
                }

                .qr-overlay img {
                    width: 145px;
                    height: 145px;
                    display: block;
                }
            </style>
        </head>
        <body>
            <div class="label-container">
                <!-- Tu diseño artístico como fondo -->
                <img src="/assets/designs/${designFile}.png" alt="${genus}" class="background-design">

                <!-- QR dinámico integrado suavemente -->
                <div class="qr-overlay">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=145x145&data=${encodeURIComponent(qrValue)}&margin=0&color=${fgColorHex}"
                         alt="QR Code" style="background: transparent;">
                </div>
            </div>
        </body>
        </html>
    `;
};

// getIconFilename removed as it was unused

export const QRLabel: React.FC<QRLabelProps> = ({ plant, onClose, canPrint }) => {
    const genus = getGenusFromSpecies(plant.especie);
    const theme = GENUS_THEMES[genus];

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        iframeDoc.open();
        iframeDoc.write(generateLabelPrintHTML(plant));
        iframeDoc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md flex flex-col animate-in zoom-in duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">
                                Etiqueta QR Personalizada
                            </h3>
                            <p className="text-sm font-bold text-gray-500">
                                {plant.nombre}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <span className="text-lg font-bold text-gray-700">✕</span>
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="p-6 flex items-center justify-center" style={{ background: '#f5f5f5' }}>
                    <div
                        className="relative"
                        style={{
                            width: '360px',
                            height: '360px'
                        }}
                    >
                        {/* Tu diseño artístico como fondo */}
                        <img
                            src={`./assets/designs/${getDesignFilename(genus)}.png`}
                            alt={genus}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />

                        {/* QR dinámico superpuesto - integrado suavemente */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '190px',
                            height: '190px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `radial-gradient(circle, ${theme.bg} 60%, ${theme.bg}ee 75%, ${theme.bg}aa 85%, transparent 100%)`,
                            borderRadius: '18px',
                            padding: '10px'
                        }}>
                            <QRCodeSVG
                                value={`carnilab-plant-${plant.id}`}
                                size={162}
                                level="H"
                                includeMargin={false}
                                bgColor="transparent"
                                fgColor={theme.primary}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {canPrint ? (
                    <div className="px-6 pb-6 pt-4">
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex-1 h-12 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                style={{ background: theme.primary }}
                            >
                                <span className="text-lg">🖨️</span>
                                Imprimir Etiqueta QR
                            </button>
                            <button
                                onClick={onClose}
                                className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl active:scale-95 transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 pb-6 pt-4 text-center">
                        <div className="text-5xl opacity-40 mb-3">🔒</div>
                        <p className="text-sm font-bold text-gray-600 mb-4">
                            Las etiquetas QR personalizadas son exclusivas para usuarios{' '}
                            <span className="text-amber-500 font-black">ELITE</span>
                        </p>
                        <button
                            onClick={onClose}
                            className="h-12 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-2xl active:scale-95 transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
