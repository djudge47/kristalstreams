import React from 'react';
import { Award, Clock, Globe, Shield, Users } from 'lucide-react';

const values = [
  { icon: Globe, title: 'Global Coverage', text: 'Channels and entertainment from major regions and languages.' },
  { icon: Award, title: 'Premium Quality', text: 'HD and 4K options with a focus on smooth playback.' },
  { icon: Clock, title: '24/7 Support', text: 'Help is available whenever customers need assistance.' },
  { icon: Shield, title: 'Secure & Reliable', text: 'Secure connections and dependable streaming infrastructure.' },
  { icon: Users, title: 'Multi-Device Support', text: 'Watch on supported TVs, phones, tablets, computers, and streaming devices.' },
];

const AboutUs: React.FC = () => (
  <div className="min-h-screen bg-dark-300 py-12 text-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">About Kristal Streams</h1>
          <p className="text-xl text-gray-300">Premium entertainment across your favorite devices</p>
        </header>

        <section className="mb-16 rounded-xl border border-gray-800 bg-dark-200 p-8 md:p-12">
          <h2 className="mb-6 text-3xl font-bold text-primary">Our Story</h2>
          <div className="space-y-4 text-lg leading-relaxed text-gray-300">
            <p>Kristal Streams combines entertainment and technology to provide a convenient streaming experience across supported devices.</p>
            <p>With 21,000+ channels, movies, TV shows, sports coverage, and international content, customers can explore a broad library from one service.</p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-bold">Why Choose Us</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-gray-800 bg-dark-200 p-6 transition hover:border-primary">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3"><Icon className="h-8 w-8 text-primary" /></div>
                  <div><h3 className="mb-2 text-xl font-semibold">{title}</h3><p className="text-gray-400">{text}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/10 p-8 text-center md:p-12">
          <h2 className="mb-6 text-3xl font-bold">Ready to Start?</h2>
          <p className="mb-8 text-lg text-gray-300">Try the service or compare the available plans.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/free-trial" className="rounded-lg bg-primary px-8 py-4 font-medium text-white hover:bg-red-700">Start Free Trial</a>
            <a href="/pricing" className="rounded-lg bg-gray-800 px-8 py-4 font-medium text-white hover:bg-gray-700">View Plans</a>
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default AboutUs;
