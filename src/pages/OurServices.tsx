import React from 'react';
import { Clock, Film, Globe, Shield, Smartphone, Trophy, Tv, Wifi } from 'lucide-react';

const services = [
  {
    icon: Tv,
    title: 'Live TV Channels',
    description: 'Access 21,000+ live TV channels from around the world in HD and 4K where available.',
    features: ['21,000+ Live Channels', 'HD & 4K Quality', 'Multi-Language Support', 'EPG Guide Included'],
  },
  {
    icon: Film,
    title: 'Movies & TV Shows',
    description: 'Explore an extensive on-demand library of movies, series, new releases, and classics.',
    features: ['Latest Releases', 'Classic Collections', 'TV Series Library', 'Multiple Languages'],
  },
  {
    icon: Trophy,
    title: 'Sports Coverage',
    description: 'Watch live sports, PPV events, replays, and highlights from leagues around the world.',
    features: ['Live Sports Events', 'PPV Access', 'Game Replays', 'Sports Highlights'],
  },
  {
    icon: Globe,
    title: 'International Content',
    description: 'Enjoy regional programming and entertainment from major markets in multiple languages.',
    features: ['Multi-Regional Content', '50+ Languages', 'Cultural Programming', 'International News'],
  },
  {
    icon: Smartphone,
    title: 'Multi-Device Streaming',
    description: 'Use Kristal Streams on supported Smart TVs, mobile devices, computers, and streaming hardware.',
    features: ['Smart TV Support', 'Mobile Devices', 'Web Player', 'Set-Top Box Support'],
  },
  {
    icon: Wifi,
    title: 'Reliable Streaming',
    description: 'Streaming infrastructure designed for smooth playback and fast channel switching.',
    features: ['High Availability', 'Anti-Buffering Technology', 'Fast Server Network', 'Adaptive Quality'],
  },
  {
    icon: Clock,
    title: 'Catch-Up TV',
    description: 'Catch up on supported programs you may have missed and resume viewing when convenient.',
    features: ['Catch-Up Content', 'Pause & Resume', 'Time-Shift Support', 'Easy Navigation'],
  },
  {
    icon: Shield,
    title: '24/7 Support',
    description: 'Get help with setup, account questions, and technical troubleshooting at any time.',
    features: ['Support Center', 'Email Support', 'Support Tickets', 'Setup Assistance'],
  },
];

const OurServices: React.FC = () => (
  <div className="min-h-screen bg-dark-300 py-12 text-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">Our Services</h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-300">Flexible streaming options, broad content access, and support across popular devices.</p>
        </header>

        <div className="mb-16 grid gap-8 md:grid-cols-2">
          {services.map(({ icon: Icon, title, description, features }) => (
            <article key={title} className="rounded-xl border border-gray-800 bg-dark-200 p-8 transition hover:border-primary">
              <div className="mb-6 flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-4"><Icon className="h-8 w-8 text-primary" /></div>
                <div><h2 className="mb-3 text-2xl font-semibold">{title}</h2><p className="leading-relaxed text-gray-400">{description}</p></div>
              </div>
              <ul className="space-y-2 border-t border-gray-800 pt-4">
                {features.map((feature) => <li key={feature} className="flex items-center text-gray-300"><span className="mr-3 h-2 w-2 rounded-full bg-primary" />{feature}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <section className="rounded-xl border border-primary/20 bg-primary/10 p-8 text-center md:p-12">
          <h2 className="mb-6 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-lg text-gray-300">Compare plans or begin with the 36-hour free trial.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/free-trial" className="rounded-lg bg-primary px-8 py-4 font-medium text-white hover:bg-red-700">Start Free Trial</a>
            <a href="/pricing" className="rounded-lg bg-gray-800 px-8 py-4 font-medium text-white hover:bg-gray-700">View Pricing</a>
            <a href="/support" className="rounded-lg bg-gray-800 px-8 py-4 font-medium text-white hover:bg-gray-700">Contact Support</a>
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default OurServices;
