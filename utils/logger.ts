/**
 * Sistema de Logging Condicional para CarniLab
 *
 * En desarrollo: muestra todos los logs
 * En producción: solo muestra errores críticos + Sentry tracking
 *
 * Uso:
 * import { logger } from './utils/logger';
 * logger.log('Mensaje de debug');
 * logger.warn('Advertencia');
 * logger.error('Error crítico'); // Siempre se muestra + envía a Sentry
 */

import * as Sentry from "@sentry/react";

const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development';

export const logger = {
  /**
   * Log de desarrollo - Solo visible en DEV
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Advertencias - Solo visible en DEV
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Errores críticos - Siempre visible + Sentry en producción
   * Estos son los únicos logs que aparecen en producción
   */
  error: (...args: any[]) => {
    console.error(...args);

    // ✅ Enviar a Sentry en producción
    if (!isDev && import.meta.env.VITE_SENTRY_DSN) {
      const error = args[0];
      const context = args.slice(1);

      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: context.length > 0 ? { context } : undefined,
        });
      } else {
        // Si no es un Error, enviar como mensaje
        Sentry.captureMessage(String(error), {
          level: 'error',
          extra: context.length > 0 ? { context } : undefined,
        });
      }
    }
  },

  /**
   * Info general - Solo visible en DEV
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Debug verbose - Solo visible en DEV
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Tabla de datos - Solo visible en DEV
   */
  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  },

  /**
   * Grupo de logs - Solo visible en DEV
   */
  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
};

/**
 * Helper para logs de performance
 */
export const performanceLog = {
  start: (label: string): number => {
    if (isDev) {
      logger.log(`⏱️ [Performance] ${label} - START`);
      return performance.now();
    }
    return 0;
  },

  end: (label: string, startTime: number) => {
    if (isDev) {
      const elapsed = performance.now() - startTime;
      logger.log(`⏱️ [Performance] ${label} - END (${elapsed.toFixed(2)}ms)`);
    }
  },
};

/**
 * Helper para logs de red
 */
export const networkLog = {
  request: (method: string, url: string, data?: any) => {
    if (isDev) {
      logger.group(`🌐 [Network] ${method} ${url}`);
      if (data) logger.log('Payload:', data);
      logger.groupEnd();
    }
  },

  response: (method: string, url: string, status: number, data?: any) => {
    if (isDev) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      logger.group(`${emoji} [Network] ${method} ${url} - ${status}`);
      if (data) logger.log('Response:', data);
      logger.groupEnd();
    }
  },

  error: (method: string, url: string, error: any) => {
    // ✅ Usar logger.error para que también se envíe a Sentry
    logger.error(`❌ [Network] ${method} ${url} - ERROR:`, error);

    // ✅ Añadir contexto de red a Sentry
    if (!isDev && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setContext('network', {
        method,
        url,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

export default logger;
