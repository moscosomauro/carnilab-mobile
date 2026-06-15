import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel: string, data: any) => {
        // whitelist channels
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
        let validChannels = ['fromMain', 'main-process-message'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
    // Info del servidor de sincronización local (IP, puerto, token) para el QR
    getSyncInfo: (): Promise<{ ip: string; port: number; token: string; url: string }> =>
        ipcRenderer.invoke('sync:getInfo'),
    isElectron: true,
});

console.log('Preload script loaded');
