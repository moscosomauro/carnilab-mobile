// Prueba del merge de sincronización (función pura, sin IndexedDB)
// Replica la lógica de db/sync.ts:mergeStates para verificarla en node.

const TABLES = ['plants', 'crosses', 'alerts', 'diary', 'climate', 'seedbank'];

function recordTime(r) {
  if (typeof r?._updatedAt === 'number') return r._updatedAt;
  if (r?.created_at) { const t = Date.parse(r.created_at); if (!isNaN(t)) return t; }
  return 0;
}

function mergeStates(a, b) {
  const tombstones = {};
  for (const src of [a.tombstones || {}, b.tombstones || {}]) {
    for (const [key, tomb] of Object.entries(src)) {
      if (!tombstones[key] || tomb.deletedAt > tombstones[key].deletedAt) tombstones[key] = tomb;
    }
  }
  const tables = {};
  for (const t of TABLES) {
    const byId = new Map();
    for (const src of [a.tables?.[t] || [], b.tables?.[t] || []]) {
      for (const rec of src) {
        const ex = byId.get(rec.id);
        if (!ex || recordTime(rec) > recordTime(ex)) byId.set(rec.id, rec);
      }
    }
    const alive = [];
    for (const rec of byId.values()) {
      const tomb = tombstones[`${t}:${rec.id}`];
      if (tomb && tomb.deletedAt >= recordTime(rec)) continue;
      alive.push(rec);
    }
    tables[t] = alive;
  }
  for (const [key, tomb] of Object.entries(tombstones)) {
    const rec = tables[tomb.table]?.find(r => r.id === tomb.recordId);
    if (rec && recordTime(rec) > tomb.deletedAt) delete tombstones[key];
  }
  return { tables, tombstones };
}

const empty = () => ({ tables: {}, tombstones: {} });
let pass = 0, fail = 0;
const check = (n, c) => { if (c) { pass++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n); } };
const plants = (s) => (s.tables.plants || []).map(p => p.id + ':' + p.nombre).sort();

// 1) Union de dispositivos distintos
let A = { tables: { plants: [{ id: 1, nombre: 'Saurus', _updatedAt: 100 }] }, tombstones: {} };
let B = { tables: { plants: [{ id: 2, nombre: 'B52', _updatedAt: 100 }] }, tombstones: {} };
let m = mergeStates(A, B);
check('une plantas de ambos dispositivos', JSON.stringify(plants(m)) === JSON.stringify(['1:Saurus', '2:B52']));

// 2) LWW: gana la edición más reciente
A = { tables: { plants: [{ id: 1, nombre: 'Viejo', _updatedAt: 100 }] }, tombstones: {} };
B = { tables: { plants: [{ id: 1, nombre: 'Nuevo', _updatedAt: 200 }] }, tombstones: {} };
m = mergeStates(A, B);
check('LWW: gana el _updatedAt mayor (Nuevo)', m.tables.plants[0].nombre === 'Nuevo');

// 3) Borrado se propaga (tombstone más nuevo que el record)
A = { tables: { plants: [{ id: 1, nombre: 'Saurus', _updatedAt: 100 }] }, tombstones: {} };
B = { tables: { plants: [] }, tombstones: { 'plants:1': { key: 'plants:1', table: 'plants', recordId: 1, deletedAt: 200 } } };
m = mergeStates(A, B);
check('borrado se propaga (planta desaparece)', (m.tables.plants || []).length === 0);
check('la lápida se conserva', !!m.tombstones['plants:1']);

// 4) Resurrección: edición posterior al borrado gana
A = { tables: { plants: [{ id: 1, nombre: 'Reeditado', _updatedAt: 300 }] }, tombstones: {} };
B = { tables: { plants: [] }, tombstones: { 'plants:1': { key: 'plants:1', table: 'plants', recordId: 1, deletedAt: 200 } } };
m = mergeStates(A, B);
check('resurrección: edición posterior al borrado gana', (m.tables.plants || []).length === 1);
check('lápida superada se descarta', !m.tombstones['plants:1']);

// 5) Fallback a created_at cuando no hay _updatedAt
A = { tables: { plants: [{ id: 1, nombre: 'Importado', created_at: '2026-01-01T00:00:00Z' }] }, tombstones: {} };
B = { tables: { plants: [{ id: 1, nombre: 'EditadoLocal', _updatedAt: Date.parse('2026-02-01T00:00:00Z') }] }, tombstones: {} };
m = mergeStates(A, B);
check('usa created_at como fallback y gana el más nuevo', m.tables.plants[0].nombre === 'EditadoLocal');

// 6) Idempotencia: merge(merge(A,B), B) == merge(A,B)
const m1 = mergeStates(A, B);
const m2 = mergeStates(m1, B);
check('merge idempotente', JSON.stringify(plants(m1)) === JSON.stringify(plants(m2)));

// 7) Estado vacío no rompe
m = mergeStates(empty(), empty());
check('estados vacíos no rompen', (m.tables.plants || []).length === 0);

console.log(`\n${pass} pasaron, ${fail} fallaron`);
process.exit(fail ? 1 : 0);
