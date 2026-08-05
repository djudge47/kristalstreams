import React, { useEffect, useState } from 'react';
import { AlertTriangle, Apple, CheckCircle, Download, ExternalLink, Monitor, ShieldCheck, Smartphone, Tv } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const androidApk = {
  name: 'Kristal Stream APK',
  downloadUrl: '/downloads/KristalStream.apk',
  fileName: 'KristalStream.apk',
  version: '1.0.0',
  size: '8.2 MB',
  requirements: 'Android 7.0+',
};

const macApp = {
  name: 'Kristal Streams for Mac / Apple',
  downloadUrl: 'https://zl30hmmadap6eroe.public.blob.vercel-storage.com/KristalStreams-website-style-macOS-app-v3.zip',
  fileName: 'KristalStreams-website-style-macOS-app-v3.zip',
  version: '1.8.5',
  size: '141 MB',
  requirements: 'macOS 11.0+',
};

const supportedDevices = [
  'Android phones and tablets',
  'Android TV boxes',
  'Amazon Fire TV / Firestick',
  'NVIDIA Shield',
  'Chromecast with Google TV',
  'Mac / Apple computers',
  'Web browser option',
];

const DownloadApp: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('Desktop');

  useEffect(() => {
    window.scrollTo(0, 0);

    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setPlatform('Android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('iOS');
    } else if (/mac/.test(userAgent)) {
      setPlatform('macOS');
    } else if (/win/.test(userAgent)) {
      setPlatform('Windows');
    }

    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-dark-300 py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-6 flex items-center justify-center">
              <Download className="mr-4 h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-white md:text-5xl">Download Kristal Streams Apps</h1>
            </div>
            <p className="mx-auto max-w-3xl text-xl text-gray-400">
              Download the Kristal Stream APK for Android, Firestick, and Android TV devices. Mac / Apple users can use the Mac download or stream directly in the browser.
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-500/5 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/20">
                  <Smartphone className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-green-300">Android APK Download</p>
                  <h2 className="text-2xl font-bold text-white">{androidApk.name}</h2>
                  <p className="mt-2 text-gray-400">
                    File: {androidApk.fileName} · Version {androidApk.version} · {androidApk.size} · {androidApk.requirements}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    Download path: <span className="font-mono text-gray-300">{androidApk.downloadUrl}</span>
                  </p>
                </div>
              </div>

              <a
                href={androidApk.downloadUrl}
                download={androidApk.fileName}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-green-600"
              >
                <Download className="h-5 w-5" />
                Download Kristal Stream APK
              </a>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-300" />
              <div>
                <h3 className="font-semibold text-white">Android / Firestick install note</h3>
                <p className="mt-1 text-sm text-yellow-100/80">
                  Android and Firestick may ask you to allow installs from your browser or Downloader app. After downloading, open {androidApk.fileName} and approve the install prompt.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-slate-500/5 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                  <Apple className="h-8 w-8 text-gray-200" />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">Apple / Mac Download</p>
                  <h2 className="text-2xl font-bold text-white">{macApp.name}</h2>
                  <p className="mt-2 text-gray-400">
                    File: {macApp.fileName} · Version {macApp.version} · {macApp.size} · {macApp.requirements}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    This Mac download is hosted separately because the app package is larger than GitHub’s file limit.
                  </p>
                </div>
              </div>

              <a
                href={macApp.downloadUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-4 font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <Download className="h-5 w-5" />
                Download for Mac / Apple
              </a>
            </div>
          </div>

          <div className="mb-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
              <Tv className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">TV Boxes & Firestick</h3>
              <ol className="mt-4 space-y-3 text-sm text-gray-300">
                <li>1. Open Downloader or your device browser.</li>
                <li>2. Go to the Kristal Stream APK download page.</li>
                <li>3. Download and open {androidApk.fileName}.</li>
                <li>4. Allow install from unknown apps when prompted.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
              <Smartphone className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">Android Phones</h3>
              <ol className="mt-4 space-y-3 text-sm text-gray-300">
                <li>1. Tap Download Kristal Stream APK.</li>
                <li>2. Open {androidApk.fileName}.</li>
                <li>3. Approve the install permission.</li>
                <li>4. Open the installed app from your app list.</li>
              </ol>
            </div>

            <div className="rounded-xl border border-gray-800 bg-dark-100 p-6">
              <Monitor className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold text-white">Browser Option</h3>
              <p className="mt-4 text-sm text-gray-300">
                The browser version still works without installing the APK. Customers can sign in from the website when they do not want to install the Android file.
              </p>
              {isInstalled ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  Web app already installed
                </div>
              ) : deferredPrompt ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-red-700"
                >
                  <Download className="h-5 w-5" />
                  Install Web App
                </button>
              ) : (
                <p className="mt-4 text-sm text-gray-500">Current device detected: {platform}</p>
              )}
            </div>
          </div>

          <div className="mb-12 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 flex-shrink-0 text-cyan-300" />
              <div>
                <h2 className="text-2xl font-bold text-white">Supported devices</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {supportedDevices.map((device) => (
                    <div key={device} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-gray-200">
                      {device}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-dark-100 p-8">
              <h3 className="mb-4 text-xl font-semibold text-white">System requirements</h3>
              <div className="space-y-3 text-gray-300">
                <p><strong>Internet:</strong> 5 Mbps for HD, 25 Mbps for 4K.</p>
                <p><strong>Android:</strong> Android 7.0 or newer.</p>
                <p><strong>Mac:</strong> macOS 11.0 or newer for the Mac download.</p>
                <p><strong>Account:</strong> Active subscription, IPTV account, or demo access.</p>
                <p><strong>Storage:</strong> Enough free space to install the download.</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-dark-100 p-8">
              <h3 className="mb-4 text-xl font-semibold text-white">Need help installing?</h3>
              <p className="mb-4 text-gray-300">
                Visit support for Android, TV box, Firestick, and Mac setup help.
              </p>
              <div className="space-y-2">
                <a href="/support" className="flex items-center gap-2 text-primary hover:text-red-700">
                  <ExternalLink className="h-4 w-4" />
                  Visit Support Center
                </a>
                <a href="/support/devices" className="flex items-center gap-2 text-primary hover:text-red-700">
                  <ExternalLink className="h-4 w-4" />
                  Device Setup Guides
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-gray-800 bg-dark-100 p-8 text-center">
            <Monitor className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-4 text-2xl font-semibold text-white">No APK download required?</h3>
            <p className="mx-auto mb-6 max-w-2xl text-gray-300">
              Customers can also stream directly in the browser by signing in on the Kristal Streams website.
            </p>
            <button
              type="button"
              onClick={() => window.open('/', '_blank')}
              className="rounded-lg bg-dark-200 px-8 py-3 font-medium text-white transition-colors hover:bg-dark-100"
            >
              Stream in Browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadApp;
