// ============================================================
// CLIENTE DE SINCRONIZACIÓN (corre en el navegador / renderer)
// Mismo código en la PC (Electron) y en el iPhone (PWA); solo
// cambian la URL del servidor y el token:
//  - PC: el servidor está en localhost (sin token).
//  - iPhone: la PWA se sirvió desde la PC, así que el servidor es
//    el mismo origin; solo hace falta el token (emparejado por QR).
// ============================================================
import { collectLocalState, applyState } from './sync';

const TOKEN_KEY = 'sync_token';
const LAST_SYNC_KEY = 'sync_last';

export function isElectron(): boolean {
  return !!(window as any).electronAPI?.isElectron;
}

export function savePairToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getPairToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function isPaired(): boolean {
  return isElectron() || !!getPairToken();
}
export function getLastSync(): number {
  return Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
}

async function getTarget(): Promise<{ url: string; token: string } | null> {
  if (isElectron()) {
    try {
      const info = await (window as any).electronAPI.getSyncInfo();
      return { url: `http://localhost:${info.port}`, token: '' };
    } catch {
      return null;
    }
  }
  const token = getPairToken();
  if (!token) return null;
  // La PWA fue servida por la PC → el servidor es el mismo origin
  return { url: window.location.origin, token };
}

export async function syncNow(): Promise<{ ok: boolean; error?: string }> {
  const target = await getTarget();
  if (!target) {
    return { ok: false, error: 'No emparejado. Escaneá el QR de la PC con la cámara del iPhone.' };
  }
  try {
    const local = await collectLocalState();
    const res = await fetch(`${target.url}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(target.token ? { 'x-sync-token': target.token } : {}),
      },
      body: JSON.stringify(local),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({} as any));
      return { ok: false, error: e.error || `Error ${res.status}` };
    }
    const merged = await res.json();
    await applyState(merged);
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo conectar. ¿Estás en la misma red Wi-Fi que la PC?' };
  }
}

// Link que codifica el QR que muestra la PC (lo abre el iPhone con su cámara)
export async function getPairLink(): Promise<{ link: string; ip: string; port: number } | null> {
  if (!isElectron()) return null;
  try {
    const info = await (window as any).electronAPI.getSyncInfo();
    return {
      link: `http://${info.ip}:${info.port}/#/sync?pairToken=${info.token}`,
      ip: info.ip,
      port: info.port,
    };
  } catch {
    return null;
  }
}
