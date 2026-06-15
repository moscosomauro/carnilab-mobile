// ============================================================
// NÚCLEO DE MERGE - lógica pura de sincronización
// Sin dependencias (ni Dexie ni Node) para poder usarse tanto en
// el navegador (db/sync.ts) como en el servidor de Electron
// (electron/syncServer.ts).
// ============================================================

export const SYNC_TABLES = ['plants', 'crosses', 'alerts', 'diary', 'climate', 'seedbank'] as const;

export interface TombstoneLite {
  key: string;        // `${table}:${id}`
  table: string;
  recordId: number;
  deletedAt: number;  // ms
}

export interface SyncState {
  tables: Record<string, any[]>;
  tombstones: Record<string, TombstoneLite>;
}

// Marca de tiempo de un registro para LWW. Usa _updatedAt; si no existe
// (datos importados de la nube), cae a created_at; si tampoco, 0.
export function recordTime(r: any): number {
  if (typeof r?._updatedAt === 'number') return r._updatedAt;
  if (r?.created_at) {
    const t = Date.parse(r.created_at);
    if (!isNaN(t)) return t;
  }
  return 0;
}

// Merge puro de dos estados (last-write-wins por registro).
// Un registro queda borrado si hay una lápida con deletedAt >= su _updatedAt.
// Si el registro se editó después de borrarlo, "revive" (gana el registro).
export function mergeStates(a: SyncState, b: SyncState): SyncState {
  const tombstones: Record<string, TombstoneLite> = {};
  for (const src of [a.tombstones || {}, b.tombstones || {}]) {
    for (const [key, tomb] of Object.entries(src)) {
      if (!tombstones[key] || tomb.deletedAt > tombstones[key].deletedAt) {
        tombstones[key] = tomb;
      }
    }
  }

  const tables: Record<string, any[]> = {};
  for (const t of SYNC_TABLES) {
    const byId = new Map<number, any>();
    for (const src of [a.tables?.[t] || [], b.tables?.[t] || []]) {
      for (const rec of src) {
        const existing = byId.get(rec.id);
        if (!existing || recordTime(rec) > recordTime(existing)) {
          byId.set(rec.id, rec);
        }
      }
    }
    const alive: any[] = [];
    for (const rec of byId.values()) {
      const tomb = tombstones[`${t}:${rec.id}`];
      if (tomb && tomb.deletedAt >= recordTime(rec)) continue; // borrado gana
      alive.push(rec);
    }
    tables[t] = alive;
  }

  // Limpiar lápidas superadas por una resurrección
  for (const [key, tomb] of Object.entries(tombstones)) {
    const rec = tables[tomb.table]?.find((r: any) => r.id === tomb.recordId);
    if (rec && recordTime(rec) > tomb.deletedAt) delete tombstones[key];
  }

  return { tables, tombstones };
}
