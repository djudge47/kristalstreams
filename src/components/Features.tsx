import React from 'react';
import {
  Tv,
  Globe,
  Zap,
  Film,
  Clock,
  Shield,
  Monitor
} from 'lucide-react';

import {
  SiAndroid,
  SiApple,
  SiLg,
  SiRoku,
  SiNvidia,
  SiAppletv,
  SiSamsung,
  SiGooglecast
} from 'react-icons/si';

import {
  FaWindows,
  FaAmazon
} from 'react-icons/fa6';

const features = [
  {
    icon: <Tv className="text-red-500 w-8 h-8" />,
    title: 'Live TV Channels',
    description: 'Access thousands of live TV channels from around the world in HD quality.',
    color: 'border-red-500/30 hover:border-red-500',
    bg: 'bg-red-500/10'
  },
  {
    icon: <Film className="text-purple-500 w-8 h-8" />,
    title: 'VOD Library',
    description: 'Extensive library of movies and TV shows available on-demand anytime.',
    color: 'border-purple-500/30 hover:border-purple-500',
    bg: 'bg-purple-500/10'
  },
  {
    icon: <Globe className="text-blue-500 w-8 h-8" />,
    title: 'Global Content',
    description: 'International channels and content from every major region and language.',
    color: 'border-blue-500/30 hover:border-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    icon: <Clock className="text-amber-500 w-8 h-8" />,
    title: '24/7 Availability',
    description: 'Uninterrupted service with constant updates and new content additions.',
    color: 'border-amber-500/30 hover:border-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    icon: <Shield className="text-emerald-500 w-8 h-8" />,
    title: 'Secure Streaming',
    description: 'Encrypted connections and secure streaming for all your devices.',
    color: 'border-emerald-500/30 hover:border-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    icon: <Zap className="text-cyan-500 w-8 h-8" />,
    title: 'High Performance',
    description: 'Ultra-fast streaming with minimal buffering and HD/4K quality support.',
    color: 'border-cyan-500/30 hover:border-cyan-500',
    bg: 'bg-cyan-500/10'
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-dark-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient bg-gradient-to-r from-white to-gray-300 mb-4">
            Premium Features
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Experience the best in streaming entertainment with our premium IPTV service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-dark-100 p-8 rounded-xl border ${feature.color} transition-all duration-300 card-hover`}
            >
              <div className={`mb-4 p-3 ${feature.bg} inline-block rounded-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gradient bg-gradient-to-r from-white to-gray-300 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-dark-100 rounded-xl p-8 md:p-10 border border-gray-800">
          <div className="text-center mb-10">
            <Monitor className="text-primary w-9 h-9 mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Available on All Your Devices
            </h3>
            <p className="text-gray-400">
              Stream Kristal Streams on your favorite platforms and devices
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12">
            <div className="flex flex-col items-center text-center">
              <SiAndroid className="w-16 h-16 text-green-500 mb-3" />
              <span className="text-white font-semibold">Android</span>
              <span className="text-xs text-gray-400 mt-1">Phones &amp; Tablets</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiApple className="w-16 h-16 text-gray-200 mb-3" />
              <span className="text-white font-semibold">Apple</span>
              <span className="text-xs text-gray-400 mt-1">iPhone, iPad &amp; Mac</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center mb-3">
                <span className="text-white text-xl font-bold">im</span>
              </div>
              <span className="text-white font-semibold">Infomir</span>
              <span className="text-xs text-gray-400 mt-1">MAG Boxes</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <FaWindows className="w-16 h-16 text-blue-500 mb-3" />
              <span className="text-white font-semibold">Windows</span>
              <span className="text-xs text-gray-400 mt-1">Desktop &amp; Laptop</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <FaAmazon className="w-16 h-16 text-orange-500 mb-3" />
              <span className="text-white font-semibold">Amazon Fire TV</span>
              <span className="text-xs text-gray-400 mt-1">Stick, TV &amp; Cube</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiLg className="w-16 h-16 text-red-500 mb-3" />
              <span className="text-white font-semibold">LG</span>
              <span className="text-xs text-gray-400 mt-1">Smart TVs</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiRoku className="w-16 h-16 text-purple-500 mb-3" />
              <span className="text-white font-semibold">Roku</span>
              <span className="text-xs text-gray-400 mt-1">Streaming Devices</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiNvidia className="w-16 h-16 text-lime-500 mb-3" />
              <span className="text-white font-semibold">NVIDIA Shield</span>
              <span className="text-xs text-gray-400 mt-1">Shield TV</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiAppletv className="w-16 h-16 text-gray-200 mb-3" />
              <span className="text-white font-semibold">Apple TV</span>
              <span className="text-xs text-gray-400 mt-1">TV Streaming</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiSamsung className="w-16 h-16 text-blue-500 mb-3" />
              <span className="text-white font-semibold">Samsung</span>
              <span className="text-xs text-gray-400 mt-1">Smart TVs</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <Tv className="w-16 h-16 text-green-400 mb-3" />
              <span className="text-white font-semibold">Android TV</span>
              <span className="text-xs text-gray-400 mt-1">TVs &amp; Boxes</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <SiGooglecast className="w-16 h-16 text-cyan-400 mb-3" />
              <span className="text-white font-semibold">Chromecast</span>
              <span className="text-xs text-gray-400 mt-1">TV Streaming</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
