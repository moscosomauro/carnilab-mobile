/**
 * Custom Hooks Utilities para CarniLab
 * Hooks reutilizables para mejorar performance y UX
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * Útil para búsquedas en tiempo real sin hacer queries en cada keystroke
 *
 * @param value - Valor a hacer debounce
 * @param delay - Delay en milisegundos (default: 300ms)
 * @returns Valor con debounce aplicado
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 500);
 *
 * useEffect(() => {
 *   // Esta query solo se ejecuta después de 500ms sin cambios
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebouncedValue = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para paginación con cursor
 * Implementa cursor-based pagination para mejor performance
 *
 * @param fetchFunction - Función que hace fetch de datos paginados
 * @param pageSize - Cantidad de items por página (default: 20)
 * @returns Estado y funciones de paginación
 *
 * @example
 * const {
 *   data,
 *   loading,
 *   hasMore,
 *   loadMore
 * } = usePagination(fetchPlants, 20);
 */
export interface PaginationState<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export const usePagination = <T extends { id: number }>(
  fetchFunction: (cursor: number | null, limit: number) => Promise<T[]>,
  pageSize: number = 20
): PaginationState<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchFunction(cursor, pageSize);

      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      if (newItems.length > 0) {
        setData(prev => [...prev, ...newItems]);
        // El cursor es el ID del último item
        setCursor(newItems[newItems.length - 1].id);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, fetchFunction, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};

/**
 * Hook para detectar scroll al final (infinite scroll)
 *
 * @param callback - Función a ejecutar al llegar al final
 * @param threshold - Distancia desde el final para trigger (default: 200px)
 *
 * @example
 * useInfiniteScroll(() => {
 *   if (hasMore && !loading) {
 *     loadMore();
 *   }
 * }, 300);
 */
export const useInfiniteScroll = (
  callback: () => void,
  threshold: number = 200
): void => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};

/**
 * Hook para local storage con TypeScript
 *
 * @param key - Key del localStorage
 * @param initialValue - Valor inicial
 * @returns [value, setValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 */
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// =============================================
// DAILY OBJECTIVES HOOK
// =============================================

import {
  DailyObjectivesState,
  UserXpProfile,
  ObjectiveType,
  PlanType,
  Badge,
  UserBadge,
  BadgesState
} from '../types';
import {
  generateDailyObjectives,
  calculateLevel,
  objectiveEvents
} from './dailyObjectives';
import {
  BADGES,
  checkBadgeUnlock,
  badgeEvents
} from './badges';

const STORAGE_KEY_OBJECTIVES = 'carnilab_daily_objectives';
const STORAGE_KEY_XP = 'carnilab_user_xp';

function getDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useDailyObjectives = (userPlan: PlanType | undefined) => {
  const [state, setStateInternal] = useState<DailyObjectivesState | null>(null);
  const [xpProfile, setXpProfile] = useState<UserXpProfile>({
    totalXp: 0,
    level: 1,
    currentLevelXp: 0,
    xpToNextLevel: 100
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [justCompletedXp, setJustCompletedXp] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (!userPlan) return;

    const today = getDateString();
    const storedObjectives = localStorage.getItem(STORAGE_KEY_OBJECTIVES);
    const storedXp = localStorage.getItem(STORAGE_KEY_XP);

    // Load XP profile
    let currentTotalXp = 0;
    if (storedXp) {
      try {
        const xpData = JSON.parse(storedXp);
        currentTotalXp = xpData.totalXp || 0;
        const levelInfo = calculateLevel(currentTotalXp);
        setXpProfile({
          totalXp: currentTotalXp,
          level: levelInfo.level,
          currentLevelXp: levelInfo.currentLevelXp,
          xpToNextLevel: levelInfo.xpToNextLevel
        });
      } catch (e) {
        console.error('Error loading XP:', e);
      }
    }

    // Load or generate objectives
    if (storedObjectives) {
      try {
        const parsed: DailyObjectivesState = JSON.parse(storedObjectives);

        if (parsed.date === today) {
          // Same day, use existing objectives
          setStateInternal(parsed);
        } else {
          // New day - generate new objectives
          const previousTypes = parsed.objectives.map(o => o.type);
          const newObjectives = generateDailyObjectives(userPlan, previousTypes);

          // Update streak
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          const wasActiveYesterday =
            parsed.date === yesterdayStr &&
            parsed.objectives.some(o => o.isCompleted);

          const newStreak = wasActiveYesterday
            ? parsed.streak + 1
            : parsed.objectives.some(o => o.isCompleted)
            ? 1
            : 0;

          const newState: DailyObjectivesState = {
            date: today,
            objectives: newObjectives,
            totalXpToday: 0,
            streak: newStreak,
            lastStreakDate: wasActiveYesterday ? today : parsed.lastStreakDate
          };

          setStateInternal(newState);
          localStorage.setItem(STORAGE_KEY_OBJECTIVES, JSON.stringify(newState));
        }
      } catch (e) {
        console.error('Error loading objectives:', e);
        // Generate fresh objectives on error
        const newObjectives = generateDailyObjectives(userPlan);
        const newState: DailyObjectivesState = {
          date: today,
          objectives: newObjectives,
          totalXpToday: 0,
          streak: 0,
          lastStreakDate: null
        };
        setStateInternal(newState);
        localStorage.setItem(STORAGE_KEY_OBJECTIVES, JSON.stringify(newState));
      }
    } else {
      // First time - generate objectives
      const newObjectives = generateDailyObjectives(userPlan);
      const newState: DailyObjectivesState = {
        date: today,
        objectives: newObjectives,
        totalXpToday: 0,
        streak: 0,
        lastStreakDate: null
      };

      setStateInternal(newState);
      localStorage.setItem(STORAGE_KEY_OBJECTIVES, JSON.stringify(newState));
    }

    setIsInitialized(true);
  }, [userPlan]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state && isInitialized) {
      localStorage.setItem(STORAGE_KEY_OBJECTIVES, JSON.stringify(state));
    }
  }, [state, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_XP, JSON.stringify({ totalXp: xpProfile.totalXp }));
    }
  }, [xpProfile.totalXp, isInitialized]);

  // Complete an objective
  const completeObjective = useCallback(
    (objectiveType: ObjectiveType) => {
      if (!state) return false;

      const objective = state.objectives.find(
        o => o.type === objectiveType && !o.isCompleted
      );
      if (!objective) return false;

      const newObjectives = state.objectives.map(o => {
        if (o.type === objectiveType && !o.isCompleted) {
          return {
            ...o,
            isCompleted: true,
            completedAt: new Date().toISOString()
          };
        }
        return o;
      });

      const xpEarned = objective.xpReward;
      const newTotalXp = xpProfile.totalXp + xpEarned;
      const oldLevel = xpProfile.level;
      const levelInfo = calculateLevel(newTotalXp);

      // Check for level up
      if (levelInfo.level > oldLevel) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }

      // Show XP earned animation
      setJustCompletedXp(xpEarned);
      setTimeout(() => setJustCompletedXp(null), 2000);

      setStateInternal(prev =>
        prev
          ? {
              ...prev,
              objectives: newObjectives,
              totalXpToday: prev.totalXpToday + xpEarned
            }
          : null
      );

      setXpProfile({
        totalXp: newTotalXp,
        level: levelInfo.level,
        currentLevelXp: levelInfo.currentLevelXp,
        xpToNextLevel: levelInfo.xpToNextLevel
      });

      return true;
    },
    [state, xpProfile]
  );

  // Check if an objective can be marked complete
  const canCompleteObjective = useCallback(
    (objectiveType: ObjectiveType): boolean => {
      if (!state) return false;
      return state.objectives.some(o => o.type === objectiveType && !o.isCompleted);
    },
    [state]
  );

  // Subscribe to objective events
  useEffect(() => {
    const unsubscribe = objectiveEvents.subscribe((type: ObjectiveType) => {
      // Use a timeout to ensure state is updated
      setTimeout(() => {
        if (state?.objectives.some(o => o.type === type && !o.isCompleted)) {
          completeObjective(type);
        }
      }, 100);
    });
    return unsubscribe;
  }, [state, completeObjective]);

  // Progress stats
  const progress = {
    completed: state?.objectives.filter(o => o.isCompleted).length || 0,
    total: state?.objectives.length || 0,
    percentage: state
      ? Math.round(
          (state.objectives.filter(o => o.isCompleted).length /
            state.objectives.length) *
            100
        )
      : 0
  };

  return {
    objectives: state?.objectives || [],
    totalXpToday: state?.totalXpToday || 0,
    streak: state?.streak || 0,
    xpProfile,
    progress,
    completeObjective,
    canCompleteObjective,
    isInitialized,
    showLevelUp,
    justCompletedXp
  };
};

// =============================================
// BADGES HOOK
// =============================================

const STORAGE_KEY_BADGES = 'carnilab_badges';

interface BadgeStats {
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

export const useBadges = (stats: BadgeStats) => {
  const [badgesState, setBadgesState] = useState<BadgesState>({
    earnedBadges: [],
    totalBadgesEarned: 0,
    lastUnlockedBadge: null
  });
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load badges from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_BADGES);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBadgesState(parsed);
      } catch (e) {
        console.error('Error loading badges:', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save badges to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY_BADGES, JSON.stringify(badgesState));
    }
  }, [badgesState, isInitialized]);

  // Check for new badge unlocks when stats change
  useEffect(() => {
    if (!isInitialized) return;

    const earnedIds = new Set(badgesState.earnedBadges.map(b => b.badgeId));
    let newBadge: Badge | null = null;

    BADGES.forEach(badge => {
      // Skip already earned badges
      if (earnedIds.has(badge.id)) return;

      // Skip special badges that need manual triggering
      if (badge.requirement.type === 'special') return;

      // Check if badge is unlocked
      if (checkBadgeUnlock(badge, stats)) {
        const userBadge: UserBadge = {
          badgeId: badge.id,
          unlockedAt: new Date().toISOString(),
          progress: 100
        };

        setBadgesState(prev => ({
          ...prev,
          earnedBadges: [...prev.earnedBadges, userBadge],
          totalBadgesEarned: prev.totalBadgesEarned + 1,
          lastUnlockedBadge: badge.id
        }));

        // Set the newly unlocked badge for notification
        newBadge = badge;

        // Emit event
        badgeEvents.emit(badge);
      }
    });

    if (newBadge) {
      setNewlyUnlockedBadge(newBadge);
      // Clear after 4 seconds
      setTimeout(() => setNewlyUnlockedBadge(null), 4000);
    }
  }, [stats, isInitialized, badgesState.earnedBadges]);

  // Manually award a special badge
  const awardSpecialBadge = useCallback((badgeId: string) => {
    const badge = BADGES.find(b => b.id === badgeId);
    if (!badge) return false;

    const earnedIds = new Set(badgesState.earnedBadges.map(b => b.badgeId));
    if (earnedIds.has(badgeId)) return false;

    const userBadge: UserBadge = {
      badgeId: badge.id,
      unlockedAt: new Date().toISOString(),
      progress: 100
    };

    setBadgesState(prev => ({
      ...prev,
      earnedBadges: [...prev.earnedBadges, userBadge],
      totalBadgesEarned: prev.totalBadgesEarned + 1,
      lastUnlockedBadge: badge.id
    }));

    setNewlyUnlockedBadge(badge);
    setTimeout(() => setNewlyUnlockedBadge(null), 4000);

    badgeEvents.emit(badge);
    return true;
  }, [badgesState.earnedBadges]);

  // Dismiss the notification
  const dismissBadgeNotification = useCallback(() => {
    setNewlyUnlockedBadge(null);
  }, []);

  // Check if a badge is earned
  const hasBadge = useCallback((badgeId: string): boolean => {
    return badgesState.earnedBadges.some(b => b.badgeId === badgeId);
  }, [badgesState.earnedBadges]);

  // Get all badges with their status
  const allBadges = BADGES.map(badge => {
    const earned = badgesState.earnedBadges.find(b => b.badgeId === badge.id);
    return {
      ...badge,
      isEarned: !!earned,
      unlockedAt: earned?.unlockedAt || null,
      progress: earned ? 100 : (badge.requirement.type !== 'special' ?
        Math.min(100, Math.round(
          (stats[badge.requirement.type as keyof BadgeStats] as number || 0) /
          badge.requirement.count * 100
        )) : 0)
    };
  });

  return {
    earnedBadges: badgesState.earnedBadges,
    totalBadgesEarned: badgesState.totalBadgesEarned,
    newlyUnlockedBadge,
    allBadges,
    hasBadge,
    awardSpecialBadge,
    dismissBadgeNotification,
    isInitialized
  };
};
