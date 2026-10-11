import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'installPromptDismissed9506';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY));
    const recentlyDismissed = Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS;

    if (isStandalone || recentlyDismissed) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    const timer = window.setTimeout(() => setShowPrompt(true), 3000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
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
            <h3 className="mb-1 text-lg font-semibold text-white">Install Kristal Streams</h3>
            <p className="text-sm text-gray-400">Get the full app experience with faster access from your device.</p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-1.5 w-1.5 rounded-full bg-primary" /><span>Kristal Streams build 9506</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-1.5 w-1.5 rounded-full bg-primary" /><span>Android, Firestick, and Android TV</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-300"><div className="h-1.5 w-1.5 rounded-full bg-primary" /><span>Direct verified APK download</span></div>
        </div>

        {isIOS ? (
          <div className="rounded-lg bg-dark-200 p-4 text-sm text-gray-300">
            <p className="mb-2 font-semibold text-white">To install on iOS:</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Tap the Share button (square with arrow)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button onClick={handleDismiss} className="flex-1 rounded-lg bg-dark-200 px-4 py-2.5 font-medium text-white transition-colors hover:bg-dark-300">Not Now</button>
              {deferredPrompt && (
                <button onClick={() => void handleInstall()} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-dark-200 px-4 py-2.5 font-medium text-white transition-colors hover:bg-dark-300">Web App</button>
              )}
              <a href="/downloads/KristalStreams.apk" download onClick={handleDismiss} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700"><Download size={18} />Get APK</a>
            </div>
            <p className="text-center text-xs text-gray-500">APK installs directly — allow "unknown sources" if prompted</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
