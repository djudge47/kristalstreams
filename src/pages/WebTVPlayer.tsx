import React from 'react';
import { Monitor, Smartphone, Tablet, Tv, Chrome, Play, Download, Settings } from 'lucide-react';

const WebTVPlayer: React.FC = () => {
  const features = [
    {
      icon: Monitor,
      title: 'Web-Based Access',
      description: 'Watch directly from your browser without installing any software. Compatible with Chrome, Firefox, Safari, and Edge.'
    },
    {
      icon: Play,
      title: 'Instant Playback',
      description: 'Click and play. No buffering, no delays. Start watching your favorite content instantly with our optimized player.'
    },
    {
      icon: Settings,
      title: 'Customizable Interface',
      description: 'Adjust video quality, subtitles, audio tracks, and more. Personalize your viewing experience to match your preferences.'
    },
    {
      icon: Tv,
      title: 'Full Screen Mode',
      description: 'Immersive viewing experience with full-screen support and picture-in-picture mode for multitasking.'
    }
  ];

  const devices = [
    {
      icon: Monitor,
      name: 'Desktop Browsers',
      description: 'Chrome, Firefox, Safari, Edge'
    },
    {
      icon: Smartphone,
      name: 'Mobile Devices',
      description: 'iOS and Android browsers'
    },
    {
      icon: Tablet,
      name: 'Tablets',
      description: 'iPad, Android tablets'
    },
    {
      icon: Tv,
      name: 'Smart TVs',
      description: 'Built-in browsers on Smart TVs'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-300 text-white py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Web TV Player</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Watch live TV and on-demand content directly from your web browser.
              No downloads, no installations - just instant streaming entertainment.
            </p>
          </div>

          <div className="bg-dark-200 rounded-xl p-8 md:p-12 border border-gray-800 mb-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Stream Anywhere, Anytime</h2>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  Our Web TV Player brings premium streaming to any device with a web browser.
                  Whether you're at home or on the go, access your entire content library with
                  just a few clicks.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  Experience seamless streaming with adaptive quality, intuitive controls, and
                  a sleek interface designed for the best viewing experience.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/login"
                    className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105 inline-flex items-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Watching
                  </a>
                  <a
                    href="/free-trial"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    Try Free
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl blur-xl"></div>
                <div className="relative bg-dark-300 rounded-xl p-8 border border-gray-800">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-dark-200 rounded-lg flex items-center justify-center mb-4">
                    <Chrome className="w-20 h-20 text-primary opacity-50" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-400">Live Streaming</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Player Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Compatible Devices</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {devices.map((device, index) => {
                const Icon = device.icon;
                return (
                  <div
                    key={index}
                    className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300 text-center"
                  >
                    <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{device.name}</h3>
                    <p className="text-gray-400 text-sm">{device.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Key Benefits</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Downloads Required</h3>
                <p className="text-gray-300">
                  Start streaming immediately without installing apps or software. Just log in and play.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy to Use</h3>
                <p className="text-gray-300">
                  Intuitive interface with simple controls. No technical knowledge needed to get started.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                  <Play className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Instant Access</h3>
                <p className="text-gray-300">
                  Access your entire content library instantly from any browser, anywhere in the world.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-200 rounded-xl p-8 md:p-12 border border-gray-800 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Advanced Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Adaptive Streaming</h4>
                    <p className="text-gray-400 text-sm">
                      Automatically adjusts quality based on your internet speed for smooth playback
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Multi-Language Support</h4>
                    <p className="text-gray-400 text-sm">
                      Switch between audio tracks and subtitles in multiple languages
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Picture-in-Picture</h4>
                    <p className="text-gray-400 text-sm">
                      Continue watching while browsing other tabs or apps
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Playback Controls</h4>
                    <p className="text-gray-400 text-sm">
                      Pause, rewind, fast-forward with keyboard shortcuts and on-screen controls
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">EPG Integration</h4>
                    <p className="text-gray-400 text-sm">
                      Built-in Electronic Program Guide to see what's playing now and later
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Channel Categories</h4>
                    <p className="text-gray-400 text-sm">
                      Browse content by categories like Sports, Movies, News, Entertainment
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Favorites List</h4>
                    <p className="text-gray-400 text-sm">
                      Save your favorite channels for quick access and personalized experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold mb-1">Search Function</h4>
                    <p className="text-gray-400 text-sm">
                      Quickly find channels, movies, or shows with powerful search capabilities
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Start Streaming Today</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Experience the convenience of web-based streaming. No apps to download, no setup required.
              Just log in and start watching your favorite content instantly.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/free-trial"
                className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
              </a>
              <a
                href="/pricing"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebTVPlayer;
