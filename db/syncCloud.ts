// ============================================================
// SINCRONIZACIÓN POR LA NUBE (Supabase) — opcional
// Mismo merge que el sync Wi-Fi (LWW + tombstones de mergeCore),
// pero el "punto de encuentro" es Supabase en vez de la PC. Así el
// iPhone trabaja en el campo sin la PC prendida y, al prender la PC,
// el escritorio baja todo automáticamente.
//
// Modelo "espacio privado simple": un código de espacio secreto
// (cloud_space_id) compartido entre la PC y el iPhone. Todo el estado
// vive en una fila JSONB por espacio. El acceso es por dos RPC
// SECURITY DEFINER (carnilab_pull / carnilab_push) para que haya que
// conocer el código y no se puedan listar otros espacios.
// ============================================================
import { supabase, cloudConfigured } from './supabaseClient';
import { collectLocalState, applyState, mergeStates, SyncState } from './sync';

const SPACE_KEY = 'cloud_space_id';
const CLOUD_LAST_KEY = 'cloud_sync_last';

export { cloudConfigured };

export function getSpaceId(): string | null {
  const v = localStorage.getItem(SPACE_KEY);
  return v && v.trim() ? v.trim() : null;
}

export function setSpaceId(id: string): void {
  const clean = id.trim();
  if (clean) localStorage.setItem(SPACE_KEY, clean);
}

export function clearSpaceId(): void {
  localStorage.removeItem(SPACE_KEY);
}

// Genera un código de espacio nuevo (para la PC la primera vez).
export function generateSpaceId(): string {
  const rnd = (globalThis.crypto as any)?.randomUUID?.()
    || Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `carni-${rnd}`;
}

// La nube está lista para sincronizar si hay claves y un código de espacio.
export function cloudReady(): boolean {
  return cloudConfigured && !!getSpaceId();
}

export function getCloudLastSync(): number {
  return Number(localStorage.getItem(CLOUD_LAST_KEY) || 0);
}

let inFlight = false;

// Sincroniza con la nube: trae el estado remoto, lo mergea con el local,
// sube el resultado y lo aplica localmente. Seguro ante llamadas concurrentes.
export async function syncCloudNow(): Promise<{ ok: boolean; error?: string }> {
  if (!cloudConfigured || !supabase) {
    return { ok: false, error: 'La nube no está configurada (faltan las claves de Supabase).' };
  }
  const space = getSpaceId();
  if (!space) {
    return { ok: false, error: 'Sin código de espacio. Definí el mismo código en la PC y en el iPhone (Ajustes › Nube).' };
  }
  if (inFlight) return { ok: false, error: 'Ya hay una sincronización en curso.' };
  inFlight = true;
  try {
    // 1) Estado remoto
    const { data: remote, error: pullErr } = await supabase.rpc('carnilab_pull', { p_space: space });
    if (pullErr) return { ok: false, error: pullErr.message };
    const cloudState: SyncState = (remote as SyncState) || { tables: {}, tombstones: {} };

    // 2) Merge con lo local
    const local = await collectLocalState();
    const merged = mergeStates(local, cloudState);

    // 3) Subir resultado mergeado
    const { error: pushErr } = await supabase.rpc('carnilab_push', { p_space: space, p_state: merged });
    if (pushErr) return { ok: false, error: pushErr.message };

    // 4) Aplicar localmente
    await applyState(merged);
    localStorage.setItem(CLOUD_LAST_KEY, String(Date.now()));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo conectar con la nube.' };
  } finally {
    inFlight = false;
  }
}
