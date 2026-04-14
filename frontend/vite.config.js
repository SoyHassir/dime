import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appVersion = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8')).version

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || ''
  let buildId = 'dev'
  try {
    buildId = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    // buildId se queda como 'dev'
  }
  // Solo modo qa: en Firebase no existe "localhost" del servidor; .env.local suele romper el deploy
  if (mode === 'qa') {
    const invalid =
      !backendUrl ||
      /localhost|127\.0\.0\.1/i.test(backendUrl)
    if (invalid) {
      throw new Error(
        '[Vite] modo qa: VITE_BACKEND_URL debe ser la URL publica de Cloud Run (https://....run.app), no localhost.\n' +
          'Nota: .env.local pisa a .env.qa; usa frontend/.env.qa.local con la URL, o quita localhost de .env.local.\n' +
          'Ver docs/DEPLOY_QA.md'
      )
    }
  }

  return {
  define: {
    __DIME_BUILD_ID__: JSON.stringify(buildId),
    __DIME_APP_VERSION__: JSON.stringify(appVersion),
  },
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
  }
})
