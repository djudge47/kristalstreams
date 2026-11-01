import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, ExternalLink, Monitor, ShieldCheck, Smartphone, Tv } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const androidApk = {
  name: 'Kristal Streams APK',
  downloadUrl: 'https://raw.githubusercontent.com/djudge47/kristalstreams/main/public/downloads/KristalStreams.apk',
  fileName: 'KristalStreams.apk',
  version: '9506',
  size: '78.6 MB',
  requirements: 'Android 7.0+',
};

const supportedDevices = [
  'Android phones and tablets',
  'Android TV boxes',
  'Amazon Fire TV / Firestick',
  'NVIDIA Shield',
  'Chromecast with Google TV',
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
              Download the Kristal Stream APK for Android, Firestick, and Android TV devices. You can also access the browser version without an APK.
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

          <section className="mb-12" aria-labelledby="installation-guides">
            <h2 id="installation-guides" className="mb-3 text-center text-3xl font-bold text-white">Step-by-step installation guides</h2>
            <p className="mb-8 text-center text-gray-300">Choose your device and follow each step. No Downloader code is needed: visit kristalstream.com/download-app and select Download Kristal Stream APK. Kristal Streams is not listed in the app store.</p>
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
                  <h3 className="mb-4 text-xl font-bold text-white">Firestick / Fire TV — Website download</h3>
                  <p className="mb-4 text-sm text-gray-300">Kristal Streams for Firestick is available from our website only for now. It is not in the Amazon Appstore. No Downloader code is provided.</p>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span><span className="pt-1 text-sm leading-relaxed text-gray-300">On a compatible Fire TV device, open its web browser.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Go to kristalstream.com/download-app.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Select Download Kristal Stream APK on the website.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">4</span><span className="pt-1 text-sm leading-relaxed text-gray-300">When the file finishes downloading, open the APK and choose Install. If installation is blocked, enable permission for the browser or file manager in device settings, then try again.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">5</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Select Open or find Kristal Streams in Your Apps & Channels, then sign in with your provided account details.</span></li>
                  </ol>
                  <p className="mt-4 text-xs text-gray-400">Some Fire TV browsers and models may block APK downloads or installation. Fire TV devices running Vega OS cannot install Android APKs.</p>
                </div>
                <div className="rounded-xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
                  <h3 className="mb-4 text-xl font-bold text-white">Android TV / Google TV / ONN</h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Look for the separate Downloader utility in your device's app store if available, or use an installed browser that can download APKs. Kristal Streams itself is not an app-store listing.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Allow installation from Downloader or the browser when prompted (often Settings → Apps → Special app access → Install unknown apps).</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Open kristalstream.com/download-app in Downloader or the browser, select Download Kristal Stream APK, and then choose Install. No code is needed.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">4</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Open Kristal Streams from the Apps screen and sign in.</span></li>
                  </ol>
                </div>
                <div className="rounded-xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
                  <h3 className="mb-4 text-xl font-bold text-white">Smart TV (Samsung / LG / other)</h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Check the TV's operating system in Settings → About or Support → TV Information.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span><span className="pt-1 text-sm leading-relaxed text-gray-300">If your smart TV uses Android TV or Google TV, follow the Android TV steps on this page.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Samsung Tizen and LG webOS TVs cannot directly install Android APK files. Connect a compatible Fire TV Stick, ONN or Google TV streaming device to an HDMI port.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">4</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Switch the TV to the streaming device's HDMI input, then follow that device's instructions above.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">5</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Alternatively, use the TV's browser to visit kristalstream.com if its browser supports the web service.</span></li>
                  </ol>
                </div>
                <div className="rounded-xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
                  <h3 className="mb-4 text-xl font-bold text-white">Android phone / tablet</h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Tap Download Kristal Streams APK above in your phone browser.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Open the downloaded APK from Downloads or the download notification.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span><span className="pt-1 text-sm leading-relaxed text-gray-300">When asked, allow your browser or file manager to install unknown apps. Return to the installer and select Install.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">4</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Open Kristal Streams from the app list and sign in.</span></li>
                  </ol>
                </div>
                <div className="rounded-xl border border-gray-700 bg-dark-100 p-5 sm:p-7">
                  <h3 className="mb-4 text-xl font-bold text-white">Web browser</h3>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">1</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Open kristalstream.com in a supported browser.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">2</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Choose Sign In and enter your account details.</span></li>
                    <li className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">3</span><span className="pt-1 text-sm leading-relaxed text-gray-300">Navigate to the available streaming sections. No APK is needed.</span></li>
                  </ol>
                </div>
            </div>
          </section>

          <section className="mb-12 rounded-2xl border border-gray-700 bg-dark-100 p-6 sm:p-8" aria-labelledby="using-kristal-streams">
            <h2 id="using-kristal-streams" className="mb-3 text-3xl font-bold text-white">After installation: using Kristal Streams</h2>
            <p className="mb-6 text-gray-300">Your available channels and titles depend on your account and service package.</p>
            <div className="grid gap-6 md:grid-cols-3">
              <div><h3 className="mb-3 text-xl font-semibold text-white">Live TV</h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300">
                  <li>Open the app and sign in with your supplied account details.</li>
                  <li>On the home screen, select Live TV.</li>
                  <li>Choose a channel category, then highlight a channel and press Select or OK to play.</li>
                  <li>Use the remote's Back button to return to the channel list or previous screen.</li>
                  <li>If a channel does not play, try another channel and check your internet connection.</li>
                </ol>
              </div>
              <div><h3 className="mb-3 text-xl font-semibold text-white">Movies</h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300">
                  <li>From the home screen choose Movies.</li>
                  <li>Browse categories or use Search to find a title.</li>
                  <li>Select the movie to open details, then choose Play.</li>
                  <li>If offered, choose Resume or Play From Beginning.</li>
                  <li>Use the player's controls for pause, seek and audio or subtitles when available.</li>
                </ol>
              </div>
              <div><h3 className="mb-3 text-xl font-semibold text-white">Series</h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-300">
                  <li>From the home screen choose Series.</li>
                  <li>Search or browse for the show you want.</li>
                  <li>Open the show, choose a season, then an episode.</li>
                  <li>Select Play or Continue Watching when available.</li>
                  <li>Use Back to return to episode selection.</li>
                </ol>
              </div>
            </div>
            <div className="mt-7 rounded-lg border border-yellow-500/25 bg-yellow-500/10 p-4 text-sm text-yellow-100/90">
              <strong>Installation troubleshooting:</strong> If you see “App not installed,” check available storage and whether a different or newer signed version is already installed. Do not uninstall an existing working version unless you have backed up your access details. Newer Fire TV devices running Vega OS do not support Android APK sideloading.
            </div>
          </section>

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
