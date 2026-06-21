// Helpers compartidos del sistema de gestión de polinización (móvil).
import { Cross } from '../types';

export type PolStatus = 'programada' | 'pendiente' | 'hecha' | 'vencida';

// Estado de polinización mostrado: usa el campo nuevo y, si no, deduce del legado.
export function polStatus(c: Cross): PolStatus {
  if (c.estado_polinizacion) {
    if (c.estado_polinizacion !== 'hecha' && c.fecha_programada &&
        new Date(c.fecha_programada).setHours(23, 59, 59, 999) < Date.now()) return 'vencida';
    return c.estado_polinizacion;
  }
  if (c.estado === 'completada') return 'hecha';
  return 'pendiente';
}

export const statusConf: Record<PolStatus, { label: string; cls: string }> = {
  programada: { label: 'Programada', cls: 'bg-[#C9A24B]/15 text-[#9a7b2f]' },
  pendiente: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-600' },
  hecha: { label: 'Hecha', cls: 'bg-brand-primary/10 text-brand-primary' },
  vencida: { label: 'Vencida', cls: 'bg-rose-50 text-rose-600' },
};

export const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—';
export const fmtDayLong = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const isToday = (d?: string | null) =>
  !!d && new Date(d).toDateString() === new Date().toDateString();

export const DIAS_A_COSECHA = 45; // estimación por defecto cápsula→cosecha

// Fecha estimada de cosecha a partir de la polinización.
export function estimarCosecha(fechaPolinizacion?: string | null): string | null {
  if (!fechaPolinizacion) return null;
  const t = new Date(fechaPolinizacion).getTime();
  if (isNaN(t)) return null;
  return new Date(t + DIAS_A_COSECHA * 86400000).toISOString();
}

export const ETAPAS_CAPSULA = ['Polinización', 'Fecundación', 'Desarrollo', 'Maduración', 'Cosecha'] as const;

// Progreso de la cápsula (0–100), días restantes y etapa actual.
export function progresoCapsula(c: Cross): { pct: number; dias: number; etapa: string; cosecha: string | null } {
  const cosecha = c.cosecha_estimada || estimarCosecha(c.fecha_polinizacion);
  if (c.capsula_estado === 'cosechada') return { pct: 100, dias: 0, etapa: 'Cosecha', cosecha };
  if (!c.fecha_polinizacion || !cosecha) return { pct: 0, dias: 0, etapa: ETAPAS_CAPSULA[0], cosecha };
  const ini = new Date(c.fecha_polinizacion).getTime();
  const fin = new Date(cosecha).getTime();
  const now = Date.now();
  const pct = Math.max(0, Math.min(100, Math.round(((now - ini) / (fin - ini)) * 100)));
  const dias = Math.max(0, Math.ceil((fin - now) / 86400000));
  const idx = Math.min(ETAPAS_CAPSULA.length - 1, Math.floor((pct / 100) * ETAPAS_CAPSULA.length));
  return { pct, dias, etapa: ETAPAS_CAPSULA[idx], cosecha };
}

// ¿La cápsula está lista para cosechar?
export const capsulaMadura = (c: Cross): boolean =>
  c.capsula_estado === 'maduro' || (c.capsula_estado === 'desarrollo' && progresoCapsula(c).pct >= 100);

// Primera palabra (para nombres cortos "Madre × Padre").
export const fw = (s: string) => (s || '').split(' ')[0];
