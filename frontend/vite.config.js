import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // NO eliminar console.log en producción para debugging
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['dime-icon.png'],
      manifest: {
        name: 'DIME - Directorio Interactivo Multimodal Estratégico',
        short_name: 'DIME',
        description: 'Directorio interactivo de entidades públicas de Santiago de Tolú',
        theme_color: '#1c528b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/dime-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/dime-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Excluir los iconos de Leaflet del precache para que se carguen directamente desde el servidor
        globIgnores: ['**/leaflet-icons/**'],
        // Forzar actualización del service worker para evitar cacheo de versiones viejas
        skipWaiting: true,
        clientsClaim: true,
        // No interceptar requests a archivos estáticos que no están en precache
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/leaflet-icons\//, /^\/assets\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.run\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dime-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NO cachear los iconos de Leaflet - cargarlos siempre desde el servidor
            urlPattern: /\/leaflet-icons\/.*\.png$/,
            handler: 'NetworkOnly',
            options: {
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Expone el servidor en la red (0.0.0.0)
    port: 5173,
  },
})
