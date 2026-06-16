import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VERCEL ? '/' : './',
  plugins: [
    react(),
    ...(process.env.VERCEL ? [] : [
      electron([
        {
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload()
          },
          // El preload se emite como ESM con extensión .mjs y se carga con
          // sandbox:false en main.ts. Con "type":"module" el bundle queda en
          // ESM (usa import); Electron solo acepta preload ESM si tiene .mjs y
          // el sandbox está desactivado. Sin esto no se expone
          // window.electronAPI y se rompe el QR de sincronización.
          vite: {
            build: {
              rollupOptions: {
                output: {
                  entryFileNames: '[name].mjs',
                },
              },
            },
          },
        },
      ]),
      renderer(),
    ]),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'carnibot.png'],
      manifest: {
        name: 'CarniLab',
        short_name: 'CarniLab',
        description: 'Gestor profesional de plantas carnívoras',
        theme_color: '#1a0f35',
        background_color: '#12122e',
        display: 'standalone',
        icons: [
          {
            src: 'carnibot.png', // Usamos tu icono personalizado
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'carnibot.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      injectManifest: {
        // Aumentar límite para bundles grandes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (antes 2 MB)
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    host: true
  }
})