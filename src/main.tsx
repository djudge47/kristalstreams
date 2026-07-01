import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Application startup error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-white">
          <div className="max-w-md text-center">
            <h1 className="mb-3 text-2xl font-semibold">Kristal Streams could not load</h1>
            <p className="mb-6 text-gray-300">Please refresh the page. If this continues, the preview configuration needs attention.</p>
            <button onClick={() => window.location.reload()} className="rounded-lg bg-red-600 px-6 py-3 font-medium hover:bg-red-700">Refresh Page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const isProductionSite = ['kristalstream.com', 'www.kristalstream.com'].includes(window.location.hostname);

if ('serviceWorker' in navigator && isProductionSite) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found');

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
