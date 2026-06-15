// ============================================================
// SINCRONIZACIÓN - acceso a la BD local (Fase 4)
// La lógica de merge pura vive en mergeCore.ts (compartida con el
// servidor de Electron). Aquí solo el puente con IndexedDB.
// ============================================================
import { TableKey, loadTable, saveTable, loadTombstones, saveTombstones, Tombstone } from './localDb';
import { SyncState, mergeStates, recordTime, SYNC_TABLES } from './mergeCore';

export type { SyncState };
export { mergeStates, recordTime };

const TABLES = SYNC_TABLES as readonly TableKey[];

// Sella un registro con la hora actual (se llama en cada alta/edición)
export function stamp<T extends object>(record: T): T {
  return { ...record, _updatedAt: Date.now() } as T;
}

// Lee todo el estado local (datos vivos + lápidas) para enviar al servidor
export async function collectLocalState(): Promise<SyncState> {
  const tables: Record<string, any[]> = {};
  for (const t of TABLES) {
    tables[t] = await loadTable<any>(t);
  }
  const tombArr = await loadTombstones();
  const tombstones: Record<string, Tombstone> = {};
  for (const tomb of tombArr) tombstones[tomb.key] = tomb;
  return { tables, tombstones };
}

// Reemplaza el estado local con el estado mergeado
export async function applyState(merged: SyncState): Promise<void> {
  for (const t of TABLES) {
    await saveTable(t, merged.tables[t] || []);
  }
  await saveTombstones(Object.values(merged.tombstones || {}) as Tombstone[]);
}
