import React from 'react';
import { Tv, Film, Trophy, Globe, Smartphone, Wifi, Clock, Shield } from 'lucide-react';

const OurServices: React.FC = () => {
  const services = [
    {
      icon: Tv,
      title: 'Live TV Channels',
      description: 'Access over 18,000+ live TV channels from around the world. Sports, news, entertainment, kids programming, and more in HD and 4K quality.',
      features: [
        '18,000+ Live Channels',
        'HD & 4K Quality',
        'Multi-Language Support',
        'EPG Guide Included'
      ]
    },
    {
      icon: Film,
      title: 'Movies & TV Shows',
      description: 'Extensive on-demand library with thousands of movies and TV series. New releases, classics, and exclusive content updated regularly.',
      features: [
        'Latest Releases',
        'Classic Collections',
        'TV Series Library',
        'Multiple Languages'
      ]
    },
    {
      icon: Trophy,
      title: 'Sports Coverage',
      description: 'Never miss a game with comprehensive sports coverage including live events, PPV, replays, and highlights from leagues worldwide.',
      features: [
        'Live Sports Events',
        'PPV Access',
        'Game Replays',
        'Sports Highlights'
      ]
    },
    {
      icon: Globe,
      title: 'International Content',
      description: 'Global entertainment at your fingertips with channels and content from every continent in multiple languages.',
      features: [
        'Multi-Regional Content',
        '50+ Languages',
        'Cultural Programming',
        'International News'
      ]
    },
    {
      icon: Smartphone,
      title: 'Multi-Device Streaming',
      description: 'Watch on any device - Smart TV, Android, iOS, Fire Stick, MAG Box, computers, and more. Seamless experience across all platforms.',
      features: [
        'Smart TV Apps',
        'Mobile Apps (iOS/Android)',
        'Web Player',
        'Set-Top Box Support'
      ]
    },
    {
      icon: Wifi,
      title: 'Reliable Streaming',
      description: 'Advanced infrastructure ensures smooth, buffer-free streaming with 99.9% uptime. Adaptive bitrate for optimal quality.',
      features: [
        '99.9% Uptime',
        'Anti-Buffering Technology',
        'Fast Server Network',
        'Adaptive Quality'
      ]
    },
    {
      icon: Clock,
      title: 'Catch-Up TV',
      description: 'Missed your favorite show? No problem. Watch programs from the past 7 days with our catch-up TV feature.',
      features: [
        '7-Day Catch-Up',
        'Pause & Resume',
        'Recording Available',
        'Time-Shift Support'
      ]
    },
    {
      icon: Shield,
      title: '24/7 Support',
      description: 'Round-the-clock customer support available via email, phone, and live chat. Technical assistance whenever you need it.',
      features: [
        'Live Chat Support',
        'Email Support',
        'Phone Support',
        'Setup Assistance'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-300 text-white py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive streaming solutions designed to bring world-class entertainment
              to your home with unmatched quality and reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="bg-dark-200 rounded-xl p-8 border border-gray-800 hover:border-primary transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="bg-primary/10 p-4 rounded-lg flex-shrink-0">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-3">{service.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-300">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20 mb-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">What Makes Us Different</h2>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-primary">Quality First</h3>
                  <p className="text-gray-300">
                    We prioritize streaming quality with HD and 4K options, ensuring you always get
                    the best viewing experience possible.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-primary">No Contracts</h3>
                  <p className="text-gray-300">
                    Flexible plans with no long-term commitments. Cancel anytime without penalties
                    or hidden fees.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-primary">Easy Setup</h3>
                  <p className="text-gray-300">
                    Get started in minutes with our simple setup process and user-friendly apps
                    across all devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-dark-200 rounded-xl p-8 md:p-12 border border-gray-800 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Service Guarantees</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Money-Back Guarantee</h3>
                  <p className="text-gray-400">
                    Not satisfied? Get a full refund within the first 7 days, no questions asked.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">99.9% Uptime</h3>
                  <p className="text-gray-400">
                    Reliable service with minimal downtime. Watch your favorite content anytime.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                  <Wifi className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Buffer-Free Streaming</h3>
                  <p className="text-gray-400">
                    Advanced technology ensures smooth playback without interruptions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Free Setup Assistance</h3>
                  <p className="text-gray-400">
                    Need help? Our team will guide you through setup on all your devices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Choose a plan that fits your needs and start enjoying premium streaming today.
              Try our service risk-free with our 7-day money-back guarantee.
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
                View Pricing
              </a>
              <a
                href="/support"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurServices;
