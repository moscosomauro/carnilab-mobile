import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/i18n';
import * as Sentry from "@sentry/react";

// ✅ SENTRY - Error Tracking en Producción
// Solo se activa si VITE_SENTRY_DSN está configurado en .env
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Privacidad: ocultar texto sensible
        blockAllMedia: true, // Privacidad: ocultar imágenes
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% de sesiones normales
    replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
    // Filtros
    beforeSend(event) {
      // No enviar errores de desarrollo
      if (import.meta.env.DEV) return null;

      // No enviar errores de extensiones del navegador
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(frame =>
        frame.filename?.includes('chrome-extension://') ||
        frame.filename?.includes('moz-extension://')
      )) {
        return null;
      }

      return event;
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);