// ============================================================
// BASE DE DATOS LOCAL - IndexedDB vía Dexie
// Reemplaza a localStorage como almacenamiento principal.
// IndexedDB aguanta cientos de MB, así que las fotos se pueden
// guardar embebidas (data URL) dentro de cada registro sin
// reventar el almacenamiento como pasaba con localStorage (~5MB).
// Funciona igual en la PWA del iPhone y en Electron (PC).
// ============================================================
import Dexie, { Table } from 'dexie';
import { Plant, Cross, Alert, DiaryEntry, ClimateLog, SeedBatch } from '../types';

// Lápida de un registro borrado: permite propagar el borrado a otros
// dispositivos durante la sincronización (si solo lo elimináramos, el otro
// dispositivo lo volvería a agregar en el próximo sync).
export interface Tombstone {
  key: string;        // `${table}:${id}`
  table: string;
  recordId: number;
  deletedAt: number;  // ms
}

class CarniLabDB extends Dexie {
  plants!: Table<Plant, number>;
  crosses!: Table<Cross, number>;
  alerts!: Table<Alert, number>;
  diary!: Table<DiaryEntry, number>;
  climate!: Table<ClimateLog, number>;
  seedbank!: Table<SeedBatch, number>;
  tombstones!: Table<Tombstone, string>;

  constructor() {
    super('carnilab');
    // La clave primaria es 'id' (number) en todas las tablas de datos.
    this.version(1).stores({
      plants: 'id',
      crosses: 'id',
      alerts: 'id',
      diary: 'id',
      climate: 'id',
      seedbank: 'id',
    });
    // v2: tabla de lápidas para sincronización (Fase 4)
    this.version(2).stores({
      tombstones: 'key',
    });
  }
}

export const db = new CarniLabDB();

// Las claves coinciden con las que usaba saveToLocal/loadFromLocal en AppContext
export type TableKey = 'plants' | 'crosses' | 'alerts' | 'diary' | 'climate' | 'seedbank';

const ALL_TABLES: TableKey[] = ['plants', 'crosses', 'alerts', 'diary', 'climate', 'seedbank'];

export async function loadTable<T>(key: TableKey): Promise<T[]> {
  return (await (db as any)[key].toArray()) as T[];
}

// Sincroniza la tabla con el array dado (atómico): reemplaza todo el contenido.
// Para decenas/cientos de registros es instantáneo.
export async function saveTable<T>(key: TableKey, items: T[]): Promise<void> {
  const table = (db as any)[key];
  await db.transaction('rw', table, async () => {
    await table.clear();
    if (items.length) await table.bulkPut(items);
  });
}

const MIGRATION_FLAG = 'idb_migrated_v1';

// Migración única: mueve los datos guardados en localStorage (era el
// almacenamiento de las fases anteriores) a IndexedDB. Se ejecuta una sola vez.
export async function migrateFromLocalStorage(userKey: string): Promise<boolean> {
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return false;

  let migratedAny = false;
  for (const table of ALL_TABLES) {
    // En localStorage la clave de 'climate' era 'climate' y 'seedbank' era 'seedbank'
    const raw = localStorage.getItem(`${userKey}_${table}`);
    if (!raw) continue;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        await saveTable(table, arr);
        migratedAny = true;
      }
    } catch {
      /* dato corrupto: lo ignoramos */
    }
  }

  localStorage.setItem(MIGRATION_FLAG, 'true');
  return migratedAny;
}

// Borra todos los datos locales (usado por "borrar y reimportar limpio")
export async function clearAllData(): Promise<void> {
  const tables = [...ALL_TABLES.map(t => (db as any)[t]), db.tombstones];
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map(t => t.clear()));
  });
}

// --- Tombstones (sincronización) ---
export async function addTombstone(table: TableKey, recordId: number): Promise<void> {
  await db.tombstones.put({ key: `${table}:${recordId}`, table, recordId, deletedAt: Date.now() });
}

export async function loadTombstones(): Promise<Tombstone[]> {
  return db.tombstones.toArray();
}

export async function saveTombstones(items: Tombstone[]): Promise<void> {
  await db.transaction('rw', db.tombstones, async () => {
    await db.tombstones.clear();
    if (items.length) await db.tombstones.bulkPut(items);
  });
}
