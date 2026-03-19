/**
 * Utilidades para el Diario de Cultivo
 * Cálculo de métricas, fases de crecimiento y agrupación por planta
 */

import { DiaryEntry } from '../types';

export interface PlantJournalStats {
  plantName: string;
  plantSpecies: string;
  totalEntries: number;
  daysSinceSeed: number;
  firstEntryDate: string;
  lastEntryDate: string;
  daysAgo: number;
  growthPhase: 'Germinación' | 'Plántula' | 'Vegetativa' | 'Pre-floración' | 'Floración' | 'Maduración';
  heightGrowth: {
    initial: number | null;
    current: number | null;
    change: number | null;
  };
  leavesGrowth: {
    initial: number | null;
    current: number | null;
    change: number | null;
  };
  entriesByType: {
    riego: number;
    fertilizacion: number;
    poda: number;
    observacion: number;
  };
  photos: string[];
}

export interface PlantJournalGroup {
  plantName: string;
  entries: DiaryEntry[];
  stats: PlantJournalStats;
}

/**
 * Calcula cuántos días han pasado desde una fecha
 */
export const calculateDaysAgo = (dateStr: string): number => {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Formatea "hace X días" de manera legible
 */
export const formatDaysAgo = (days: number): string => {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
};

/**
 * Determina la fase de crecimiento basada en días y tipo de entradas
 */
export const calculateGrowthPhase = (
  daysSinceSeed: number,
  entries: DiaryEntry[]
): PlantJournalStats['growthPhase'] => {
  // Detectar si hay keywords en descripciones que indiquen fase
  const descriptions = entries.map(e => e.descripcion.toLowerCase()).join(' ');

  if (descriptions.includes('flor') || descriptions.includes('floración') || descriptions.includes('pistilos')) {
    return 'Floración';
  }
  if (descriptions.includes('pre-flor') || descriptions.includes('preflora')) {
    return 'Pre-floración';
  }
  if (descriptions.includes('cosecha') || descriptions.includes('maduración')) {
    return 'Maduración';
  }

  // Por días (aproximado para cannabis/plantas comunes)
  if (daysSinceSeed < 7) return 'Germinación';
  if (daysSinceSeed < 21) return 'Plántula';
  if (daysSinceSeed < 60) return 'Vegetativa';
  if (daysSinceSeed < 90) return 'Pre-floración';
  if (daysSinceSeed < 150) return 'Floración';
  return 'Maduración';
};

/**
 * Calcula estadísticas completas para una planta
 */
export const calculatePlantStats = (
  plantName: string,
  entries: DiaryEntry[]
): PlantJournalStats => {
  if (entries.length === 0) {
    return {
      plantName,
      plantSpecies: 'N/A',
      totalEntries: 0,
      daysSinceSeed: 0,
      firstEntryDate: '',
      lastEntryDate: '',
      daysAgo: 0,
      growthPhase: 'Germinación',
      heightGrowth: { initial: null, current: null, change: null },
      leavesGrowth: { initial: null, current: null, change: null },
      entriesByType: { riego: 0, fertilizacion: 0, poda: 0, observacion: 0 },
      photos: [],
    };
  }

  // Ordenar por fecha ascendente (más viejo primero)
  const sorted = [...entries].sort((a, b) =>
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const firstEntry = sorted[0];
  const lastEntry = sorted[sorted.length - 1];

  const daysSinceSeed = calculateDaysAgo(firstEntry.fecha);
  const daysAgo = calculateDaysAgo(lastEntry.fecha);

  // Crecimiento en altura
  const heightEntries = sorted.filter(e => e.altura != null);
  const heightGrowth = {
    initial: heightEntries.length > 0 ? heightEntries[0].altura! : null,
    current: heightEntries.length > 0 ? heightEntries[heightEntries.length - 1].altura! : null,
    change: null as number | null,
  };
  if (heightGrowth.initial != null && heightGrowth.current != null) {
    heightGrowth.change = heightGrowth.current - heightGrowth.initial;
  }

  // Crecimiento en hojas
  const leavesEntries = sorted.filter(e => e.hojas != null);
  const leavesGrowth = {
    initial: leavesEntries.length > 0 ? leavesEntries[0].hojas! : null,
    current: leavesEntries.length > 0 ? leavesEntries[leavesEntries.length - 1].hojas! : null,
    change: null as number | null,
  };
  if (leavesGrowth.initial != null && leavesGrowth.current != null) {
    leavesGrowth.change = leavesGrowth.current - leavesGrowth.initial;
  }

  // Contar por tipo
  const entriesByType = {
    riego: entries.filter(e => e.tipo === 'riego').length,
    fertilizacion: entries.filter(e => e.tipo === 'fertilizacion').length,
    poda: entries.filter(e => e.tipo === 'poda').length,
    observacion: entries.filter(e => e.tipo === 'observacion').length,
  };

  // Recoger fotos
  const photos = entries
    .filter(e => e.imagen)
    .map(e => e.imagen!)
    .filter(Boolean);

  const growthPhase = calculateGrowthPhase(daysSinceSeed, entries);

  return {
    plantName,
    plantSpecies: firstEntry.planta_especie,
    totalEntries: entries.length,
    daysSinceSeed,
    firstEntryDate: firstEntry.fecha,
    lastEntryDate: lastEntry.fecha,
    daysAgo,
    growthPhase,
    heightGrowth,
    leavesGrowth,
    entriesByType,
    photos,
  };
};

/**
 * Agrupa entradas del diario por planta y calcula estadísticas
 */
export const groupEntriesByPlant = (entries: DiaryEntry[]): PlantJournalGroup[] => {
  const grouped = new Map<string, DiaryEntry[]>();

  entries.forEach(entry => {
    const existing = grouped.get(entry.planta_nombre) || [];
    grouped.set(entry.planta_nombre, [...existing, entry]);
  });

  const result: PlantJournalGroup[] = [];

  grouped.forEach((plantEntries, plantName) => {
    result.push({
      plantName,
      entries: plantEntries,
      stats: calculatePlantStats(plantName, plantEntries),
    });
  });

  // Ordenar por última actividad (más reciente primero)
  return result.sort((a, b) => a.stats.daysAgo - b.stats.daysAgo);
};

/**
 * Calcula el "día relativo" desde la primera entrada
 */
export const calculateRelativeDay = (entryDate: string, firstEntryDate: string): number => {
  const entry = new Date(entryDate);
  const first = new Date(firstEntryDate);
  const diffTime = entry.getTime() - first.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Día 1 es el primer día
};

/**
 * Obtiene el color de fase de crecimiento
 */
export const getPhaseColor = (phase: PlantJournalStats['growthPhase']): string => {
  const colors: Record<PlantJournalStats['growthPhase'], string> = {
    'Germinación': '#8B4513',
    'Plántula': '#22C55E',
    'Vegetativa': '#10B981',
    'Pre-floración': '#F59E0B',
    'Floración': '#EC4899',
    'Maduración': '#8B5CF6',
  };
  return colors[phase];
};

/**
 * Obtiene el emoji de fase de crecimiento
 */
export const getPhaseEmoji = (phase: PlantJournalStats['growthPhase']): string => {
  const emojis: Record<PlantJournalStats['growthPhase'], string> = {
    'Germinación': '🌱',
    'Plántula': '🌿',
    'Vegetativa': '🍃',
    'Pre-floración': '🌸',
    'Floración': '🌺',
    'Maduración': '🍇',
  };
  return emojis[phase];
};
