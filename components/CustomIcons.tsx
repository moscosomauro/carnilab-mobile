import React from "react";

// Helper for consistent sizing
const SvgBase = ({ children, size = 32, className = "" }: { children: React.ReactNode, size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {children}
    </svg>
);

// 1. Mi Vivero Online -> Greenhouse / Shop
export const IconViveroRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M3 21H21V10L12 3L3 10V21Z" fill="#FFB59E" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 21V13H16V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 6.5L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M17 6.5L7 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <rect x="5" y="15" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.1" />
        <rect x="15" y="15" width="4" height="6" rx="1" fill="currentColor" fillOpacity="0.1" />
    </SvgBase>
);

// 2. Mensajes -> Chat Bubbles stylized
export const IconMensajesRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M20.5 14.5C21.5 13.5 22 12 22 10.5C22 7.5 19.5 5 16.5 5H7.5C4.5 5 2 7.5 2 10.5C2 13.5 4.5 16 7.5 16H9L12 19L13.5 16H16.5" fill="#B8B889" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 7.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </SvgBase>
);

// 3. CarniBot -> Cute Robot with Sprout
export const IconBotRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <rect x="4" y="8" width="16" height="12" rx="4" fill="#98C8C7" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 13C8 13 9 14 12 14C15 14 16 13 16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="11" r="1.5" fill="currentColor" />
        <circle cx="15" cy="11" r="1.5" fill="currentColor" />
        <path d="M12 8V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 4L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </SvgBase>
);

// 4. Agregar Planta -> Plus with Organic Leaves
export const IconAddRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <circle cx="12" cy="12" r="10" fill="#F2CA78" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Leaves growing from center */}
        <path d="M12 12C12 12 14 10 16 10C16 10 15 13 12 12Z" fill="currentColor" fillOpacity="0.4" />
        <path d="M12 12C12 12 10 14 8 14C8 14 11 15 12 12Z" fill="currentColor" fillOpacity="0.4" />
    </SvgBase>
);

// 5. Ver Plantas -> Leaf Grid / Collection
export const IconPlantsRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="#B6CFAB" fillOpacity="0.15" />
        <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="#B6CFAB" fillOpacity="0.3" />
        <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="#B6CFAB" fillOpacity="0.3" />
        <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="#B6CFAB" fillOpacity="0.15" />
        <path d="M7 7L7 8M17 7L17 8M7 17L7 18M17 17L17 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </SvgBase>
);

// 6. Diario -> Open Book with Plant Illustration
export const IconDiaryRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M4 19.5V5C4 3.89543 4.89543 3 6 3H19C20.1046 3 21 3.89543 21 5V19.5C21 20.3284 20.3284 21 19.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z" stroke="currentColor" strokeWidth="1.5" fill="#E4D4B8" fillOpacity="0.2" />
        <path d="M12 3V21" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 11H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        {/* Plant drawing on right page */}
        <path d="M16 16V10M16 10L14 8M16 10L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </SvgBase>
);

// 7. Genética -> DNA / Crossing
export const IconGeneticaRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M7 4C7 4 9 8 13 12C17 16 17 20 17 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 4C17 4 15 8 11 12C7 16 7 20 7 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="10" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <circle cx="7" cy="4" r="1.5" fill="currentColor" />
        <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    </SvgBase>
);

// 8. Clima -> Thermometer + Sun/Cloud
export const IconClimateRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        {/* Thermometer */}
        <path d="M8 12V5C8 3.89543 8.89543 3 10 3C11.1046 3 12 3.89543 12 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" fill="#A9D0E3" fillOpacity="0.2" />
        <path d="M10 15V11" stroke="currentColor" strokeWidth="1.5" />
        {/* Sun Cloud */}
        <path d="M16.5 6.5C18.5 6.5 20 8 20 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="19" cy="5" r="1.5" fill="currentColor" opacity="0.6" />
    </SvgBase>
);

// 9. Alertas -> Active Bell
export const IconAlertsRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M12 3V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 12C5 8 8 3 12 3C16 3 19 8 19 12C19 14 20 16 20 17H4C4 16 5 14 5 12Z" stroke="currentColor" strokeWidth="1.5" fill="#F1D184" fillOpacity="0.2" strokeLinejoin="round" />
        <path d="M10 21H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17" cy="6" r="2.5" fill="#FF4D4D" stroke="white" strokeWidth="1.5" />
    </SvgBase>
);

// 10. Logout -> Door
export const IconLogoutRich = ({ size = 32 }: { size?: number }) => (
    <SvgBase size={size}>
        <path d="M10 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </SvgBase>
);
