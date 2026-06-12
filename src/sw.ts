/// <reference lib="webworker" />
// VERSION: v1.1.2

declare let self: ServiceWorkerGlobalScope

import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

// Use correct typing for manifest injection
// @ts-ignore
const manifest = self.__WB_MANIFEST
if (manifest) {
  precacheAndRoute(manifest)
}

// SW Activation and Logs
self.addEventListener('install', () => {
  console.log('Service Worker: Instalado ✅');
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  console.log('Service Worker: Activado y listo 🚀');
  event.waitUntil((self as any).clients.claim());
});

// Push Event Listener
self.addEventListener('push', (event: any) => {
  console.log('--- EVENTO PUSH RECIBIDO ---');
  console.log('Datos raw del evento:', event.data?.text());

  let data: any = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log('JSON procesado:', data);
  } catch (e) {
    console.warn('El payload no es JSON:', event.data?.text());
    data = { body: event.data?.text() };
  }

  const title = data.title || 'CarniLab 🌿';
  const options: any = {
    body: data.body || 'Tienes una nueva notificación.',
    icon: '/carnibot.png',
    badge: '/carnibot.png',
    vibrate: [200, 100, 200],
    data: data.url || '/alerts',
    tag: 'carnilab-alert-' + Date.now(), // Asegura que no se agrupen si son muy seguidas
    requireInteraction: true // Mantiene la notificación hasta que el usuario la toque
  };

  event.waitUntil((self as any).registration.showNotification(title, options));
});

// Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Get the route from notification data (e.g., '/alerts')
  const route = event.notification.data || '/alerts'
  // Build full URL with hash for HashRouter (e.g., '/#/alerts')
  const urlToOpen = new URL('/#' + route, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            // Navigate to the route
            client.postMessage({ type: 'NAVIGATE', url: route })
            return client
          })
        }
      }
      // Open new window if closed
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})
