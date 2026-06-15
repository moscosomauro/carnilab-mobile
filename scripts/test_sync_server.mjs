// Prueba end-to-end del servidor de sync por HTTP real.
// Levanta un servidor equivalente al de electron/syncServer.ts (merge desde
// db/mergeCore) y simula dos dispositivos (PC e iPhone) sincronizando.
import { createServer } from 'http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { mergeStates } from '../db/mergeCore.ts';

const storePath = join(mkdtempSync(join(tmpdir(), 'carni-')), 'store.json');
const empty = () => ({ tables: {}, tombstones: {} });
const load = () => existsSync(storePath) ? JSON.parse(readFileSync(storePath, 'utf8')) : empty();
const save = (s) => writeFileSync(storePath, JSON.stringify(s));

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/sync') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const client = body ? JSON.parse(body) : empty();
      const merged = mergeStates(load(), client);
      save(merged);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(merged));
    });
  } else { res.writeHead(404); res.end(); }
});

let pass = 0, fail = 0;
const check = (n, c) => { if (c) { pass++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n); } };

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const sync = async (state) => {
  const res = await fetch(`http://localhost:${port}/sync`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
  });
  return res.json();
};

// PC sube 1 planta
let pc = await sync({ tables: { plants: [{ id: 1, nombre: 'Saurus', _updatedAt: 100 }] }, tombstones: {} });
check('PC sube su planta', pc.tables.plants.length === 1);

// iPhone sube otra planta y recibe la de la PC
let phone = await sync({ tables: { plants: [{ id: 2, nombre: 'B52', _updatedAt: 110 }] }, tombstones: {} });
check('iPhone recibe ambas plantas (merge en server)', phone.tables.plants.length === 2);

// PC vuelve a sincronizar (vacío salvo lo suyo) y ahora ve la del iPhone
pc = await sync({ tables: { plants: [{ id: 1, nombre: 'Saurus', _updatedAt: 100 }] }, tombstones: {} });
check('PC ahora también ve la planta del iPhone', pc.tables.plants.length === 2);

// iPhone edita la planta 1 (más nuevo) -> gana
phone = await sync({ tables: { plants: [{ id: 1, nombre: 'Saurus EDIT', _updatedAt: 500 }] }, tombstones: {} });
check('edición del iPhone (LWW) se refleja', phone.tables.plants.find(p => p.id === 1).nombre === 'Saurus EDIT');

// PC borra la planta 2 (tombstone) -> se propaga
pc = await sync({ tables: { plants: [] }, tombstones: { 'plants:2': { key: 'plants:2', table: 'plants', recordId: 2, deletedAt: 600 } } });
check('borrado de la PC se propaga (queda solo planta 1)', pc.tables.plants.length === 1 && pc.tables.plants[0].id === 1);

server.close();
console.log(`\n${pass} pasaron, ${fail} fallaron`);
process.exit(fail ? 1 : 0);
