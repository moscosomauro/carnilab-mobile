// Prueba de la capa IndexedDB (Dexie) con un IndexedDB simulado
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

// Replicamos el esquema de db/localDb.ts (no importamos el .ts directo desde node)
const db = new Dexie('carnilab');
db.version(1).stores({
  plants: 'id', crosses: 'id', alerts: 'id', diary: 'id', climate: 'id', seedbank: 'id',
});

const ALL = ['plants', 'crosses', 'alerts', 'diary', 'climate', 'seedbank'];

async function saveTable(key, items) {
  const table = db[key];
  await db.transaction('rw', table, async () => {
    await table.clear();
    if (items.length) await table.bulkPut(items);
  });
}
async function loadTable(key) { return db[key].toArray(); }
async function clearAllData() {
  const tables = ALL.map(t => db[t]);
  await db.transaction('rw', tables, async () => { await Promise.all(tables.map(t => t.clear())); });
}

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('  ✅', name); } else { fail++; console.log('  ❌', name); } };

// 1) Guardar y cargar
await saveTable('plants', [{ id: 1, nombre: 'Saurus' }, { id: 2, nombre: 'B52' }]);
let p = await loadTable('plants');
check('guarda y carga 2 plantas', p.length === 2);
check('preserva el id', p.find(x => x.id === 2)?.nombre === 'B52');

// 2) saveTable reemplaza (no acumula)
await saveTable('plants', [{ id: 3, nombre: 'Galaxy' }]);
p = await loadTable('plants');
check('saveTable reemplaza el contenido', p.length === 1 && p[0].id === 3);

// 3) Imagen base64 grande (simula foto local) — IndexedDB debe aguantar
const bigImg = 'data:image/jpeg;base64,' + 'A'.repeat(2 * 1024 * 1024); // ~2MB
await saveTable('plants', [{ id: 4, nombre: 'Foto', imagen: bigImg }]);
p = await loadTable('plants');
check('aguanta imagen de ~2MB (rompería localStorage)', p[0].imagen.length > 2_000_000);

// 4) clearAllData
await saveTable('crosses', [{ id: 1 }]);
await saveTable('diary', [{ id: 1 }]);
await clearAllData();
check('clearAllData borra todas las tablas',
  (await loadTable('plants')).length === 0 &&
  (await loadTable('crosses')).length === 0 &&
  (await loadTable('diary')).length === 0);

// 5) Cargar el restore real y verificar que entra completo
import { readFileSync } from 'fs';
const restore = JSON.parse(readFileSync(new URL('../carnilab_restore.json', import.meta.url), 'utf8'));
await saveTable('plants', restore.plants);
await saveTable('crosses', restore.crosses);
await saveTable('diary', restore.diary);
const loadedPlants = await loadTable('plants');
check(`importa las ${restore.plants.length} plantas del restore`, loadedPlants.length === restore.plants.length);
check('no hay B52 duplicada (id 18 borrada)', !loadedPlants.some(x => x.id === 18));

console.log(`\n${pass} pasaron, ${fail} fallaron`);
process.exit(fail ? 1 : 0);
