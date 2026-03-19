
import { PlanType } from '../types';

const PLAN_LEVELS: Record<PlanType, number> = {
  basic: 0,
  pro: 1,
  elite: 2
};

export const hasAccess = (currentPlan: PlanType | undefined, requiredPlan: PlanType): boolean => {
  if (!currentPlan) return false;
  return PLAN_LEVELS[currentPlan] >= PLAN_LEVELS[requiredPlan];
};

export const getPlanLabel = (plan: PlanType) => {
  switch (plan) {
    case 'elite': return 'Elite';
    case 'pro': return 'Pro';
    default: return 'Básico';
  }
};
