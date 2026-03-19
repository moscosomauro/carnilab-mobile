/**
 * Panel de Estadísticas de Planta para Bitácora
 * Muestra resumen visual de progreso y métricas clave
 */

import React from 'react';
import { PlantJournalStats, formatDaysAgo, getPhaseColor, getPhaseEmoji } from '../../utils/diaryHelpers';

interface PlantStatsPanelProps {
  stats: PlantJournalStats;
}

const PlantStatsPanel: React.FC<PlantStatsPanelProps> = ({ stats }) => {
  const phaseColor = getPhaseColor(stats.growthPhase);
  const phaseEmoji = getPhaseEmoji(stats.growthPhase);

  return (
    <div className="bg-gradient-to-br from-white dark:from-slate-800 to-[#F5F3FF] dark:to-slate-900 rounded-2xl p-5 mb-4 shadow-sm border border-white/50 dark:border-slate-700/50">
      {/* Header con Fase */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-md"
            style={{ backgroundColor: phaseColor }}
          >
            {phaseEmoji}
          </div>
          <div>
            <h3 className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider">Fase Actual</h3>
            <p className="text-[14px] font-black text-[#2E2E2E] dark:text-white">{stats.growthPhase}</p>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider">Días de Vida</h3>
          <p className="text-[24px] font-black text-[#4A5D4F] dark:text-[#6B8E23]">{stats.daysSinceSeed}</p>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Altura */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[#E5E5E5] dark:border-slate-700">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[16px]">📏</span>
            <span className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase">Altura</span>
          </div>
          {stats.heightGrowth.initial != null && stats.heightGrowth.current != null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] font-black text-[#4A5D4F] dark:text-white">{stats.heightGrowth.current}cm</span>
                {stats.heightGrowth.change != null && stats.heightGrowth.change > 0 && (
                  <span className="text-[10px] font-bold text-green-500">+{stats.heightGrowth.change}cm</span>
                )}
              </div>
              <div className="text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">Inicio: {stats.heightGrowth.initial}cm</div>
            </>
          ) : (
            <span className="text-[12px] text-[#8E877F] dark:text-slate-400 italic">Sin datos</span>
          )}
        </div>

        {/* Hojas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[#E5E5E5] dark:border-slate-700">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[16px]">🍃</span>
            <span className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase">Hojas</span>
          </div>
          {stats.leavesGrowth.initial != null && stats.leavesGrowth.current != null ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] font-black text-[#4A5D4F] dark:text-white">{stats.leavesGrowth.current}</span>
                {stats.leavesGrowth.change != null && stats.leavesGrowth.change > 0 && (
                  <span className="text-[10px] font-bold text-green-500">+{stats.leavesGrowth.change}</span>
                )}
              </div>
              <div className="text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">Inicio: {stats.leavesGrowth.initial}</div>
            </>
          ) : (
            <span className="text-[12px] text-[#8E877F] dark:text-slate-400 italic">Sin datos</span>
          )}
        </div>
      </div>

      {/* Actividades */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-[#E5E5E5] dark:border-slate-700">
        <h4 className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider mb-2">Registro de Actividades</h4>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-[16px] mb-1">💧</div>
            <div className="text-[14px] font-black text-[#4A5D4F] dark:text-slate-300">{stats.entriesByType.riego}</div>
            <div className="text-[8px] text-[#8E877F] dark:text-slate-400 font-bold">Riegos</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] mb-1">🌱</div>
            <div className="text-[14px] font-black text-[#4A5D4F] dark:text-slate-300">{stats.entriesByType.fertilizacion}</div>
            <div className="text-[8px] text-[#8E877F] dark:text-slate-400 font-bold">Fertiliz.</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] mb-1">✂️</div>
            <div className="text-[14px] font-black text-[#4A5D4F] dark:text-slate-300">{stats.entriesByType.poda}</div>
            <div className="text-[8px] text-[#8E877F] dark:text-slate-400 font-bold">Podas</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] mb-1">👁️</div>
            <div className="text-[14px] font-black text-[#4A5D4F] dark:text-slate-300">{stats.entriesByType.observacion}</div>
            <div className="text-[8px] text-[#8E877F] dark:text-slate-400 font-bold">Obs.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[#E5E5E5] dark:border-slate-700 flex justify-between items-center">
        <div className="text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">
          <span className="font-black">Primera entrada:</span> {new Date(stats.firstEntryDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </div>
        <div className="text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">
          <span className="font-black">Última:</span> {formatDaysAgo(stats.daysAgo)}
        </div>
      </div>
    </div>
  );
};

export default PlantStatsPanel;
