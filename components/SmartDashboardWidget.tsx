
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SeedBatch, Cross, Plant } from '../types';
import { useTranslation } from 'react-i18next';

interface SmartDashboardWidgetProps {
  seedBank: SeedBatch[];
  crosses: Cross[];
  plants: Plant[];
}

export const SmartDashboardWidget: React.FC<SmartDashboardWidgetProps> = ({ seedBank, crosses, plants }) => {
  useTranslation();

  const stats = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Stratification ending soon
    const stratEndingSoon = seedBank.filter(batch => {
      if (batch.estado !== 'estratificando' || !batch.fin_estratificacion) return false;
      const endDate = new Date(batch.fin_estratificacion);
      return endDate >= now && endDate <= nextWeek;
    });

    // 2. Success Rate
    const totalFinished = crosses.filter(c => c.estado === 'completada' || c.estado === 'fallida').length;
    const successful = crosses.filter(c => c.estado === 'completada').length;
    const successRate = totalFinished > 0 ? Math.round((successful / totalFinished) * 100) : 0;

    // 3. Germinating Lots
    const germinatingCount = plants.filter(p => p.nombre.startsWith('Lote Germinación:')).length;

    return {
      stratCount: stratEndingSoon.length,
      successRate: successRate,
      germinatingCount: germinatingCount,
      hasData: stratEndingSoon.length > 0 || totalFinished > 0 || germinatingCount > 0
    };
  }, [seedBank, crosses, plants]);

  if (!stats.hasData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-6 rounded-[32px] bg-gradient-to-br from-[#4A5D4F] to-[#2E3A31] text-white shadow-xl border border-white/10 relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">✨</span>
          <h3 className="text-sm font-black uppercase tracking-widest opacity-80">CarniLab Insight</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {stats.stratCount > 0 && (
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5">
              <div className="text-2xl">❄️</div>
              <div>
                <p className="text-[15px] font-bold leading-tight">
                  {stats.stratCount} {stats.stratCount === 1 ? 'lote termina' : 'lotes terminan'} su frío esta semana.
                </p>
                <p className="text-[11px] opacity-60 font-medium mt-0.5">¡Prepara tu germinador!</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="text-2xl">🏆</div>
            <div>
              <p className="text-[15px] font-bold leading-tight">
                Tu tasa de éxito en cruzas es del {stats.successRate}%.
              </p>
              <p className="text-[11px] opacity-60 font-medium mt-0.5">
                {stats.successRate > 70 ? '¡Eres un maestro criador!' : 'Sigue experimentando, vas por buen camino.'}
              </p>
            </div>
          </div>

          {stats.germinatingCount > 0 && (
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5">
              <div className="text-2xl">🌱</div>
              <div>
                <p className="text-[15px] font-bold leading-tight">
                  Tienes {stats.germinatingCount} {stats.germinatingCount === 1 ? 'lote' : 'lotes'} germinando ahora.
                </p>
                <p className="text-[11px] opacity-60 font-medium mt-0.5">No olvides revisar la humedad.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
