import { app, BrowserWindow, screen, ipcMain, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startSyncServer, getSyncInfo } from './syncServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

// En Windows el toast nativo necesita un AppUserModelID que coincida con el de
// la instalación (appId del build) para mostrar el nombre/ícono de la app y no
// "electron.app.Electron". Debe fijarse antes de crear notificaciones.
if (process.platform === 'win32') {
    app.setAppUserModelId('com.carnilab.app');
}


let win: BrowserWindow | null;
// ⚡️ Serving from Vite dev server during development
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    win = new BrowserWindow({
        width: Math.floor(width * 0.9),
        height: Math.floor(height * 0.9),
        icon: path.join(process.env.VITE_PUBLIC || '', 'assets/icons/brand-logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // necesario para cargar el preload ESM (.mjs)
        },
        backgroundColor: '#F5F1EB',
        show: false, // Don't show until ready
    });

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST || '', 'index.html'));
    }

    win.once('ready-to-show', () => {
        win?.show();
        win?.maximize();
    });

    win.on('closed', () => {
        win = null;
    });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        win = null;
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Exponer info del servidor de sync al renderer (para mostrar el QR)
ipcMain.handle('sync:getInfo', () => getSyncInfo());

// Notificación nativa de Windows (Fase 5). El renderer dispara el toast cuando
// vence una alerta; al hacer click traemos la ventana al frente.
ipcMain.on('notify:show', (_event, payload: { title: string; body: string; tag?: string }) => {
    if (!Notification.isSupported()) return;
    try {
        const n = new Notification({
            title: payload?.title || 'CarniLab',
            body: payload?.body || '',
            icon: path.join(process.env.VITE_PUBLIC || '', 'brand-logo.png'),
            silent: false,
        });
        n.on('click', () => {
            if (win) {
                if (win.isMinimized()) win.restore();
                win.show();
                win.focus();
            }
        });
        n.show();
    } catch (e) {
        console.error('No se pudo mostrar la notificación nativa:', e);
    }
});

app.whenReady().then(() => {
  // Arrancar el servidor de sincronización local (Wi-Fi)
  try {
    startSyncServer(app.getPath('userData'), process.env.DIST);
  } catch (e) {
    console.error('No se pudo iniciar el servidor de sync:', e);
  }
  createWindow();
});
