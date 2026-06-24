import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any stale service workers and caches from previous deployments
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('Successfully unregistered stale service worker');
          }
        });
      }
    }).catch((err) => {
      console.error('Error unregistering stale service worker:', err);
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name).then((success) => {
          if (success) {
            console.log(`Successfully deleted stale cache storage: ${name}`);
          }
        });
      }
    }).catch((err) => {
      console.error('Error clearing cache storage:', err);
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
