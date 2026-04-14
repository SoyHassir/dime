import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/index.css"
import App from './App.jsx'

// PWA: fuerza actualización del Service Worker para evitar caché “viejo”
// (especialmente útil en QA / previews).
if (import.meta.env.MODE !== 'development') {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
