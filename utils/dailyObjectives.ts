import { DailyObjective, ObjectiveType, PlanType } from '../types';

// =============================================
// OBJECTIVE TEMPLATES
// =============================================

interface ObjectiveTemplate {
  type: ObjectiveType;
  title: string;
  description: string;
  xpReward: number;
  requiredPlan: PlanType;
  icon: string;
  weight: number; // Higher = more likely to appear
}

export const OBJECTIVE_TEMPLATES: ObjectiveTemplate[] = [
  // Basic Plan Objectives
  {
    type: 'add_plant',
    title: 'Agregar Planta',
    description: 'Registra una nueva planta en tu colección',
    xpReward: 50,
    requiredPlan: 'basic',
    icon: '🌱',
    weight: 3
  },
  {
    type: 'diary_entry',
    title: 'Escribir en Diario',
    description: 'Registra un riego, fertilización u observación',
    xpReward: 30,
    requiredPlan: 'basic',
    icon: '📔',
    weight: 5
  },
  {
    type: 'diary_photo',
    title: 'Capturar Foto',
    description: 'Toma una foto para el diario de plantas',
    xpReward: 40,
    requiredPlan: 'basic',
    icon: '📸',
    weight: 4
  },
  {
    type: 'complete_alert',
    title: 'Completar Alerta',
    description: 'Marca una alerta pendiente como completada',
    xpReward: 25,
    requiredPlan: 'basic',
    icon: '✅',
    weight: 4
  },
  {
    type: 'create_cross',
    title: 'Iniciar Cruza',
    description: 'Comienza un nuevo proyecto de hibridación',
    xpReward: 75,
    requiredPlan: 'basic',
    icon: '🧬',
    weight: 2
  },
  {
    type: 'complete_cross',
    title: 'Completar Cruza',
    description: 'Marca una cruza como completada exitosamente',
    xpReward: 100,
    requiredPlan: 'basic',
    icon: '🏆',
    weight: 1
  },
  {
    type: 'start_stratification',
    title: 'Iniciar Estratificación',
    description: 'Comienza el tratamiento frío para semillas',
    xpReward: 60,
    requiredPlan: 'basic',
    icon: '❄️',
    weight: 2
  },
  // Pro Plan Objectives
  {
    type: 'climate_log',
    title: 'Registrar Clima',
    description: 'Anota la temperatura y humedad del día',
    xpReward: 35,
    requiredPlan: 'pro',
    icon: '🌡️',
    weight: 3
  },
  // Elite Plan Objectives
  {
    type: 'ai_analysis',
    title: 'Análisis IA',
    description: 'Analiza genética con CarniBot AI',
    xpReward: 80,
    requiredPlan: 'elite',
    icon: '🤖',
    weight: 2
  }
];

// =============================================
// XP LEVEL SYSTEM
// =============================================

export const XP_LEVELS = [
  0,      // Level 1 - Seedling
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5 - Sprout
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3800,   // Level 9
  5200,   // Level 10 - Grower
  7000,   // Level 11
  9500,   // Level 12
  13000,  // Level 13
  17500,  // Level 14
  23000,  // Level 15 - Master Grower
];

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Semilla',
  2: 'Brote',
  3: 'Plántula',
  4: 'Creciendo',
  5: 'Cultivador Jr.',
  6: 'Cultivador',
  7: 'Cultivador Exp.',
  8: 'Hibridador',
  9: 'Hibridador Exp.',
  10: 'Experto',
  11: 'Maestro',
  12: 'Maestro Sr.',
  13: 'Leyenda',
  14: 'Leyenda Sr.',
  15: 'Maestro Carnívoro'
};

export function calculateLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  title: string;
} {
  let level = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (totalXp >= XP_LEVELS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelStart = XP_LEVELS[level - 1] || 0;
  const nextLevelStart = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1] + 5000;

  return {
    level,
    currentLevelXp: totalXp - currentLevelStart,
    xpToNextLevel: nextLevelStart - currentLevelStart,
    title: LEVEL_TITLES[level] || 'Maestro'
  };
}

// =============================================
// PLAN ACCESS HELPER
// =============================================

const PLAN_HIERARCHY: Record<PlanType, number> = {
  basic: 1,
  pro: 2,
  elite: 3
};

export function hasAccess(userPlan: PlanType, requiredPlan: PlanType): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

// =============================================
// OBJECTIVE GENERATION
// =============================================

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateDailyObjectives(
  userPlan: PlanType,
  previousObjectiveTypes: ObjectiveType[] = []
): DailyObjective[] {
  const today = getDateString();

  // Filter templates by plan access
  const accessibleTemplates = OBJECTIVE_TEMPLATES.filter(t =>
    hasAccess(userPlan, t.requiredPlan)
  );

  // Weighted random selection (reduce weight for yesterday's objectives)
  const weightedPool: ObjectiveTemplate[] = [];

  accessibleTemplates.forEach(template => {
    const adjustedWeight = previousObjectiveTypes.includes(template.type)
      ? Math.max(1, template.weight - 2)
      : template.weight;

    for (let i = 0; i < adjustedWeight; i++) {
      weightedPool.push(template);
    }
  });

  // Select 3-5 objectives based on plan
  const objectiveCount = userPlan === 'elite' ? 5 : userPlan === 'pro' ? 4 : 3;
  const selected: DailyObjective[] = [];
  const usedTypes = new Set<ObjectiveType>();
  const poolCopy = [...weightedPool];

  while (selected.length < objectiveCount && poolCopy.length > 0) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    const template = poolCopy[randomIndex];

    if (!usedTypes.has(template.type)) {
      usedTypes.add(template.type);
      selected.push({
        id: `${template.type}_${today}`,
        type: template.type,
        title: template.title,
        description: template.description,
        xpReward: template.xpReward,
        requiredPlan: template.requiredPlan,
        isCompleted: false,
        icon: template.icon
      });
    }

    // Remove this element from pool
    poolCopy.splice(randomIndex, 1);
  }

  return selected;
}

// =============================================
// EVENT SYSTEM FOR OBJECTIVE COMPLETION
// =============================================

type ObjectiveEventCallback = (type: ObjectiveType) => void;

class ObjectiveEventEmitter {
  private listeners: ObjectiveEventCallback[] = [];

  subscribe(callback: ObjectiveEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(objectiveType: ObjectiveType): void {
    this.listeners.forEach(cb => cb(objectiveType));
  }
}

export const objectiveEvents = new ObjectiveEventEmitter();
