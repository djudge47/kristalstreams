import React, { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';


const DISMISS_KEY = 'installPromptDismissed9506';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    let dismissedAt = 0;
    try { dismissedAt = Number(localStorage.getItem(DISMISS_KEY)); } catch { /* Setup help stays usable when storage is blocked. */ }
    const recentlyDismissed = Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS;
    if (isStandalone || recentlyDismissed) return;
    const timer = window.setTimeout(() => setShowPrompt(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* Dismissing must still work. */ }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:bottom-4 md:left-auto md:right-4 md:w-96">
      <div className="rounded-xl border border-gray-800 bg-dark-100 p-5 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-white"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-start gap-4">
          <div className="rounded-lg bg-primary/20 p-3">
            <Smartphone className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-semibold text-white">Apps &amp; Device Setup</h3>
            <p className="text-sm text-gray-400">Keep your existing streaming app. Find device setup help or add a website shortcut.</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-gray-300">Already installed? Keep your current app and saved users.</p>
        <div className="flex gap-2">
          <button onClick={handleDismiss} className="flex-1 rounded-lg bg-dark-200 px-4 py-2.5 font-medium text-white transition-colors hover:bg-dark-300">Not Now</button>
          <Link to="/download-app" onClick={handleDismiss} className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700">Setup Help</Link>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
