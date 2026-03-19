import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plant, DiaryEntry } from '../types';

interface TechnicalSheetProps {
    plant: Plant;
    diaryEntries?: DiaryEntry[];
    onClose: () => void;
    canPrint: boolean;
}

// Function to generate static HTML for printing
const generatePrintHTML = (plant: Plant, diaryEntries: DiaryEntry[]): string => {
    const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
        saludable: { label: 'Saludable', color: '#4A5D4F', bg: '#CDE8B5' },
        regular: { label: 'Regular', color: '#8E7C4B', bg: '#F2E8D5' },
        critico: { label: 'Crítico', color: '#A33D3D', bg: '#F2D5D5' },
    };

    const currentStatus = estadoConfig[plant.estado] || estadoConfig.saludable;

    // Calculate stats
    const totalEntries = diaryEntries.length;
    const typeCount = diaryEntries.reduce((acc, entry) => {
        acc[entry.tipo] = (acc[entry.tipo] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const heights = diaryEntries
        .filter(e => e.altura)
        .map(e => ({ fecha: e.fecha, altura: e.altura! }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    const currentHeight = heights.length > 0 ? heights[heights.length - 1].altura : null;
    const initialHeight = heights.length > 0 ? heights[0].altura : null;
    const growth = initialHeight && currentHeight ? currentHeight - initialHeight : null;

    const daysSince = plant.fecha_adquisicion
        ? Math.floor((new Date().getTime() - new Date(plant.fecha_adquisicion).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const eventIcons: Record<string, string> = {
        riego: '💧',
        fertilizacion: '🌱',
        poda: '✂️',
        observacion: '👁️',
    };

    const eventLabels: Record<string, string> = {
        riego: 'Riegos',
        fertilizacion: 'Fertilizaciones',
        poda: 'Podas',
        observacion: 'Observaciones',
    };

    // Generate QR Code value - use simple format that scanner expects
    const qrValue = `carnilab-plant-${plant.id}`;

    return `
        <div style="background: white; color: black; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <!-- HEADER -->
            <div style="margin-bottom: 30px;">
                <div style="height: 8px; margin-bottom: 15px; background: linear-gradient(to right, #4A5D4F, #6B8E23, #4A5D4F);"></div>

                <div style="display: flex; justify-content: space-between; align-items: start; gap: 30px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <div style="width: 48px; height: 48px; background: #4A5D4F; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">🌿</div>
                            <div>
                                <div style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">
                                    CarniLab • Ficha Técnica Profesional
                                </div>
                                <div style="font-size: 9px; font-weight: bold; color: #8E877F;">
                                    ID: ${plant.id} • Generado: ${new Date().toLocaleDateString('es-ES')}
                                </div>
                            </div>
                        </div>

                        <h1 style="font-size: 36px; font-weight: 900; color: #2E2E2E; margin: 0 0 10px 0; line-height: 1.2;">
                            ${plant.nombre}
                        </h1>
                        <p style="font-size: 24px; font-weight: bold; color: #8E877F; font-style: italic; margin: 0 0 20px 0;">
                            ${plant.especie}
                        </p>

                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <div style="padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 900; background: ${currentStatus.bg}; color: ${currentStatus.color};">
                                ● ${currentStatus.label}
                            </div>
                            ${daysSince !== null ? `
                                <div style="padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 900; background: #E5E1DB; color: #4A5D4F;">
                                    📅 ${daysSince} días en cultivo
                                </div>
                            ` : ''}
                            ${plant.en_venta ? `
                                <div style="padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 900; background: rgba(255, 122, 89, 0.2); color: #FF7A59;">
                                    💰 En Venta
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <div style="padding: 15px; background: white; border: 4px solid #4A5D4F; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrValue)}&margin=0" alt="QR Code" style="display: block; width: 140px; height: 140px;" />
                        </div>
                        <p style="font-size: 9px; font-weight: 900; color: #8E877F; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">
                            Escanear para acceso rápido
                        </p>
                        <p style="font-size: 8px; font-weight: bold; color: #AAAAAA; margin-top: 5px;">
                            ${qrValue}
                        </p>
                    </div>
                </div>
            </div>

            <!-- MAIN CONTENT -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 30px;">
                <!-- LEFT COLUMN -->
                <div>
                    ${plant.imagen ? `
                        <div style="margin-bottom: 30px;">
                            <div style="border-radius: 20px; overflow: hidden; border: 4px solid #F5F1EB;">
                                <img src="${plant.imagen}" alt="${plant.nombre}" style="width: 100%; height: 320px; object-fit: cover; display: block;" />
                            </div>
                        </div>
                    ` : ''}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: #F5F1EB; border-radius: 15px; padding: 15px;">
                            <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 10px;">📍 Ubicación</div>
                            <div style="font-size: 14px; font-weight: 900; color: #2E2E2E;">${plant.ubicacion || 'No especificada'}</div>
                        </div>
                        <div style="background: #F5F1EB; border-radius: 15px; padding: 15px;">
                            <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 10px;">📅 Adquisición</div>
                            <div style="font-size: 14px; font-weight: 900; color: #2E2E2E;">${plant.fecha_adquisicion ? new Date(plant.fecha_adquisicion).toLocaleDateString('es-ES') : 'No especificado'}</div>
                        </div>
                        <div style="background: #F5F1EB; border-radius: 15px; padding: 15px;">
                            <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 10px;">🌍 Origen</div>
                            <div style="font-size: 14px; font-weight: 900; color: #2E2E2E;">${plant.origen || 'No especificado'}</div>
                        </div>
                        ${plant.precio ? `
                            <div style="background: #F5F1EB; border-radius: 15px; padding: 15px;">
                                <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 10px;">💵 Precio Adquisición</div>
                                <div style="font-size: 14px; font-weight: 900; color: #2E2E2E;">$${plant.precio}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- RIGHT COLUMN -->
                <div>
                    <!-- Stats -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 15px;">📊 Estadísticas</h3>
                        ${currentHeight !== null ? `
                            <div style="background: #F5F1EB; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                                <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 5px;">📏 Altura Actual</div>
                                <div style="font-size: 20px; font-weight: 900; color: #2E2E2E;">${currentHeight} cm</div>
                            </div>
                        ` : ''}
                        ${growth !== null && growth > 0 ? `
                            <div style="background: rgba(107, 142, 35, 0.1); border: 2px solid #6B8E23; border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                                <div style="font-size: 9px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 5px;">📈 Crecimiento</div>
                                <div style="font-size: 20px; font-weight: 900; color: #6B8E23;">+${growth} cm</div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Diary Activity -->
                    <div style="margin-bottom: 30px;">
                        <h3 style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 15px;">📖 Actividad del Diario</h3>
                        <div style="background: #F5F1EB; border-radius: 15px; padding: 15px;">
                            <div style="text-align: center; margin-bottom: 15px;">
                                <div style="font-size: 30px; font-weight: 900; color: #4A5D4F;">${totalEntries}</div>
                                <div style="font-size: 9px; font-weight: bold; color: #8E877F; text-transform: uppercase;">Registros Totales</div>
                            </div>
                            ${Object.entries(typeCount).map(([type, count]) => `
                                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
                                    <span style="font-weight: bold; color: #4A5D4F;">${eventIcons[type]} ${eventLabels[type]}</span>
                                    <span style="font-weight: 900; color: #2E2E2E;">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${plant.en_venta && plant.precio_venta ? `
                        <div style="background: linear-gradient(to bottom right, #FF7A59, #FF6B4A); border-radius: 15px; padding: 15px; color: white;">
                            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">💰 Información de Venta</div>
                            <div style="font-size: 30px; font-weight: 900; margin-bottom: 5px;">$${plant.precio_venta}</div>
                            <div style="font-size: 12px; font-weight: bold; opacity: 0.9;">Disponible para la venta</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${plant.notas ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 15px;">📝 Notas de Cultivo</h3>
                    <div style="background: #F5F1EB; border-radius: 15px; padding: 20px; border-left: 4px solid #4A5D4F;">
                        <p style="font-size: 14px; font-weight: 500; color: #4A5D4F; line-height: 1.6; margin: 0;">${plant.notas}</p>
                    </div>
                </div>
            ` : ''}

            ${heights.length > 1 ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 15px;">📈 Evolución de Altura</h3>
                    <div style="background: #F5F1EB; border-radius: 15px; padding: 20px;">
                        <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 150px; gap: 10px;">
                            ${heights.slice(-8).map((record) => {
                                const maxHeight = Math.max(...heights.slice(-8).map(r => r.altura));
                                const heightPercent = (record.altura / maxHeight) * 100;
                                return `
                                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                        <div style="font-size: 10px; font-weight: 900; color: #4A5D4F;">${record.altura}cm</div>
                                        <div style="width: 100%; background: linear-gradient(to top, #4A5D4F, #6B8E23); border-radius: 5px 5px 0 0; min-height: 20%; height: ${heightPercent}%;"></div>
                                        <div style="font-size: 8px; font-weight: bold; color: #8E877F; text-align: center;">
                                            ${new Date(record.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            ${diaryEntries.length > 0 ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 10px; font-weight: 900; color: #8E877F; text-transform: uppercase; margin-bottom: 15px;">📋 Últimos Registros del Diario</h3>
                    ${diaryEntries.slice(0, 5).map((entry) => `
                        <div style="background: #F5F1EB; border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; gap: 12px;">
                            <div style="width: 32px; height: 32px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <span style="font-size: 14px;">${eventIcons[entry.tipo]}</span>
                            </div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 12px; font-weight: 900; color: #4A5D4F;">${eventLabels[entry.tipo]}</span>
                                    <span style="font-size: 9px; font-weight: bold; color: #8E877F;">${new Date(entry.fecha).toLocaleDateString('es-ES')}</span>
                                </div>
                                ${entry.descripcion ? `<p style="font-size: 12px; color: #4A5D4F; margin: 0;">${entry.descripcion}</p>` : ''}
                                ${entry.altura || entry.hojas ? `
                                    <div style="display: flex; gap: 10px; margin-top: 5px;">
                                        ${entry.altura ? `<span style="font-size: 9px; font-weight: bold; color: #8E877F;">📏 ${entry.altura}cm</span>` : ''}
                                        ${entry.hojas ? `<span style="font-size: 9px; font-weight: bold; color: #8E877F;">🍃 ${entry.hojas}h</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <!-- FOOTER -->
            <div style="border-top: 2px solid #F5F1EB; padding-top: 15px; margin-top: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 9px; font-weight: bold; color: #8E877F;">
                        Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div style="font-size: 9px; font-weight: 900; color: #4A5D4F; text-transform: uppercase; letter-spacing: 2px;">
                        CarniLab • Gestor Profesional
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const TechnicalSheet: React.FC<TechnicalSheetProps> = ({ plant, diaryEntries = [], onClose, canPrint }) => {
    const handlePrint = () => {
        // Create a hidden iframe for printing
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

        // Write the complete HTML document
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Ficha Técnica - ${plant.nombre}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 15mm;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 20px;
                        background: white;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    }

                    .no-break {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                </style>
            </head>
            <body>
                ${generatePrintHTML(plant, diaryEntries)}
            </body>
            </html>
        `);
        iframeDoc.close();

        // Wait for images to load, then print
        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            // Remove iframe after printing
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 1000);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[40px] w-full max-w-4xl flex flex-col animate-in zoom-in duration-300 overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Only visible in modal */}
                <div className="px-8 pt-8 pb-4 border-b border-[#F5F1EB]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-[#2E2E2E] mb-1">
                                Ficha Técnica Profesional
                            </h3>
                            <p className="text-sm font-bold text-[#8E877F] italic">
                                {plant.nombre} • {plant.especie}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-[#F5F1EB] hover:bg-[#E5E1DB] flex items-center justify-center transition-colors"
                        >
                            <span className="text-lg font-bold text-[#4A5D4F]">✕</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto px-8 py-6">
                    {canPrint ? (
                        <TechnicalSheetContent plant={plant} diaryEntries={diaryEntries} />
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="text-7xl opacity-40">🔒</div>
                            <h3 className="text-2xl font-black text-[#2E2E2E] mb-2">
                                Contenido Exclusivo
                            </h3>
                            <p className="text-base font-bold text-[#8E877F] max-w-md">
                                La generación de fichas técnicas profesionales es una característica exclusiva para usuarios{' '}
                                <span className="text-[#FFB800] font-black">ELITE</span>
                            </p>
                            <div className="mt-6 p-6 bg-[#F5F1EB] rounded-2xl max-w-md">
                                <p className="text-sm font-bold text-[#4A5D4F] mb-3">
                                    Desbloquea acceso a:
                                </p>
                                <ul className="text-xs text-[#8E877F] space-y-2 text-left">
                                    <li>✓ Fichas técnicas profesionales imprimibles</li>
                                    <li>✓ Códigos QR personalizados</li>
                                    <li>✓ Estadísticas completas de crecimiento</li>
                                    <li>✓ Historial de eventos del diario</li>
                                    <li>✓ Información comercial y genealógica</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions - Only visible in modal */}
                {canPrint && (
                    <div className="px-8 pb-8 pt-4 border-t border-[#F5F1EB]">
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex-1 h-14 bg-[#4A5D4F] hover:bg-[#3a4d3f] text-white font-black rounded-full active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🖨️</span>
                                Imprimir Ficha Técnica
                            </button>
                            <button
                                onClick={onClose}
                                className="h-14 px-6 bg-[#F5F1EB] hover:bg-[#E5E1DB] text-[#4A5D4F] font-black rounded-full active:scale-95 transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Separate component for the actual technical sheet content
const TechnicalSheetContent: React.FC<{ plant: Plant; diaryEntries: DiaryEntry[] }> = ({ plant, diaryEntries }) => {
    const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
        saludable: { label: 'Saludable', color: '#4A5D4F', bg: '#CDE8B5' },
        regular: { label: 'Regular', color: '#8E7C4B', bg: '#F2E8D5' },
        critico: { label: 'Crítico', color: '#A33D3D', bg: '#F2D5D5' },
    };

    const currentStatus = estadoConfig[plant.estado] || estadoConfig.saludable;

    // Calcular estadísticas del diario
    const stats = useMemo(() => {
        const totalEntries = diaryEntries.length;
        const typeCount = diaryEntries.reduce((acc, entry) => {
            acc[entry.tipo] = (acc[entry.tipo] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Obtener mediciones de altura
        const heights = diaryEntries
            .filter(e => e.altura)
            .map(e => ({ fecha: e.fecha, altura: e.altura! }))
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        const currentHeight = heights.length > 0 ? heights[heights.length - 1].altura : null;
        const initialHeight = heights.length > 0 ? heights[0].altura : null;
        const growth = initialHeight && currentHeight ? currentHeight - initialHeight : null;

        // Días desde adquisición
        const daysSince = plant.fecha_adquisicion
            ? Math.floor((new Date().getTime() - new Date(plant.fecha_adquisicion).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        // Última entrada del diario
        const lastEntry = diaryEntries.length > 0
            ? diaryEntries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
            : null;

        return {
            totalEntries,
            typeCount,
            heights,
            currentHeight,
            initialHeight,
            growth,
            daysSince,
            lastEntry,
        };
    }, [diaryEntries, plant.fecha_adquisicion]);

    // Íconos para tipos de eventos
    const eventIcons: Record<string, string> = {
        riego: '💧',
        fertilizacion: '🌱',
        poda: '✂️',
        observacion: '👁️',
    };

    const eventLabels: Record<string, string> = {
        riego: 'Riegos',
        fertilizacion: 'Fertilizaciones',
        poda: 'Podas',
        observacion: 'Observaciones',
    };

    return (
        <div className="bg-white text-black p-4">
            {/* HEADER SECTION - Premium Lab Style */}
            <div className="relative no-break mb-6">
                {/* Top Border Accent */}
                <div className="h-2 mb-4" style={{ background: 'linear-gradient(to right, #4A5D4F, #6B8E23, #4A5D4F)' }} />

                <div className="flex items-start justify-between gap-6">
                    {/* Left: Plant Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-[#4A5D4F] rounded-full flex items-center justify-center text-white text-2xl">
                                🌿
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-[#8E877F] uppercase tracking-[0.2em] mb-1">
                                    CarniLab • Ficha Técnica Profesional
                                </div>
                                <div className="text-[9px] font-bold text-[#8E877F]">
                                    ID: {plant.id} • Generado: {new Date().toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-[#2E2E2E] leading-tight mb-2">
                            {plant.nombre}
                        </h1>
                        <p className="text-2xl font-bold text-[#8E877F] italic mb-4">
                            {plant.especie}
                        </p>

                        {/* Quick Status Badges */}
                        <div className="flex gap-2 flex-wrap">
                            <div
                                className="px-4 py-2 rounded-full text-sm font-black flex items-center gap-2"
                                style={{ backgroundColor: currentStatus.bg, color: currentStatus.color }}
                            >
                                <span>●</span>
                                {currentStatus.label}
                            </div>
                            {stats.daysSince !== null && (
                                <div className="px-4 py-2 rounded-full text-sm font-black bg-[#E5E1DB] text-[#4A5D4F]">
                                    📅 {stats.daysSince} días en cultivo
                                </div>
                            )}
                            {plant.en_venta && (
                                <div className="px-4 py-2 rounded-full text-sm font-black" style={{ backgroundColor: 'rgba(255, 122, 89, 0.2)', color: '#FF7A59' }}>
                                    💰 En Venta
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: QR Code */}
                    <div className="flex-shrink-0 text-center">
                        <div className="p-3 bg-white border-4 border-[#4A5D4F] rounded-2xl shadow-lg">
                            <QRCodeSVG
                                value={`carnilab-plant-${plant.id}`}
                                size={140}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-[9px] font-black text-[#8E877F] mt-2 uppercase tracking-wider">
                            Escanear para acceso rápido
                        </p>
                        <p className="text-[8px] font-bold text-[#AAAAAA] mt-1">
                            carnilab-plant-{plant.id}
                        </p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-3 gap-6 mb-6">
                {/* LEFT COLUMN: Image + Basic Info */}
                <div className="col-span-2 space-y-6">
                    {/* Plant Image */}
                    {plant.imagen && (
                        <div className="no-break">
                            <div className="relative rounded-3xl overflow-hidden border-4 border-[#F5F1EB] shadow-xl">
                                <img
                                    src={plant.imagen}
                                    alt={plant.nombre}
                                    className="w-full h-80 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                                    <p className="text-white text-xs font-bold">
                                        Fotografía Principal • {plant.nombre}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Information Grid */}
                    <div className="grid grid-cols-2 gap-3 no-break">
                        <InfoCard
                            icon="📍"
                            label="Ubicación"
                            value={plant.ubicacion || 'No especificada'}
                        />
                        <InfoCard
                            icon="📅"
                            label="Fecha de Adquisición"
                            value={plant.fecha_adquisicion
                                ? new Date(plant.fecha_adquisicion).toLocaleDateString('es-ES')
                                : 'No especificado'}
                        />
                        <InfoCard
                            icon="🌍"
                            label="Origen"
                            value={plant.origen || 'No especificado'}
                        />
                        {plant.precio && (
                            <InfoCard
                                icon="💵"
                                label="Precio de Adquisición"
                                value={`$${plant.precio}`}
                            />
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Stats & Growth */}
                <div className="space-y-6">
                    {/* Growth Stats */}
                    <div className="no-break">
                        <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📊</span> Estadísticas de Crecimiento
                        </h3>
                        <div className="space-y-3">
                            {stats.currentHeight !== null && (
                                <StatCard
                                    label="Altura Actual"
                                    value={`${stats.currentHeight} cm`}
                                    icon="📏"
                                />
                            )}
                            {stats.growth !== null && stats.growth > 0 && (
                                <StatCard
                                    label="Crecimiento Total"
                                    value={`+${stats.growth} cm`}
                                    icon="📈"
                                    highlight
                                />
                            )}
                            {stats.lastEntry && stats.lastEntry.hojas && (
                                <StatCard
                                    label="Hojas Actuales"
                                    value={`${stats.lastEntry.hojas}`}
                                    icon="🍃"
                                />
                            )}
                        </div>
                    </div>

                    {/* Diary Activity */}
                    <div className="no-break">
                        <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span>📖</span> Actividad del Diario
                        </h3>
                        <div className="bg-[#F5F1EB] rounded-2xl p-4">
                            <div className="text-center mb-3">
                                <div className="text-3xl font-black text-[#4A5D4F]">
                                    {stats.totalEntries}
                                </div>
                                <div className="text-[9px] font-bold text-[#8E877F] uppercase tracking-wider">
                                    Registros Totales
                                </div>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(stats.typeCount).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-[#4A5D4F] flex items-center gap-1">
                                            {eventIcons[type]} {eventLabels[type]}
                                        </span>
                                        <span className="font-black text-[#2E2E2E]">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Commercial Info */}
                    {plant.en_venta && plant.precio_venta && (
                        <div className="no-break">
                            <div className="rounded-2xl p-4 text-white shadow-lg" style={{ background: 'linear-gradient(to bottom right, #FF7A59, #FF6B4A)' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">💰</span>
                                    <h3 className="text-xs font-black uppercase tracking-wider">
                                        Información de Venta
                                    </h3>
                                </div>
                                <div className="text-3xl font-black mb-1">
                                    ${plant.precio_venta}
                                </div>
                                <div className="text-xs font-bold opacity-90">
                                    Disponible para la venta
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* NOTES SECTION */}
            {plant.notas && (
                <div className="mb-6 no-break">
                    <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>📝</span> Notas de Cultivo
                    </h3>
                    <div className="bg-[#F5F1EB] rounded-2xl p-6 border-l-4 border-[#4A5D4F]">
                        <p className="text-sm font-medium text-[#4A5D4F] leading-relaxed">
                            {plant.notas}
                        </p>
                    </div>
                </div>
            )}

            {/* GROWTH TIMELINE */}
            {stats.heights.length > 1 && (
                <div className="mb-6 no-break">
                    <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>📈</span> Evolución de Altura
                    </h3>
                    <div className="bg-[#F5F1EB] rounded-2xl p-6">
                        <div className="flex items-end justify-between h-32 gap-2">
                            {stats.heights.slice(-8).map((record, index, arr) => {
                                const maxHeight = Math.max(...arr.map(r => r.altura));
                                const heightPercent = (record.altura / maxHeight) * 100;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="text-[10px] font-black text-[#4A5D4F]">
                                            {record.altura}cm
                                        </div>
                                        <div
                                            className="w-full rounded-t-lg"
                                            style={{
                                                height: `${heightPercent}%`,
                                                minHeight: '20%',
                                                background: 'linear-gradient(to top, #4A5D4F, #6B8E23)'
                                            }}
                                        />
                                        <div className="text-[8px] font-bold text-[#8E877F] text-center">
                                            {new Date(record.fecha).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'short'
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* RECENT DIARY ENTRIES */}
            {diaryEntries.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-black text-[#8E877F] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>📋</span> Últimos Registros del Diario
                    </h3>
                    <div className="space-y-2">
                        {diaryEntries
                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                            .slice(0, 5)
                            .map((entry, index) => (
                                <div
                                    key={index}
                                    className="bg-[#F5F1EB] rounded-xl p-3 flex items-start gap-3 no-break"
                                >
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm">{eventIcons[entry.tipo]}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-black text-[#4A5D4F]">
                                                {eventLabels[entry.tipo]}
                                            </span>
                                            <span className="text-[9px] font-bold text-[#8E877F]">
                                                {new Date(entry.fecha).toLocaleDateString('es-ES')}
                                            </span>
                                        </div>
                                        {entry.descripcion && (
                                            <p className="text-xs text-[#4A5D4F] leading-tight">
                                                {entry.descripcion}
                                            </p>
                                        )}
                                        {(entry.altura || entry.hojas) && (
                                            <div className="flex gap-2 mt-1">
                                                {entry.altura && (
                                                    <span className="text-[9px] font-bold text-[#8E877F]">
                                                        📏 {entry.altura}cm
                                                    </span>
                                                )}
                                                {entry.hojas && (
                                                    <span className="text-[9px] font-bold text-[#8E877F]">
                                                        🍃 {entry.hojas}h
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="border-t-2 border-[#F5F1EB] pt-4 mt-8">
                <div className="flex justify-between items-center">
                    <div className="text-[9px] font-bold text-[#8E877F]">
                        Generado el {new Date().toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })} a las {new Date().toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div className="text-[9px] font-black text-[#4A5D4F] uppercase tracking-widest">
                        CarniLab • Gestor Profesional de Plantas Carnívoras
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="bg-[#F5F1EB] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{icon}</span>
            <div className="text-[9px] font-black text-[#8E877F] uppercase tracking-wider">
                {label}
            </div>
        </div>
        <div className="text-sm font-black text-[#2E2E2E] truncate">
            {value}
        </div>
    </div>
);

const StatCard: React.FC<{ label: string; value: string; icon: string; highlight?: boolean }> = ({
    label,
    value,
    icon,
    highlight
}) => (
    <div
        className="rounded-xl p-3"
        style={highlight
            ? { backgroundColor: 'rgba(107, 142, 35, 0.1)', border: '2px solid #6B8E23' }
            : { backgroundColor: '#F5F1EB' }
        }
    >
        <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{icon}</span>
            <div className="text-[9px] font-black text-[#8E877F] uppercase tracking-wider">
                {label}
            </div>
        </div>
        <div
            className="text-xl font-black"
            style={{ color: highlight ? '#6B8E23' : '#2E2E2E' }}
        >
            {value}
        </div>
    </div>
);
