import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Download, User, MessageSquare, ChevronRight } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '../lib/install-prompt';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null), [installing, setInstalling] = useState(false);
  const active = useRef(false), pending = useRef(false), completed = useRef(false);

  useEffect(() => {
    active.current = true;
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window && window.MSStream);
    setIsIOS(isIOSDevice);
    const standalone = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    completed.current = standalone; setIsInstalled(standalone);

    const handler = (e: Event) => {
      if (completed.current || pending.current || typeof (e as BeforeInstallPromptEvent).prompt !== 'function') return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installed = () => { if (!active.current) return; completed.current = true; setIsInstalled(true); setDeferredPrompt(null); setNotice(null); };
    window.addEventListener('beforeinstallprompt', handler); window.addEventListener('appinstalled', installed);
    return () => { active.current = false; window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installed); };
  }, []);

  const handleInstall = async () => {
    if (!active.current || !deferredPrompt || pending.current || completed.current) return;
    pending.current = true; setInstalling(true); setNotice(null);
    try {
      await deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice;
      if (active.current && !completed.current) setNotice(outcome === 'accepted' ? 'Website shortcut installation requested. Check your browser or home screen for completion.' : 'Website shortcut installation was dismissed. You can continue in your browser.');
    } catch { if (active.current && !completed.current) setNotice('The website shortcut request could not be confirmed. You can continue in your browser.'); }
    finally { pending.current = false; if (active.current) { setDeferredPrompt(null); setInstalling(false); } }
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-dark-100 rounded-xl border border-gray-800 p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/20 p-3 rounded-xl flex-shrink-0">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg mb-1">Add Kristal Streams to Your Home Screen</h3>
          <p className="text-gray-400 text-sm mb-4">
            Add a shortcut to your website dashboard, plans and support. Your streaming player uses the separate download and setup instructions supplied for your device.
          </p>
          <div className="grid grid-cols-1 gap-3 mb-5">
            {[
              { icon: Download, label: 'Home screen shortcut', to: '/download-app#website-shortcut-title' },
              { icon: User, label: 'My account', to: '/client/account' },
              { icon: MessageSquare, label: 'Support access', to: '/client/support' },
            ].map(({ icon: Icon, label, to }) => (
              <Link key={label} to={to} className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-gray-700 bg-dark-200 px-4 py-3 text-sm font-medium text-gray-200 transition-colors hover:border-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100">
                <Icon className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1">{label}</span>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
          {notice && <p role="status" className="mb-4 text-sm text-gray-300">{notice}</p>}
          {isIOS ? (
            <div className="bg-dark-200 rounded-lg p-4 text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">Add the website on iPhone or iPad:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Tap the Share button (square with arrow up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="bg-primary hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  {installing ? 'Waiting for Browser…' : 'Add Website'}
                </button>
              )}
              <button
                disabled={installing}
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-white px-5 py-2.5 rounded-lg border border-gray-700 hover:border-gray-500 font-medium transition-colors text-sm"
              >
                Not Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
