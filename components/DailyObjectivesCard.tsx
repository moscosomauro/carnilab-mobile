import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyObjective, UserXpProfile } from '../types';
import { LEVEL_TITLES } from '../utils/dailyObjectives';

interface DailyObjectivesCardProps {
  objectives: DailyObjective[];
  totalXpToday: number;
  streak: number;
  xpProfile: UserXpProfile;
  progress: { completed: number; total: number; percentage: number };
  showLevelUp?: boolean;
  justCompletedXp?: number | null;
}

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const DailyObjectivesCard: React.FC<DailyObjectivesCardProps> = ({
  objectives,
  totalXpToday,
  streak,
  xpProfile,
  progress,
  showLevelUp,
  justCompletedXp
}) => {
  if (objectives.length === 0) return null;

  const levelTitle = LEVEL_TITLES[xpProfile.level] || 'Maestro';
  const xpPercentage = Math.min(
    100,
    (xpProfile.currentLevelXp / xpProfile.xpToNextLevel) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-[28px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-xl border border-white/60 dark:border-slate-700 overflow-hidden"
    >
      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-2">
                ¡Nivel {xpProfile.level}!
              </h2>
              <p className="text-white/80">{levelTitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#6B8E23] to-[#4A5D4F] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="text-base">🎯</span>
              Objetivos Diarios
            </h3>
            <p className="text-white/70 text-[11px] mt-0.5">
              {progress.completed}/{progress.total} completados
            </p>
          </div>

          {/* Streak Badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
              <span className="text-orange-300 text-sm">🔥</span>
              <span className="text-white font-bold text-sm">{streak}</span>
              <span className="text-white/60 text-[10px]">días</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      {/* Objectives List */}
      <div className="p-3 space-y-2">
        <AnimatePresence>
          {objectives.map((objective, index) => (
            <motion.div
              key={objective.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                objective.isCompleted
                  ? 'bg-[#6B8E23]/10 border-[#6B8E23]/30'
                  : 'bg-[#F5F1EB] dark:bg-slate-700/50 border-transparent'
              }`}
            >
              {/* Status Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  objective.isCompleted
                    ? 'bg-[#6B8E23] text-white'
                    : 'bg-white dark:bg-slate-600 border-2 border-[#CFC8C0] dark:border-slate-500'
                }`}
              >
                {objective.isCompleted && <CheckIcon />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{objective.icon}</span>
                  <span
                    className={`font-bold text-[13px] ${
                      objective.isCompleted
                        ? 'text-[#6B8E23] line-through opacity-70'
                        : 'text-[#2E2E2E] dark:text-white'
                    }`}
                  >
                    {objective.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E877F] dark:text-slate-400 mt-0.5 truncate">
                  {objective.description}
                </p>
              </div>

              {/* XP Reward */}
              <div
                className={`text-right shrink-0 ${
                  objective.isCompleted ? 'opacity-50' : ''
                }`}
              >
                <span className="text-[#6B8E23] font-black text-sm">
                  +{objective.xpReward}
                </span>
                <span className="text-[#8E877F] text-[10px] ml-0.5">XP</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* XP Footer */}
      <div className="px-3 pb-3">
        <div className="bg-[#F5F1EB] dark:bg-slate-700/50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⭐</span>
              <div>
                <span className="font-bold text-[#2E2E2E] dark:text-white text-sm">
                  Nivel {xpProfile.level}
                </span>
                <span className="text-[#8E877F] dark:text-slate-400 text-[11px] ml-2">
                  {levelTitle}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-[#8E877F] dark:text-slate-400 font-medium">
              {xpProfile.currentLevelXp} / {xpProfile.xpToNextLevel} XP
            </span>
          </div>

          {/* Level Progress */}
          <div className="h-2 bg-white dark:bg-slate-600 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
            />
          </div>

          {/* XP Earned Today */}
          {(totalXpToday > 0 || justCompletedXp) && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-[11px] text-[#6B8E23] font-bold mt-2"
            >
              {justCompletedXp ? (
                <motion.span
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="inline-block"
                >
                  +{justCompletedXp} XP 🎉
                </motion.span>
              ) : (
                <>+{totalXpToday} XP hoy</>
              )}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DailyObjectivesCard;
