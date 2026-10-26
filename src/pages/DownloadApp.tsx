import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Monitor, Smartphone, Tv } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '../lib/install-prompt';

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    mounted.current = true;
    window.scrollTo(0, 0);
    const standalone = typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    completed.current = standalone;
    setIsInstalled(standalone);
    const offered = (event: Event) => {
      const prompt = event as BeforeInstallPromptEvent;
      if (typeof prompt.prompt !== 'function' || completed.current) return;
      event.preventDefault(); setDeferredPrompt(prompt);
    };
    const installed = () => {
      if (!mounted.current) return;
      completed.current = true; setIsInstalled(true); setDeferredPrompt(null); setNotice(null); setError(null);
    };
    window.addEventListener('beforeinstallprompt', offered);
    window.addEventListener('appinstalled', installed);
    return () => { mounted.current = false; window.removeEventListener('beforeinstallprompt', offered); window.removeEventListener('appinstalled', installed); };
  }, []);

  const installWebsiteShortcut = async () => {
    if (!deferredPrompt || pending.current || completed.current) return;
    pending.current = true; setInstalling(true); setNotice(null); setError(null);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (!mounted.current || completed.current) return;
      setNotice(outcome === 'accepted'
        ? 'Website shortcut installation requested. Check your browser or home screen for completion.'
        : 'Website shortcut installation was dismissed. You can continue using your browser.');
    } catch {
      if (mounted.current && !completed.current) setError('The website shortcut could not be installed. You can continue using your browser.');
    } finally {
      pending.current = false;
      if (mounted.current) { setDeferredPrompt(null); setInstalling(false); }
    }
  };

  return (
    <div className="min-h-screen bg-dark-300 py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Apps &amp; Device Setup</h1>
        <p className="mb-8 max-w-3xl text-lg text-gray-300">Get help with your streaming app, or access your Kristal Streams website account from a browser.</p>

        <section aria-labelledby="android-installer-title" className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
          <Smartphone className="mb-4 h-8 w-8 text-amber-300" aria-hidden="true" />
          <p className="mb-2 text-sm font-semibold text-amber-300">Android installer · Build 2026102001</p>
          <h2 id="android-installer-title" className="mb-4 text-2xl font-bold text-white">Android streaming app</h2>
          <p className="max-w-3xl text-gray-200">Download the Kristal Streams Android streaming app. On your TV, open this page in Downloader to get the installer.</p>
          <p className="mt-4 max-w-3xl text-gray-300">If Kristal Streams already works on your device, keep your current installation and saved users. Confirm your app version with support before changing or reinstalling it.</p>
          <nav aria-label="Installer assistance" className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="/downloads/KristalStreams.apk?v=2026102001" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Download className="h-5 w-5" aria-hidden="true" />Download Android APK</a>
            <Link to="/support" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Contact Support</Link>
            <a href="mailto:support@kristalstream.com" className="inline-flex min-h-12 items-center justify-center break-all rounded-lg border border-gray-600 px-5 py-3 font-semibold text-white hover:bg-dark-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Email support@kristalstream.com</a>
          </nav>
        </section>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="tv-setup-title" className="rounded-xl border border-gray-800 bg-dark-100 p-6">
            <Tv className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
            <h2 id="tv-setup-title" className="mb-3 text-xl font-semibold text-white">ONN &amp; Android TV setup</h2>
            <p className="mb-4 text-gray-300">Use the guide for your device and confirm the current installer with support. Signing out of the website does not sign out of the TV app or return your TV to its home screen.</p>
            <Link to="/support/tv-setup" className="inline-flex min-h-11 items-center py-2 text-white underline underline-offset-4 hover:text-red-300">TV Setup Help</Link>
          </section>
          <section aria-labelledby="phone-setup-title" className="rounded-xl border border-gray-800 bg-dark-100 p-6">
            <Smartphone className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
            <h2 id="phone-setup-title" className="mb-3 text-xl font-semibold text-white">Phone &amp; tablet setup</h2>
            <p className="mb-4 text-gray-300">Confirm the app and playback instructions supplied for your device. Your website account and streaming-app login are separate.</p>
            <Link to="/support/mobile-setup" className="inline-flex min-h-11 items-center py-2 text-white underline underline-offset-4 hover:text-red-300">Mobile Setup Help</Link>
          </section>
        </div>

        <section aria-labelledby="website-shortcut-title" className="rounded-xl border border-gray-800 bg-dark-100 p-6 sm:p-8">
          <Monitor className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 id="website-shortcut-title" className="mb-3 text-2xl font-semibold text-white">Website account access</h2>
          <p className="max-w-3xl text-gray-300">Use your browser for your dashboard, plans and support. A website shortcut opens these pages; it does not install or update the Android streaming app. Use the player and setup instructions supplied separately for streaming playback.</p>
          {isInstalled ? <p role="status" className="mt-5 text-green-300">Website shortcut available. This applies to the website account pages.</p>
            : deferredPrompt ? <button type="button" onClick={installWebsiteShortcut} disabled={installing} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-gray-700"><Download className="h-5 w-5" aria-hidden="true" />{installing ? 'Waiting for Browser…' : 'Install Website Shortcut'}</button>
              : <p className="mt-5 text-sm text-gray-400">If your browser offers an install or Add to Home Screen option, you can use it for website account access.</p>}
          {notice && <p role="status" className="mt-4 text-sm text-gray-300">{notice}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
          <nav aria-label="Website account destinations" className="mt-6 flex flex-wrap gap-6">
            <Link to="/dashboard" className="inline-flex min-h-11 items-center py-2 text-white underline underline-offset-4 hover:text-red-300">Go to Dashboard</Link>
            <Link to="/support/devices" className="inline-flex min-h-11 items-center py-2 text-white underline underline-offset-4 hover:text-red-300">Device Setup Guides</Link>
          </nav>
        </section>
      </div>
    </div>
  );
}
