import React from 'react';
import { Tv, Globe, Zap, Film, Clock, Shield, Monitor, Smartphone, Apple, Laptop } from 'lucide-react';

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

        <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <Monitor className="text-primary w-8 h-8 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Available on All Your Devices</h3>
            <p className="text-gray-400">Stream on your favorite platforms and devices</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="#3DDC84"><path d="M17.6 2.8l2.4 4.4C16.4 9 13.6 12.8 13.6 17.2h20.8c0-4.4-2.8-8.2-6.4-10l2.4-4.4c.2-.4 0-.8-.4-1-.4-.2-.8 0-1 .4L26.6 6.6c-1.6-.6-3.2-1-5.2-1s-3.6.4-5.2 1L13.8 2.2c-.2-.4-.6-.6-1-.4-.4.2-.6.6-.4 1zM20 12a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zm8 0a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zM13.6 19v16.4c0 1.4 1 2.4 2.4 2.4h1.6v5.6c0 1.4 1 2.4 2.4 2.4s2.4-1 2.4-2.4v-5.6h3.2v5.6c0 1.4 1 2.4 2.4 2.4s2.4-1 2.4-2.4v-5.6H32c1.4 0 2.4-1 2.4-2.4V19H13.6zM9.2 19c-1.4 0-2.4 1-2.4 2.4v11.2c0 1.4 1 2.4 2.4 2.4s2.4-1 2.4-2.4V21.4c0-1.4-1-2.4-2.4-2.4zm29.6 0c-1.4 0-2.4 1-2.4 2.4v11.2c0 1.4 1 2.4 2.4 2.4s2.4-1 2.4-2.4V21.4c0-1.4-1-2.4-2.4-2.4z"/></svg>
              </div>
              <span className="text-gray-400">Android</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="#A2AAAD"><path d="M36.6 25.2c-.1-4.8 3.9-7.1 4.1-7.2-2.2-3.3-5.7-3.7-6.9-3.8-2.9-.3-5.7 1.7-7.2 1.7s-3.8-1.7-6.3-1.6c-3.2.1-6.2 1.9-7.8 4.8-3.4 5.8-.9 14.4 2.4 19.1 1.6 2.3 3.5 4.9 6 4.8 2.4-.1 3.3-1.6 6.2-1.6s3.7 1.6 6.2 1.5c2.6 0 4.2-2.3 5.8-4.7 1.8-2.7 2.6-5.3 2.6-5.4-.1-.1-5-1.9-5.1-7.6zM31.8 10.8c1.3-1.6 2.2-3.8 2-6-1.9.1-4.2 1.3-5.6 2.9-1.2 1.4-2.3 3.7-2 5.9 2.2.2 4.3-1.1 5.6-2.8z"/></svg>
              </div>
              <span className="text-gray-400">Apple</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="#00ADEF"><path d="M6 6l17.2-2.4v16.6H6V6zm19.2-2.7L44 1v21.2H25.2V3.3zM6 22.4h17.2v16.8L6 41.6V22.4zm19.2-.2H44V47l-18.8-2.6V22.2z"/></svg>
              </div>
              <span className="text-gray-400">Windows</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10"><path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill="#FF9900"/><path d="M20 16l12 8-12 8V16z" fill="white"/></svg>
              </div>
              <span className="text-gray-400">Fire TV</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10"><rect x="4" y="8" width="40" height="32" rx="4" fill="#6C3B9E"/><text x="24" y="29" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="12">ROKU</text></svg>
              </div>
              <span className="text-gray-400">Roku</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10"><circle cx="24" cy="24" r="20" fill="#A50034"/><text x="24" y="30" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="16">LG</text></svg>
              </div>
              <span className="text-gray-400">LG Smart TV</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10"><rect x="2" y="12" width="44" height="24" rx="4" fill="#1428A0"/><text x="24" y="28" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="7">SAMSUNG</text></svg>
              </div>
              <span className="text-gray-400">Samsung TV</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 mb-2 flex items-center justify-center">
                <svg viewBox="0 0 48 48" className="h-10 w-10"><rect x="4" y="12" width="40" height="24" rx="4" fill="#0071CE"/><text x="24" y="29" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="14">ONN</text></svg>
              </div>
              <span className="text-gray-400">ONN TV</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;