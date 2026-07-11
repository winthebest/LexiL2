import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './lib/i18n.jsx'

// Dev: gắn lớp store Dexie vào window để chạy thử / di trú từ DevTools
// (vd: await greStore.migrateFromLocalStorage()) mà không cần rewire UI.
if (import.meta.env.DEV) {
  import('./lib/store/index.js').then((store) => {
    window.greStore = store
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((e) => {
      console.warn('[gre-l2 pwa] service worker registration failed:', e)
    })
  })
}
