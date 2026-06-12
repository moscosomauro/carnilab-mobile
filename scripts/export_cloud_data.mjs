// Fase 0: Rescate completo de datos de Supabase + Cloudinary
// Uso: node scripts/export_cloud_data.mjs
// Exporta todas las tablas a cloud_backup/data/*.json y descarga
// todas las imágenes referenciadas a cloud_backup/images/

import { createClient } from '@supabase/supabase-js';
import { readFileSync, mkdirSync, writeFileSync, existsSync, createWriteStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'cloud_backup');
const DATA_DIR = join(OUT_DIR, 'data');
const IMG_DIR = join(OUT_DIR, 'images');

// --- Leer .env manualmente ---
const env = {};
for (const line of readFileSync(join(ROOT, '.env'), 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}
console.log(`🔌 Conectando a ${SUPABASE_URL}`);
console.log(`🔑 Usando key: ${env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(IMG_DIR, { recursive: true });

// --- Todas las tablas conocidas de la app ---
const TABLES = [
  'plants', 'crosses', 'alerts', 'diary', 'climate_logs', 'seed_bank',
  'inbox_messages', 'plant_images', 'access_keys', 'user_backups',
  'profiles', 'conversations', 'messages', 'avatars',
  'shop', 'shop_products', 'shop_orders',
  'plans', 'system_messages', 'global_settings',
  'push_subscriptions', 'user_push_subscriptions', 'cross_analyses',
];

const PAGE = 1000;
const summary = [];

async function exportTable(table) {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE - 1);
    if (error) {
      return { table, status: 'ERROR', detail: error.message, rows: 0 };
    }
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  writeFileSync(join(DATA_DIR, `${table}.json`), JSON.stringify(all, null, 2), 'utf-8');
  return { table, status: 'OK', rows: all.length };
}

console.log('\n📦 Exportando tablas...');
for (const t of TABLES) {
  const r = await exportTable(t);
  summary.push(r);
  console.log(`  ${r.status === 'OK' ? '✅' : '⚠️ '} ${t}: ${r.status === 'OK' ? r.rows + ' filas' : r.detail}`);
}

// --- Storage de Supabase: listar y descargar buckets ---
console.log('\n🗄️  Revisando Supabase Storage...');
const storageFiles = [];
try {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  for (const bucket of buckets || []) {
    console.log(`  Bucket: ${bucket.name}`);
    async function walk(prefix) {
      const { data: items, error: e } = await supabase.storage.from(bucket.name).list(prefix, { limit: 1000 });
      if (e) { console.log(`    ⚠️  ${prefix}: ${e.message}`); return; }
      for (const item of items || []) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) { await walk(path); } // carpeta
        else storageFiles.push({ bucket: bucket.name, path });
      }
    }
    await walk('');
  }
} catch (e) {
  console.log(`  ⚠️  No se pudieron listar buckets (${e.message}). Se descargarán solo URLs encontradas en los datos.`);
}

// --- Recolectar URLs de imágenes dentro de los datos exportados ---
const URL_RE = /https?:\/\/[^\s"'\\]+\.(?:jpg|jpeg|png|webp|gif|avif)[^\s"'\\]*/gi;
const CLOUD_OR_SUPA = /(res\.cloudinary\.com|supabase\.co\/storage)/i;
const urls = new Set();

function scan(value) {
  if (typeof value === 'string') {
    const matches = value.match(URL_RE);
    if (matches) for (const u of matches) if (CLOUD_OR_SUPA.test(u)) urls.add(u);
  } else if (Array.isArray(value)) value.forEach(scan);
  else if (value && typeof value === 'object') Object.values(value).forEach(scan);
}

for (const r of summary) {
  if (r.status !== 'OK') continue;
  scan(JSON.parse(readFileSync(join(DATA_DIR, `${r.table}.json`), 'utf-8')));
}
console.log(`\n🖼️  ${urls.size} URLs de imágenes encontradas en los datos, ${storageFiles.length} archivos en Storage.`);

// --- Descargas ---
function safeName(s) {
  return s.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
}

let ok = 0, fail = 0, skipped = 0;
const failures = [];

async function download(url, dest) {
  if (existsSync(dest)) { skipped++; return; }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    ok++;
  } catch (e) {
    fail++;
    failures.push({ url, error: e.message });
  }
}

console.log('⬇️  Descargando imágenes de URLs...');
const urlList = [...urls];
for (let i = 0; i < urlList.length; i += 5) {
  await Promise.all(urlList.slice(i, i + 5).map(u => download(u, join(IMG_DIR, safeName(u)))));
  if ((i / 5) % 20 === 0) process.stdout.write(`  ${Math.min(i + 5, urlList.length)}/${urlList.length}\r`);
}

console.log('\n⬇️  Descargando archivos de Storage...');
for (let i = 0; i < storageFiles.length; i += 5) {
  await Promise.all(storageFiles.slice(i, i + 5).map(async f => {
    const { data } = supabase.storage.from(f.bucket).getPublicUrl(f.path);
    return download(data.publicUrl, join(IMG_DIR, safeName(`${f.bucket}_${f.path}`)));
  }));
}

// --- Mapa URL -> archivo local (para la migración posterior) ---
const urlMap = {};
for (const u of urlList) urlMap[u] = `images/${safeName(u)}`;
for (const f of storageFiles) {
  const { data } = supabase.storage.from(f.bucket).getPublicUrl(f.path);
  urlMap[data.publicUrl] = `images/${safeName(`${f.bucket}_${f.path}`)}`;
}
writeFileSync(join(OUT_DIR, 'image_url_map.json'), JSON.stringify(urlMap, null, 2), 'utf-8');

// --- Resumen final ---
writeFileSync(join(OUT_DIR, 'export_summary.json'), JSON.stringify({
  date: new Date().toISOString(),
  supabaseUrl: SUPABASE_URL,
  tables: summary,
  images: { downloaded: ok, skipped, failed: fail, failures },
}, null, 2), 'utf-8');

console.log('\n========== RESUMEN ==========');
for (const r of summary) console.log(`  ${r.status === 'OK' ? '✅' : '⚠️ '} ${r.table}: ${r.status === 'OK' ? r.rows + ' filas' : r.detail}`);
console.log(`  🖼️  Imágenes: ${ok} descargadas, ${skipped} ya existían, ${fail} fallidas`);
if (failures.length) console.log('  Fallidas (ver export_summary.json):', failures.slice(0, 5).map(f => f.url));
console.log(`\n💾 Todo guardado en: ${OUT_DIR}`);
