import { Badge, BadgeRarity } from '../types';
// =============================================
// BADGE DEFINITIONS
// =============================================

export const BADGES: Badge[] = [
  // ===== COLLECTION BADGES =====
  {
    id: 'first_plant',
    name: 'Primera Planta',
    description: 'Registra tu primera planta carnívora',
    icon: '🌱',
    category: 'collection',
    rarity: 'common',
    requirement: { type: 'plants_total', count: 1 },
    xpBonus: 25
  },
  {
    id: 'collector_10',
    name: 'Coleccionista',
    description: 'Alcanza 10 plantas en tu colección',
    icon: '🌿',
    category: 'collection',
    rarity: 'common',
    requirement: { type: 'plants_total', count: 10 },
    xpBonus: 50
  },
  {
    id: 'collector_25',
    name: 'Gran Coleccionista',
    description: 'Alcanza 25 plantas en tu colección',
    icon: '🪴',
    category: 'collection',
    rarity: 'rare',
    requirement: { type: 'plants_total', count: 25 },
    xpBonus: 100
  },
  {
    id: 'collector_50',
    name: 'Vivero Personal',
    description: 'Alcanza 50 plantas en tu colección',
    icon: '🏡',
    category: 'collection',
    rarity: 'epic',
    requirement: { type: 'plants_total', count: 50 },
    xpBonus: 200
  },
  {
    id: 'collector_100',
    name: 'Jardín Legendario',
    description: 'Alcanza 100 plantas en tu colección',
    icon: '🏆',
    category: 'collection',
    rarity: 'legendary',
    requirement: { type: 'plants_total', count: 100 },
    xpBonus: 500
  },

  // ===== BREEDING BADGES =====
  {
    id: 'first_cross',
    name: 'Primer Cruce',
    description: 'Realiza tu primer cruce de plantas',
    icon: '🧬',
    category: 'breeding',
    rarity: 'common',
    requirement: { type: 'crosses_total', count: 1 },
    xpBonus: 30
  },
  {
    id: 'breeder_5',
    name: 'Hibridador',
    description: 'Completa 5 cruces exitosos',
    icon: '🔬',
    category: 'breeding',
    rarity: 'rare',
    requirement: { type: 'crosses_completed', count: 5 },
    xpBonus: 100
  },
  {
    id: 'breeder_15',
    name: 'Genetista',
    description: 'Completa 15 cruces exitosos',
    icon: '🧪',
    category: 'breeding',
    rarity: 'epic',
    requirement: { type: 'crosses_completed', count: 15 },
    xpBonus: 250
  },
  {
    id: 'breeder_master',
    name: 'Maestro Genetista',
    description: 'Completa 30 cruces exitosos',
    icon: '👨‍🔬',
    category: 'breeding',
    rarity: 'legendary',
    requirement: { type: 'crosses_completed', count: 30 },
    xpBonus: 500
  },
  {
    id: 'germinator',
    name: 'Germinador',
    description: 'Germina 50 plantas de tus cruces',
    icon: '🌾',
    category: 'breeding',
    rarity: 'epic',
    requirement: { type: 'plants_germinated', count: 50 },
    xpBonus: 200
  },

  // ===== DEDICATION BADGES =====
  {
    id: 'streak_7',
    name: 'Constante',
    description: 'Mantén una racha de 7 días consecutivos',
    icon: '🔥',
    category: 'dedication',
    rarity: 'common',
    requirement: { type: 'streak_days', count: 7 },
    xpBonus: 50
  },
  {
    id: 'streak_14',
    name: 'Dedicado',
    description: 'Mantén una racha de 14 días consecutivos',
    icon: '💪',
    category: 'dedication',
    rarity: 'rare',
    requirement: { type: 'streak_days', count: 14 },
    xpBonus: 100
  },
  {
    id: 'streak_30',
    name: 'Imparable',
    description: 'Mantén una racha de 30 días consecutivos',
    icon: '⚡',
    category: 'dedication',
    rarity: 'epic',
    requirement: { type: 'streak_days', count: 30 },
    xpBonus: 250
  },
  {
    id: 'streak_100',
    name: 'Leyenda Viva',
    description: 'Mantén una racha de 100 días consecutivos',
    icon: '👑',
    category: 'dedication',
    rarity: 'legendary',
    requirement: { type: 'streak_days', count: 100 },
    xpBonus: 1000
  },
  {
    id: 'diary_master',
    name: 'Cronista',
    description: 'Escribe 50 entradas en tu diario',
    icon: '📔',
    category: 'dedication',
    rarity: 'rare',
    requirement: { type: 'diary_entries', count: 50 },
    xpBonus: 100
  },
  {
    id: 'photographer',
    name: 'Fotógrafo',
    description: 'Toma 100 fotos de tus plantas',
    icon: '📸',
    category: 'dedication',
    rarity: 'rare',
    requirement: { type: 'photos_total', count: 100 },
    xpBonus: 100
  },

  // ===== MASTERY BADGES =====
  {
    id: 'level_5',
    name: 'Cultivador Jr.',
    description: 'Alcanza el nivel 5',
    icon: '⭐',
    category: 'mastery',
    rarity: 'common',
    requirement: { type: 'level', count: 5 },
    xpBonus: 50
  },
  {
    id: 'level_10',
    name: 'Experto',
    description: 'Alcanza el nivel 10',
    icon: '🌟',
    category: 'mastery',
    rarity: 'rare',
    requirement: { type: 'level', count: 10 },
    xpBonus: 150
  },
  {
    id: 'level_15',
    name: 'Maestro Carnívoro',
    description: 'Alcanza el nivel máximo 15',
    icon: '💎',
    category: 'mastery',
    rarity: 'legendary',
    requirement: { type: 'level', count: 15 },
    xpBonus: 500
  },
  {
    id: 'xp_1000',
    name: 'Mil Puntos',
    description: 'Acumula 1,000 XP en total',
    icon: '🎯',
    category: 'mastery',
    rarity: 'common',
    requirement: { type: 'total_xp', count: 1000 },
    xpBonus: 50
  },
  {
    id: 'xp_5000',
    name: 'Cinco Mil',
    description: 'Acumula 5,000 XP en total',
    icon: '🎖️',
    category: 'mastery',
    rarity: 'rare',
    requirement: { type: 'total_xp', count: 5000 },
    xpBonus: 150
  },
  {
    id: 'xp_15000',
    name: 'Élite',
    description: 'Acumula 15,000 XP en total',
    icon: '🏅',
    category: 'mastery',
    rarity: 'epic',
    requirement: { type: 'total_xp', count: 15000 },
    xpBonus: 300
  },

  // ===== SPECIAL BADGES =====
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Te uniste en los primeros días de CarniLab',
    icon: '🚀',
    category: 'special',
    rarity: 'legendary',
    requirement: { type: 'special', count: 1 },
    xpBonus: 200
  },
  {
    id: 'all_objectives',
    name: 'Día Perfecto',
    description: 'Completa todos los objetivos diarios',
    icon: '✨',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'daily_all_complete', count: 1 },
    xpBonus: 75
  },
  {
    id: 'perfect_week',
    name: 'Semana Perfecta',
    description: 'Completa todos los objetivos durante 7 días seguidos',
    icon: '🌈',
    category: 'special',
    rarity: 'epic',
    requirement: { type: 'perfect_days_streak', count: 7 },
    xpBonus: 300
  },
  {
    id: 'seed_banker',
    name: 'Banquero de Semillas',
    description: 'Almacena 20 lotes en tu banco de semillas',
    icon: '🏦',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'seed_batches', count: 20 },
    xpBonus: 100
  },
  {
    id: 'stratification_master',
    name: 'Maestro del Frío',
    description: 'Completa 10 estratificaciones exitosas',
    icon: '❄️',
    category: 'special',
    rarity: 'epic',
    requirement: { type: 'stratifications_complete', count: 10 },
    xpBonus: 200
  }
];

// =============================================
// RARITY COLORS
// =============================================

export const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: 'bg-gray-100 dark:bg-slate-700',
    border: 'border-gray-300 dark:border-slate-600',
    text: 'text-gray-600 dark:text-slate-300',
    glow: ''
  },
  rare: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-200 dark:shadow-blue-900'
  },
  epic: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-400 dark:border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-200 dark:shadow-purple-900'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-200 dark:shadow-amber-900 shadow-lg'
  }
};

export const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario'
};

// =============================================
// BADGE HELPERS
// =============================================

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGES.filter(b => b.category === category);
}

export function calculateBadgeProgress(
  badge: Badge,
  stats: {
    plantsTotal: number;
    crossesTotal: number;
    crossesCompleted: number;
    plantsGerminated: number;
    streakDays: number;
    diaryEntries: number;
    photosTotal: number;
    level: number;
    totalXp: number;
    seedBatches: number;
    stratificationsComplete: number;
    perfectDaysStreak: number;
  }
): number {
  const { type, count } = badge.requirement;
  let current = 0;

  switch (type) {
    case 'plants_total':
      current = stats.plantsTotal;
      break;
    case 'crosses_total':
      current = stats.crossesTotal;
      break;
    case 'crosses_completed':
      current = stats.crossesCompleted;
      break;
    case 'plants_germinated':
      current = stats.plantsGerminated;
      break;
    case 'streak_days':
      current = stats.streakDays;
      break;
    case 'diary_entries':
      current = stats.diaryEntries;
      break;
    case 'photos_total':
      current = stats.photosTotal;
      break;
    case 'level':
      current = stats.level;
      break;
    case 'total_xp':
      current = stats.totalXp;
      break;
    case 'seed_batches':
      current = stats.seedBatches;
      break;
    case 'stratifications_complete':
      current = stats.stratificationsComplete;
      break;
    case 'perfect_days_streak':
      current = stats.perfectDaysStreak;
      break;
    case 'daily_all_complete':
    case 'special':
      // These are handled separately
      return 0;
    default:
      return 0;
  }

  return Math.min(100, Math.round((current / count) * 100));
}

export function checkBadgeUnlock(
  badge: Badge,
  stats: {
    plantsTotal: number;
    crossesTotal: number;
    crossesCompleted: number;
    plantsGerminated: number;
    streakDays: number;
    diaryEntries: number;
    photosTotal: number;
    level: number;
    totalXp: number;
    seedBatches: number;
    stratificationsComplete: number;
    perfectDaysStreak: number;
  }
): boolean {
  const progress = calculateBadgeProgress(badge, stats);
  return progress >= 100;
}

// Event emitter for badge unlocks
type BadgeEventCallback = (badge: Badge) => void;

class BadgeEventEmitter {
  private listeners: BadgeEventCallback[] = [];

  subscribe(callback: BadgeEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(badge: Badge): void {
    this.listeners.forEach(cb => cb(badge));
  }
}

export const badgeEvents = new BadgeEventEmitter();
