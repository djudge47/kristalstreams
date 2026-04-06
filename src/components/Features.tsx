import React from 'react';
import { Tv, Globe, Zap, Film, Clock, Shield, Monitor, Smartphone, Apple, Laptop } from 'lucide-react';

const features = [
  {
    icon: <Tv className="text-primary w-8 h-8" />,
    title: 'Live TV Channels',
    description: 'Access thousands of live TV channels from around the world in HD quality.'
  },
  {
    icon: <Film className="text-primary w-8 h-8" />,
    title: 'VOD Library',
    description: 'Extensive library of movies and TV shows available on-demand anytime.'
  },
  {
    icon: <Globe className="text-primary w-8 h-8" />,
    title: 'Global Content',
    description: 'International channels and content from every major region and language.'
  },
  {
    icon: <Clock className="text-primary w-8 h-8" />,
    title: '24/7 Availability',
    description: 'Uninterrupted service with constant updates and new content additions.'
  },
  {
    icon: <Shield className="text-primary w-8 h-8" />,
    title: 'Secure Streaming',
    description: 'Encrypted connections and secure streaming for all your devices.'
  },
  {
    icon: <Zap className="text-primary w-8 h-8" />,
    title: 'High Performance',
    description: 'Ultra-fast streaming with minimal buffering and HD/4K quality support.'
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
              className="bg-dark-100 p-8 rounded-xl border border-gray-800 hover:border-primary transition-all duration-300 card-hover"
            >
              <div className="mb-4 p-3 bg-dark-300 inline-block rounded-lg">
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

        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <Monitor className="text-primary w-8 h-8 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Available on All Your Devices</h3>
            <p className="text-gray-400">Stream on your favorite platforms and devices</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-8">
            <div className="flex flex-col items-center">
              <img src="/icons/android.png" alt="Android" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Android</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/apple.png" alt="Apple" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Apple</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/windows.png" alt="Windows" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Windows</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/fire-tv.png" alt="Fire TV" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Fire TV</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/roku.png" alt="Roku" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Roku</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/lg.png" alt="LG" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">LG Smart TV</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/samsung.png" alt="Samsung" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">Samsung TV</span>
            </div>
            <div className="flex flex-col items-center">
              <img src="/icons/onn.png" alt="ONN" className="h-12 w-12 mb-2" />
              <span className="text-gray-400">ONN TV</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;