import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    const hasBeenDismissed = localStorage.getItem('installPromptDismissed');

    if (!isStandalone && !hasBeenDismissed) {
      if (isIOSDevice) {
        setTimeout(() => setShowPrompt(true), 3000);
      } else {
        const handler = (e: Event) => {
          e.preventDefault();
          setDeferredPrompt(e as BeforeInstallPromptEvent);
          setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Android: show the prompt even if beforeinstallprompt never fires
        // (so the APK download option is still reachable)
        if (isAndroidDevice) {
          setTimeout(() => setShowPrompt(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
      }
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-dark-100 border border-gray-800 rounded-xl shadow-2xl p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="bg-primary/20 p-3 rounded-lg">
            <Smartphone className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              Install Kristal Streams
            </h3>
            <p className="text-gray-400 text-sm">
              Get the full app experience with offline access and faster loading
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span>Works offline with cached content</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span>Launch from home screen</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span>Receive push notifications</span>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-dark-200 p-4 rounded-lg text-sm text-gray-300">
            <p className="mb-2 font-semibold text-white">To install on iOS:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Tap the Share button (square with arrow)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right</li>
            </ol>
          </div>
        ) : isAndroid ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors font-medium"
              >
                Not Now
              </button>
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 bg-dark-200 hover:bg-dark-300 border border-gray-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Web App
                </button>
              )}
              <a
                href="/downloads/KristalStream.apk"
                download
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Get APK
              </a>
            </div>
            <p className="text-xs text-gray-500 text-center">
              APK installs directly — allow "unknown sources" if prompted
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors font-medium"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Install
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
