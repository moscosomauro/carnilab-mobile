// Notificaciones locales (Fase 5) — sin nube.
//
// Dos canales según dónde corre la app:
//  - Electron (PC): toast nativo de Windows vía IPC (window.electronAPI.notify).
//    Aparece aunque CarniLab no tenga el foco. Al hacer click enfoca la ventana.
//  - Navegador / PWA (iPhone Safari, Chrome): Web Notifications API, mejor esfuerzo.
//    OJO: en iOS sólo funcionan con la PWA instalada (iOS 16.4+) y SIN push con la
//    app cerrada — sólo mientras la app está abierta. Es una limitación de iOS.

type ElectronAPI = {
  isElectron?: boolean;
  notify?: (payload: { title: string; body: string; tag?: string }) => void;
};

const getElectron = (): ElectronAPI | undefined =>
  (typeof window !== 'undefined' ? (window as any).electronAPI : undefined);

export const isElectron = (): boolean => !!getElectron()?.isElectron;

/** ¿El entorno soporta alguna forma de notificación local? */
export const notificationsSupported = (): boolean =>
  isElectron() || (typeof window !== 'undefined' && 'Notification' in window);

/** Estado del permiso web ('granted' | 'denied' | 'default'). En Electron siempre 'granted'. */
export const notificationPermission = (): NotificationPermission => {
  if (isElectron()) return 'granted';
  if (typeof window !== 'undefined' && 'Notification' in window) return Notification.permission;
  return 'denied';
};

/**
 * Pide permiso para notificaciones web. En Electron no hace falta (devuelve 'granted').
 * Debe llamarse idealmente desde un gesto del usuario (botón) — iOS lo exige.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (isElectron()) return 'granted';
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

/**
 * Dispara una notificación del SO (mejor esfuerzo). No lanza si falla.
 * @param tag  agrupa/reemplaza notificaciones de la misma alerta (evita duplicados).
 */
export const notifyOS = (title: string, body: string, tag?: string): void => {
  const electron = getElectron();
  if (electron?.isElectron && electron.notify) {
    try {
      electron.notify({ title, body, tag });
    } catch (e) {
      console.warn('No se pudo mostrar la notificación nativa:', e);
    }
    return;
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        tag,
        icon: './brand-logo.png',
        badge: './brand-logo.png',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      console.warn('No se pudo mostrar la notificación web:', e);
    }
  }
};
