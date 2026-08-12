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

// Older Android/WebView builds used a mixture of hash routes and short client paths.
// Normalize those addresses before React Router starts so taps open the intended page
// instead of falling through to the app's initial screen.
const legacyPathMap: Record<string, string> = {
  '/account': '/client/account',
  '/subscription': '/client/subscription',
  '/devices': '/client/devices',
  '/history': '/client/history',
  '/security': '/client/security',
  '/settings': '/client/settings',
  '/support-history': '/client/support',
  '/support-tickets': '/client/support',
  '/new-ticket': '/client/support/new',
  '/tickets/new': '/client/support/new',
  '/downloads': '/download-app',
  '/get-app': '/download-app',
  '/plans': '/pricing',
  '/trial': '/free-trial',
};

const normalizeLegacyNavigation = () => {
  let requestedPath = window.location.pathname;
  let requestedSearch = window.location.search;

  if (window.location.hash.startsWith('#/')) {
    const hashRoute = window.location.hash.slice(1);
    const queryIndex = hashRoute.indexOf('?');
    requestedPath = queryIndex >= 0 ? hashRoute.slice(0, queryIndex) : hashRoute;
    requestedSearch = queryIndex >= 0 ? hashRoute.slice(queryIndex) : '';
  }

  const normalizedPath = legacyPathMap[requestedPath] ?? requestedPath;
  const needsRewrite =
    normalizedPath !== window.location.pathname ||
    requestedSearch !== window.location.search ||
    window.location.hash.startsWith('#/');

  if (needsRewrite) {
    window.history.replaceState({}, '', `${normalizedPath}${requestedSearch}`);
  }
};

normalizeLegacyNavigation();

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
