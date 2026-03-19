
import React from 'react';
import { ClimateLog } from '../types';

interface ClimateChartProps {
  logs: ClimateLog[];
}

export const ClimateChart: React.FC<ClimateChartProps> = ({ logs }) => {
  // Ordenar logs cronológicamente y tomar los últimos 7
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

  if (sortedLogs.length < 2) {
    return (
      <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-[#4A5D4F]/20 rounded-[30px] bg-white/40">
        <span className="text-4xl mb-2 opacity-50">📉</span>
        <p className="text-[#4A5D4F]/60 text-sm font-medium">Necesitas más datos (min 2 días)</p>
      </div>
    );
  }

  const width = 320;
  const height = 180;
  const padding = 25;

  // Escalas dinámicas
  const maxTemp = Math.max(...sortedLogs.map(l => l.temp_max)) + 2;
  const minTemp = Math.min(...sortedLogs.map(l => l.temp_min)) - 2;
  const range = maxTemp - minTemp || 10;

  const getX = (index: number) => (index / (sortedLogs.length - 1)) * (width - 2 * padding) + padding;
  const getY = (val: number) => height - padding - ((val - minTemp) / range) * (height - 2 * padding);

  // Generar path suave (Curva Bezier simplificada)
  const generateSmoothPath = (data: number[]) => {
    return data.map((val, i) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(data[i - 1]);
      const cp1x = prevX + (x - prevX) * 0.5;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) * 0.5;
      const cp2y = y;
      return `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`;
    }).join(' ');
  };

  const pathMax = generateSmoothPath(sortedLogs.map(l => l.temp_max));
  const pathMin = generateSmoothPath(sortedLogs.map(l => l.temp_min));
  const pathHum = generateSmoothPath(sortedLogs.map(l => l.humidity / 2)); // Escala ajustada para humedad visual

  return (
    <div className="w-full bg-white rounded-[35px] p-6 shadow-[0_10px_30px_rgba(74,93,79,0.08)] border border-[#4A5D4F]/5">

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm"></span>
          <span className="text-xs font-bold text-[#4A5D4F]/70">Máx</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#3B82F6] shadow-sm"></span>
          <span className="text-xs font-bold text-[#4A5D4F]/70">Mín</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#06B6D4] shadow-sm"></span>
          <span className="text-xs font-bold text-[#4A5D4F]/70">Humedad</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Grilla horizontal suave */}
        {[0, 0.5, 1].map((t, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (height - 2 * padding) * t}
            x2={width - padding}
            y2={padding + (height - 2 * padding) * t}
            stroke="#E5E7EB"
            strokeDasharray="4 4"
          />
        ))}

        {/* Línea Humedad (Cyan - Fondo) */}
        <path d={pathHum} fill="none" stroke="#06B6D4" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="5 5" />

        {/* Línea Mínima (Azul) */}
        <path d={pathMin} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />

        {/* Línea Máxima (Roja) */}
        <path d={pathMax} fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />

        {/* Puntos Interactivos (Visuales) */}
        {sortedLogs.map((log, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(log.temp_max)} r="4" fill="white" stroke="#EF4444" strokeWidth="2.5" />
            <circle cx={getX(i)} cy={getY(log.temp_min)} r="4" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
          </g>
        ))}

        {/* Etiquetas Eje X (Días) */}
        {sortedLogs.map((log, i) => (
          <text key={`date-${i}`} x={getX(i)} y={height + 15} fill="#9CA3AF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            {new Date(log.date).getDate()}
          </text>
        ))}
      </svg>
    </div>
  );
};
