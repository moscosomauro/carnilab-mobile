import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../types';
import { RARITY_COLORS, RARITY_LABELS } from '../utils/badges';

interface BadgeWithStatus extends Badge {
  isEarned: boolean;
  unlockedAt: string | null;
  progress: number;
}

interface BadgesDisplayProps {
  badges: BadgeWithStatus[];
  totalEarned: number;
  onClose?: () => void;
}

interface BadgeUnlockNotificationProps {
  badge: Badge | null;
  onDismiss: () => void;
}

// =============================================
// BADGE CARD COMPONENT
// =============================================

const BadgeCard: React.FC<{ badge: BadgeWithStatus; onClick: () => void }> = ({
  badge,
  onClick
}) => {
  const colors = RARITY_COLORS[badge.rarity];
  const isLocked = !badge.isEarned;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative p-3 rounded-2xl border-2 transition-all ${
        isLocked
          ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-60'
          : `${colors.bg} ${colors.border} ${colors.glow}`
      }`}
    >
      {/* Badge Icon */}
      <div
        className={`text-3xl mb-1 ${isLocked ? 'grayscale opacity-40' : ''}`}
      >
        {badge.icon}
      </div>

      {/* Progress bar for locked badges */}
      {isLocked && badge.progress > 0 && (
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-300 dark:bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6B8E23] rounded-full transition-all"
            style={{ width: `${badge.progress}%` }}
          />
        </div>
      )}

      {/* Earned indicator */}
      {!isLocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#6B8E23] rounded-full flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}
    </motion.button>
  );
};

// =============================================
// BADGE DETAIL MODAL
// =============================================

const BadgeDetailModal: React.FC<{
  badge: BadgeWithStatus;
  onClose: () => void;
}> = ({ badge, onClose }) => {
  const colors = RARITY_COLORS[badge.rarity];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xs rounded-3xl p-6 border-2 ${colors.bg} ${colors.border} ${colors.glow}`}
      >
        {/* Badge Icon */}
        <div className="text-center mb-4">
          <span
            className={`text-6xl ${!badge.isEarned ? 'grayscale opacity-50' : ''}`}
          >
            {badge.icon}
          </span>
        </div>

        {/* Badge Name */}
        <h3 className={`text-xl font-black text-center mb-1 ${colors.text}`}>
          {badge.name}
        </h3>

        {/* Rarity */}
        <p className={`text-xs font-bold text-center uppercase tracking-widest mb-3 ${colors.text} opacity-70`}>
          {RARITY_LABELS[badge.rarity]}
        </p>

        {/* Description */}
        <p className="text-sm text-center text-gray-600 dark:text-slate-300 mb-4">
          {badge.description}
        </p>

        {/* Progress or Status */}
        {badge.isEarned ? (
          <div className="text-center">
            <p className="text-xs text-[#6B8E23] font-bold mb-1">
              Desbloqueada
            </p>
            {badge.unlockedAt && (
              <p className="text-[10px] text-gray-500">
                {new Date(badge.unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso</span>
              <span>{badge.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6B8E23] rounded-full transition-all"
                style={{ width: `${badge.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* XP Bonus */}
        <div className="mt-4 text-center">
          <span className="text-sm text-amber-500 font-bold">
            +{badge.xpBonus} XP
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold text-gray-600 dark:text-slate-300"
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  );
};

// =============================================
// MAIN BADGES DISPLAY COMPONENT
// =============================================

export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({
  badges,
  onClose
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const filteredBadges = badges.filter((b) => {
    if (filter === 'earned') return b.isEarned;
    if (filter === 'locked') return !b.isEarned;
    return true;
  });

  const earnedCount = badges.filter((b) => b.isEarned).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end lg:items-center justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl lg:rounded-3xl max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#6B8E23] to-[#4A5D4F] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-lg font-black flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Insignias
              </h2>
              <p className="text-white/70 text-sm">
                {earnedCount} de {badges.length} desbloqueadas
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4">
            {(['all', 'earned', 'locked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-white text-[#6B8E23]'
                    : 'bg-white/20 text-white'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'earned' ? 'Ganadas' : 'Bloqueadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="grid grid-cols-5 gap-3">
            {filteredBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No hay insignias en esta categoría</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================
// BADGE UNLOCK NOTIFICATION
// =============================================

export const BadgeUnlockNotification: React.FC<BadgeUnlockNotificationProps> = ({
  badge,
  onDismiss
}) => {
  if (!badge) return null;

  const colors = RARITY_COLORS[badge.rarity];

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-4 left-4 right-4 z-[300] flex justify-center"
        >
          <motion.div
            onClick={onDismiss}
            className={`px-6 py-4 rounded-2xl border-2 shadow-xl cursor-pointer ${colors.bg} ${colors.border} ${colors.glow}`}
          >
            <div className="flex items-center gap-4">
              {/* Icon with animation */}
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
                className="text-4xl"
              >
                {badge.icon}
              </motion.span>

              <div>
                <p className="text-xs font-bold text-[#6B8E23] uppercase tracking-wider">
                  Nueva Insignia
                </p>
                <h3 className={`text-lg font-black ${colors.text}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-gray-500">
                  +{badge.xpBonus} XP
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =============================================
// BADGES PREVIEW (for Dashboard)
// =============================================

interface BadgesPreviewProps {
  badges: BadgeWithStatus[];
  totalEarned: number;
  onViewAll: () => void;
}

export const BadgesPreview: React.FC<BadgesPreviewProps> = ({
  badges,
  totalEarned,
  onViewAll
}) => {
  // Show last 5 earned badges
  const recentBadges = badges
    .filter((b) => b.isEarned)
    .sort((a, b) => {
      if (!a.unlockedAt || !b.unlockedAt) return 0;
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    })
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-[28px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-xl border border-white/60 dark:border-slate-700 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h3 className="font-bold text-[#2E2E2E] dark:text-white text-sm">
            Insignias
          </h3>
          <span className="text-xs text-[#8E877F] dark:text-slate-400">
            {totalEarned}/{badges.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-[#6B8E23] font-bold"
        >
          Ver todas
        </button>
      </div>

      {recentBadges.length > 0 ? (
        <div className="flex gap-2 justify-center">
          {recentBadges.map((badge) => (
            <div
              key={badge.id}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${
                RARITY_COLORS[badge.rarity].bg
              } ${RARITY_COLORS[badge.rarity].border}`}
            >
              <span className="text-2xl">{badge.icon}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 py-2">
          Completa objetivos para ganar insignias
        </p>
      )}
    </motion.div>
  );
};

export default BadgesDisplay;
