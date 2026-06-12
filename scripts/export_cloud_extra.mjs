// Fase 0b: verificación RLS + imágenes del backup + bucket plant-images
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'cloud_backup');
const IMG_DIR = join(OUT_DIR, 'images');

const env = {};
for (const line of readFileSync(join(ROOT, '.env'), 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2];
}
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const OWNER = 'KEY-PMO5M4';

// 1) ¿RLS o tablas vacías? Probar con filtro de owner y con count
console.log('🔍 Verificando diary/crosses/alerts/seed_bank con owner_key...');
for (const t of ['diary', 'crosses', 'alerts', 'seed_bank', 'climate_logs']) {
  const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
  const { count: cOwner } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('owner_key', OWNER);
  console.log(`  ${t}: total visible=${error ? 'ERR ' + error.message : count}, con owner_key=${cOwner}`);
}

// 2) Listar bucket plant-images directamente por nombre
console.log('\n🗄️  Listando bucket plant-images...');
const storageFiles = [];
async function walk(prefix) {
  const { data: items, error } = await supabase.storage.from('plant-images').list(prefix, { limit: 1000 });
  if (error) { console.log(`  ⚠️  list('${prefix}'): ${error.message}`); return; }
  for (const item of items || []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) await walk(path);
    else storageFiles.push(path);
  }
}
await walk('');
console.log(`  ${storageFiles.length} archivos encontrados en plant-images`);

// 3) URLs dentro del backup extraído
const URL_RE = /https?:\/\/[^\s"'\\]+/gi;
const IMG_HOST = /(res\.cloudinary\.com|supabase\.co\/storage)/i;
const urls = new Set();
function scan(v) {
  if (typeof v === 'string') { (v.match(URL_RE) || []).forEach(u => { if (IMG_HOST.test(u)) urls.add(u); }); }
  else if (Array.isArray(v)) v.forEach(scan);
  else if (v && typeof v === 'object') Object.values(v).forEach(scan);
}
scan(JSON.parse(readFileSync(join(OUT_DIR, 'data', '_backup_extracted.json'), 'utf-8')));
console.log(`\n🖼️  ${urls.size} URLs de imágenes dentro del backup`);

// 4) Descargar todo lo nuevo
function safeName(s) { return s.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180); }
const targets = new Map();
for (const u of urls) targets.set(u, join(IMG_DIR, safeName(u)));
for (const p of storageFiles) {
  const { data } = supabase.storage.from('plant-images').getPublicUrl(p);
  targets.set(data.publicUrl, join(IMG_DIR, safeName(`plant-images_${p}`)));
}

let ok = 0, fail = 0, skipped = 0;
const failures = [];
const entries = [...targets.entries()];
for (let i = 0; i < entries.length; i += 5) {
  await Promise.all(entries.slice(i, i + 5).map(async ([url, dest]) => {
    if (existsSync(dest)) { skipped++; return; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (e) { fail++; failures.push({ url, error: e.message }); }
  }));
}
console.log(`⬇️  Imágenes: ${ok} nuevas, ${skipped} ya existían, ${fail} fallidas`);
if (failures.length) console.log('  Primeras fallidas:', failures.slice(0, 5));

// Actualizar mapa URL->archivo
const mapPath = join(OUT_DIR, 'image_url_map.json');
const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf-8')) : {};
for (const [url, dest] of entries) map[url] = 'images/' + dest.split(/[\\/]/).pop();
writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf-8');
writeFileSync(join(OUT_DIR, 'storage_files.json'), JSON.stringify(storageFiles, null, 2), 'utf-8');
console.log('✅ Listo');
