
import React, { useState } from 'react';

interface IconProps {
  className?: string;
}

export const CarniBotIcon: React.FC<IconProps> = ({ className = "" }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    // Fallback SVG: Una planta carnívora estilizada si la imagen falla
    return (
      <svg 
        viewBox="0 0 24 24" 
        className={className}
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tallo */}
        <path d="M12 21v-8" className="text-green-500" stroke="currentColor" />
        <path d="M12 21c-4 0-7-3-7-6" className="text-green-600" stroke="currentColor" opacity="0.5"/>
        <path d="M12 21c4 0 7-3 7-6" className="text-green-600" stroke="currentColor" opacity="0.5"/>
        
        {/* Cabeza de la planta (Trampa) */}
        <path d="M12 13c-3 0-5-4-5-7s2-5 5-5 5 2 5 5-2 7-5 7z" className="text-purple-500" stroke="currentColor" fill="currentColor" fillOpacity="0.2" />
        
        {/* Dientes */}
        <path d="M7 6l1-2" />
        <path d="M17 6l-1-2" />
        <path d="M8 9l1-1" />
        <path d="M16 9l-1-1" />
        <path d="M12 1v2" />
        
        {/* Ojo Robótico */}
        <circle cx="12" cy="7" r="1.5" className="text-cyan-400" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <img 
      src={`/carnibot.png?v=${new Date().getDate()}`} 
      alt="Carni Bot" 
      className={`object-contain ${className}`}
      onError={() => setImgError(true)}
    />
  );
};
