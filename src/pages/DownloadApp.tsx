import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, Tv, Apple, Chrome, Wifi, Zap, Lock, Bell, HardDrive, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppDownload {
  id: string;
  name: string;
  platform: string;
  icon: React.ReactNode;
  description: string;
  downloadUrl: string;
  version: string;
  size: string;
  requirements: string;
  features: string[];
}

const appDownloads: AppDownload[] = [
  {
    id: 'android',
    name: 'Kristal Streams for Android',
    platform: 'Android',
    icon: <Smartphone className="w-8 h-8 text-green-500" />,
    description: 'Stream on your Android phone or tablet with our optimized mobile app.',
    downloadUrl: '/downloads/KristalStream.apk',
    version: '1.0.0',
    size: '8.2 MB',
    requirements: 'Android 7.0+',
    features: [
      'HD & 4K streaming',
      'Offline downloads',
      'Chromecast support',
      'Picture-in-picture mode',
      'Parental controls'
    ]
  },
  {
    id: 'ios',
    name: 'Kristal Streams for iOS',
    platform: 'iOS',
    icon: <Apple className="w-8 h-8 text-gray-300" />,
    description: 'Experience seamless streaming on your iPhone or iPad.',
    downloadUrl: '#',
    version: '2.1.0',
    size: '52 MB',
    requirements: 'iOS 13.0+',
    features: [
      'HD & 4K streaming',
      'AirPlay support',
      'Background audio',
      'Touch ID/Face ID',
      'Family sharing'
    ]
  },
  {
    id: 'windows',
    name: 'Kristal Streams for Windows',
    platform: 'Windows',
    icon: <Monitor className="w-8 h-8 text-blue-500" />,
    description: 'Desktop app for Windows with enhanced performance and features.',
    downloadUrl: '#',
    version: '1.8.5',
    size: '120 MB',
    requirements: 'Windows 10+',
    features: [
      '4K streaming',
      'Multiple windows',
      'Keyboard shortcuts',
      'System notifications',
      'Hardware acceleration'
    ]
  },
  {
    id: 'macos',
    name: 'Kristal Streams for macOS',
    platform: 'macOS',
    icon: <Apple className="w-8 h-8 text-gray-300" />,
    description: 'Native macOS app optimized for Mac computers.',
    downloadUrl: '#',
    version: '1.8.5',
    size: '95 MB',
    requirements: 'macOS 11.0+',
    features: [
      '4K streaming',
      'Touch Bar support',
      'Menu bar controls',
      'Retina display optimized',
      'macOS integration'
    ]
  },
  {
    id: 'firetv',
    name: 'Kristal Streams for Fire TV',
    platform: 'Fire TV',
    icon: <Tv className="w-8 h-8 text-orange-500" />,
    description: 'Optimized for Amazon Fire TV and Fire TV Stick devices.',
    downloadUrl: '#',
    version: '1.5.2',
    size: '38 MB',
    requirements: 'Fire OS 6.0+',
    features: [
      '4K streaming',
      'Voice remote support',
      'Alexa integration',
      'Quick channel switching',
      'Parental controls'
    ]
  },
  {
    id: 'roku',
    name: 'Kristal Streams for Roku',
    platform: 'Roku',
    icon: <Tv className="w-8 h-8 text-purple-500" />,
    description: 'Stream directly on your Roku device with our dedicated channel.',
    downloadUrl: '#',
    version: '1.4.8',
    size: '25 MB',
    requirements: 'Roku OS 9.0+',
    features: [
      'HD & 4K streaming',
      'Voice remote support',
      'Channel favorites',
      'Sleep timer',
      'Simple interface'
    ]
  }
];

const DownloadApp: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<string>('');

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
    } else {
      setPlatform('Desktop');
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Download className="text-primary w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Download Our Apps</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stream Kristal Streams on all your favorite devices. Download our apps for the best viewing experience 
              with optimized performance and exclusive features.
            </p>
          </div>

          {/* Android APK Download — Live */}
          <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-2xl p-8 border border-green-500/30 mb-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500/20 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Kristal Streams for Android</h2>
                  <p className="text-gray-400">Version {appDownloads[0].version} · {appDownloads[0].size} · Android 7.0+</p>
                </div>
              </div>
              <a
                href={appDownloads[0].downloadUrl}
                download
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-5 h-5" />
                Download APK
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              This installs directly from our website, not the Play Store. You may need to allow "Install from unknown sources" in your Android settings.
            </p>
          </div>

          {/* PWA Install Section */}
          {isInstalled ? (
            <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-2xl p-8 border border-green-500/30 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">App Already Installed!</h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Kristal Streams is installed on your device. You can access it from your home screen or app launcher.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-8 border border-primary/30 mb-16">
              <div className="text-center">
                <img src="/logo/ks-mark.png" alt="Kristal Streams" className="h-16 w-auto mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Install Kristal Streams App</h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  Install our Progressive Web App for the best experience. Works on all devices with app-like features,
                  offline support, and instant updates.
                </p>

                {deferredPrompt && (
                  <button
                    onClick={handleInstall}
                    className="bg-primary hover:bg-red-700 text-white px-10 py-5 rounded-lg font-bold text-xl transition-all duration-200 flex items-center justify-center mx-auto shadow-2xl hover:shadow-primary/50 hover:scale-105 mb-8"
                  >
                    <Download className="w-7 h-7 mr-3" />
                    Install Kristal Streams Now
                  </button>
                )}

                {platform === 'iOS' ? (
                  <div className="bg-dark-100 rounded-xl p-8 max-w-2xl mx-auto mb-6 border-2 border-primary/30">
                    <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      <Apple className="w-6 h-6" />
                      Install on iOS/Safari
                    </h3>
                    <ol className="text-left space-y-4 text-gray-300">
                      <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">1</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Tap the Share Button</p>
                          <p className="text-sm">Look for the square with arrow icon at the bottom of Safari</p>
                        </div>
                      </li>
                      <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">2</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Select "Add to Home Screen"</p>
                          <p className="text-sm">Scroll down in the menu and tap this option</p>
                        </div>
                      </li>
                      <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">3</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Tap "Add"</p>
                          <p className="text-sm">Confirm by tapping "Add" in the top right corner</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="bg-dark-100 rounded-xl p-8 max-w-2xl mx-auto mb-6 border-2 border-primary/30">
                    <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                      {platform === 'Android' ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                      Install on {platform}
                    </h3>
                    <ol className="text-left space-y-4 text-gray-300">
                      {platform === 'Android' ? (
                        <>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">1</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Open Chrome Menu</p>
                              <p className="text-sm">Tap the three dots (⋮) in the top right corner</p>
                            </div>
                          </li>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">2</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Select "Install app"</p>
                              <p className="text-sm">Look for "Install app" or "Add to Home Screen" in the menu</p>
                            </div>
                          </li>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">3</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Confirm Installation</p>
                              <p className="text-sm">Tap "Install" to add Kristal Streams to your home screen</p>
                            </div>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">1</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Look for Install Icon</p>
                              <p className="text-sm">Find the install/download icon in your browser's address bar (usually top-right)</p>
                            </div>
                          </li>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">2</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Click Install</p>
                              <p className="text-sm">Click the icon and select "Install" or "Add" from the menu</p>
                            </div>
                          </li>
                          <li className="flex items-start bg-dark-200/50 p-4 rounded-lg">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-lg font-bold mr-4 flex-shrink-0">3</span>
                            <div>
                              <p className="font-semibold text-white mb-1">Launch the App</p>
                              <p className="text-sm">Find and open Kristal Streams from your desktop, start menu, or taskbar</p>
                            </div>
                          </li>
                        </>
                      )}
                    </ol>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <div className="bg-dark-100 px-4 py-2 rounded-lg">
                    <span className="text-primary font-medium">✓ No App Store</span>
                  </div>
                  <div className="bg-dark-100 px-4 py-2 rounded-lg">
                    <span className="text-primary font-medium">✓ Instant Updates</span>
                  </div>
                  <div className="bg-dark-100 px-4 py-2 rounded-lg">
                    <span className="text-primary font-medium">✓ Works Offline</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Why Install Our App?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-400">
                  Instant loading with service worker caching. Experience native app performance in your browser.
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Wifi className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Works Offline</h3>
                <p className="text-gray-400">
                  Access previously loaded content without internet. Continue browsing even when offline.
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Push Notifications</h3>
                <p className="text-gray-400">
                  Get notified about new content, live events, and account updates even when the app is closed.
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <HardDrive className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Save Space</h3>
                <p className="text-gray-400">
                  No large downloads required. The app takes minimal space compared to traditional apps.
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Secure & Private</h3>
                <p className="text-gray-400">
                  HTTPS enabled with modern security. Your data is encrypted and protected.
                </p>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Chrome className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Cross-Platform</h3>
                <p className="text-gray-400">
                  Works on iOS, Android, Windows, macOS, and Linux. One app for all your devices.
                </p>
              </div>
            </div>
          </div>

          {/* Compatible Devices */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Compatible Devices</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="bg-dark-200 p-3 rounded-lg mr-4">
                    <Smartphone className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Mobile Phones</h3>
                    <p className="text-sm text-gray-400">iOS & Android</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Stream on your smartphone with touch-optimized controls and mobile data support.
                </p>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    iOS 11.3+ (Safari)
                  </li>
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    Android 5.0+ (Chrome)
                  </li>
                </ul>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="bg-dark-200 p-3 rounded-lg mr-4">
                    <Monitor className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Desktop</h3>
                    <p className="text-sm text-gray-400">Windows & macOS</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Install on your computer for a native desktop app experience with keyboard shortcuts.
                </p>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    Windows 10+ (Chrome/Edge)
                  </li>
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    macOS 11+ (Chrome/Safari)
                  </li>
                </ul>
              </div>

              <div className="bg-dark-100 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="bg-dark-200 p-3 rounded-lg mr-4">
                    <Monitor className="w-8 h-8 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Tablets</h3>
                    <p className="text-sm text-gray-400">iPad & Android</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Perfect for tablets with responsive design optimized for larger touch screens.
                </p>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    iPad/iPad Pro
                  </li>
                  <li className="text-sm text-gray-400 flex items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                    Android Tablets
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">System Requirements</h3>
              <div className="space-y-3 text-gray-300">
                <p><strong>Internet:</strong> Minimum 5 Mbps for HD, 25 Mbps for 4K</p>
                <p><strong>Storage:</strong> At least 1GB free space for app installation</p>
                <p><strong>Account:</strong> Active Kristal Streams subscription required</p>
                <p><strong>Updates:</strong> Automatic updates ensure latest features</p>
              </div>
            </div>

            <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Need Help?</h3>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Having trouble with installation or setup? Our support team is here to help.
                </p>
                <div className="space-y-2">
                  <a
                    href="/support"
                    className="block text-primary hover:text-red-700 transition-colors duration-200"
                  >
                    → Visit Support Center
                  </a>
                  <a
                    href="/support/devices"
                    className="block text-primary hover:text-red-700 transition-colors duration-200"
                  >
                    → Device Setup Guides
                  </a>
                  <a
                    href="/support"
                    className="block text-primary hover:text-red-700 transition-colors duration-200"
                  >
                    → Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Web App Section */}
          <div className="mt-16 bg-dark-100 rounded-xl p-8 border border-gray-800 text-center">
            <Monitor className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-4">No Download Required?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              You can also stream directly in your web browser without downloading any apps. 
              Just visit our website and sign in to start watching instantly.
            </p>
            <button
              onClick={() => window.open('/', '_blank')}
              className="bg-dark-200 hover:bg-dark-100 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
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