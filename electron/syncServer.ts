// ============================================================
// SERVIDOR DE SINCRONIZACIÓN (corre en el proceso main de Electron)
// La PC es el "punto de encuentro": mantiene el estado canónico en
// un archivo en disco y expone una API HTTP en la red local. Tanto
// la app de la PC como el iPhone son clientes que sincronizan acá.
// Sin dependencias externas: usa el módulo http nativo de Node.
// ============================================================
import http, { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, normalize, extname } from 'path';
import { randomBytes } from 'crypto';
import * as os from 'os';
import { mergeStates, SyncState } from '../db/mergeCore';

const PORT = 8787;

let storePath = '';
let token = '';
let distDir = '';
let server: http.Server | null = null;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.webmanifest': 'application/manifest+json',
};

// Sirve los archivos estáticos del build (la PWA) al iPhone. Hace fallback
// a index.html para que funcione el routing del lado del cliente (HashRouter).
function serveStatic(_req: http.IncomingMessage, res: http.ServerResponse, urlPath: string): boolean {
  if (!distDir) return false;
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  // Evitar path traversal
  const filePath = normalize(join(distDir, rel));
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403); res.end('Forbidden'); return true;
  }
  let target = filePath;
  if (!existsSync(target) || !statSync(target).isFile()) {
    target = join(distDir, 'index.html'); // SPA fallback
    if (!existsSync(target)) return false;
  }
  const data = readFileSync(target);
  res.writeHead(200, {
    'Content-Type': MIME[extname(target).toLowerCase()] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(data);
  return true;
}

function emptyState(): SyncState {
  return { tables: {}, tombstones: {} };
}

function loadStore(): SyncState {
  try {
    if (existsSync(storePath)) {
      return JSON.parse(readFileSync(storePath, 'utf-8'));
    }
  } catch (e) {
    console.error('[syncServer] error leyendo store:', e);
  }
  return emptyState();
}

function saveStore(state: SyncState) {
  try {
    writeFileSync(storePath, JSON.stringify(state), 'utf-8');
  } catch (e) {
    console.error('[syncServer] error guardando store:', e);
  }
}

// Primera IPv4 no interna (para mostrar en el QR al iPhone)
export function getLocalIp(): string {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function isLocalhost(req: http.IncomingMessage): boolean {
  const addr = req.socket.remoteAddress || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}

function sendJson(res: http.ServerResponse, status: number, body: any) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-sync-token',
  });
  res.end(data);
}

export function getSyncInfo() {
  return { ip: getLocalIp(), port: PORT, token, url: `http://${getLocalIp()}:${PORT}` };
}

export function startSyncServer(userDataDir: string, distDirectory?: string) {
  if (server) return getSyncInfo();
  storePath = join(userDataDir, 'sync-store.json');
  distDir = distDirectory ? normalize(distDirectory) : '';
  token = randomBytes(8).toString('hex');

  server = createServer((req, res) => {
    // Preflight CORS
    if (req.method === 'OPTIONS') {
      sendJson(res, 200, { ok: true });
      return;
    }

    const url = (req.url || '').split('?')[0];

    // Health check / descubrimiento (sin token)
    if (req.method === 'GET' && url === '/ping') {
      sendJson(res, 200, { ok: true, app: 'carnilab' });
      return;
    }

    if (req.method === 'POST' && url === '/sync') {
      // Auth: localhost (la PC) no necesita token; el resto sí
      if (!isLocalhost(req)) {
        const provided = req.headers['x-sync-token'];
        if (provided !== token) {
          sendJson(res, 401, { error: 'Token inválido. Volvé a emparejar escaneando el QR.' });
          return;
        }
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const clientState: SyncState = body ? JSON.parse(body) : emptyState();
          const current = loadStore();
          const merged = mergeStates(current, clientState);
          saveStore(merged);
          sendJson(res, 200, merged);
        } catch (e: any) {
          console.error('[syncServer] error en /sync:', e);
          sendJson(res, 400, { error: e?.message || 'Error procesando sync' });
        }
      });
      return;
    }

    // Cualquier otra ruta GET: servir la PWA (el build) al iPhone
    if (req.method === 'GET' && serveStatic(req, res, req.url || '/')) {
      return;
    }

    sendJson(res, 404, { error: 'No encontrado' });
  });

  server.on('error', (e) => console.error('[syncServer] error:', e));
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[syncServer] escuchando en http://${getLocalIp()}:${PORT} (token ${token})`);
  });

  return getSyncInfo();
}
