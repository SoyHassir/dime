import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/index.css"
import App from './App.jsx'

// Log temprano para verificar que el código se ejecuta
console.log('🚀 DIME iniciando...', {
  hostname: window.location.hostname,
  origin: window.location.origin,
  isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
