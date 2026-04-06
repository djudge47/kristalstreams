import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import './index.css';

const App = lazy(() => import('./App'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered:', registration);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <App />
    </Suspense>
  </StrictMode>
);