/**
 * Tarjeta de Bitácora por Planta con Accordion Desplegable
 * Componente principal que agrupa estadísticas, galería y timeline
 */

import React, { useState } from 'react';
import { DiaryEntry } from '../../types';
import { PlantJournalGroup, formatDaysAgo } from '../../utils/diaryHelpers';
import PlantStatsPanel from './PlantStatsPanel';
import PhotoGallery from './PhotoGallery';
import TimelineAscending from './TimelineAscending';
import { SpeciesIcon } from '../SpeciesIcon';

interface PlantJournalCardProps {
  journal: PlantJournalGroup;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: number) => void;
  defaultExpanded?: boolean;
}

const PlantJournalCard: React.FC<PlantJournalCardProps> = ({
  journal,
  onEdit,
  onDelete,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { plantName, entries, stats } = journal;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="mb-4 bg-white dark:bg-slate-800 rounded-[24px] shadow-md border border-white dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Header Colapsable */}
      <button
        onClick={toggleExpand}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#FAFAFA] dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Icono de Planta */}
          <div className="w-14 h-14 rounded-xl bg-[#EFEBE4] dark:bg-slate-900 border border-[#8E877F]/10 dark:border-slate-700 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
            <SpeciesIcon species={stats.plantSpecies} size={48} />
          </div>

          {/* Info Principal */}
          <div className="text-left flex-1">
            <h2 className="text-[18px] font-black text-[#2E2E2E] dark:text-white leading-tight mb-0.5">
              {plantName}
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-[#8E877F] dark:text-slate-400 font-medium">
              <span className="font-bold">{stats.totalEntries} entradas</span>
              <span>•</span>
              <span>Última: {formatDaysAgo(stats.daysAgo)}</span>
              <span>•</span>
              <span className="font-bold text-[#4A5D4F] dark:text-slate-300">{stats.daysSinceSeed} días</span>
            </div>
          </div>

          {/* Badge de Fase */}
          <div className="hidden sm:flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-[#8E877F] dark:text-slate-400 uppercase tracking-wider">
              Fase
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#F5F3FF] dark:bg-slate-900 text-[#8B5CF6] dark:text-[#A78BFA]">
              {stats.growthPhase}
            </span>
          </div>
        </div>

        {/* Icono Expandir/Colapsar */}
        <div
          className={`ml-4 w-8 h-8 rounded-full bg-[#EFEBE4] dark:bg-slate-900 flex items-center justify-center text-[#4A5D4F] dark:text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
            }`}
        >
          ▼
        </div>
      </button>

      {/* Contenido Desplegable */}
      <div
        className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-6 pb-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Panel de Estadísticas */}
          <PlantStatsPanel stats={stats} />

          {/* Galería de Fotos */}
          {stats.photos.length > 0 && (
            <PhotoGallery photos={stats.photos} plantName={plantName} />
          )}

          {/* Timeline Ascendente */}
          <TimelineAscending
            entries={entries}
            firstEntryDate={stats.firstEntryDate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default PlantJournalCard;
