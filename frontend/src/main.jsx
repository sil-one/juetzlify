import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DownloadsProvider } from './contexts/DownloadsContext'

// Register Service Worker for offline support and audio caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/audio-cache-sw.js')
      .then((registration) => {
        console.log('[Jützlify] Service Worker registered:', registration.scope);

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('[Jützlify] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DownloadsProvider>
      <App />
    </DownloadsProvider>
  </StrictMode>,
)
