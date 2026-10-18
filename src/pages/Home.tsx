import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';

const TrendingSlider = lazy(() => import('../components/TrendingSlider'));
const Features = lazy(() => import('../components/Features'));
const PricingPlans = lazy(() => import('../components/PricingPlans'));
const FAQ = lazy(() => import('../components/FAQ'));

const Home: React.FC = () => {
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDeferred(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Hero />
      {showDeferred && (
        <Suspense fallback={<div className="h-20" />}>
          <TrendingSlider />
          <Features />
          <section aria-labelledby="sports-spotlight-title" className="px-4 pt-2 sm:px-6 lg:hidden">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-red-500/50 bg-gradient-to-br from-red-800 via-red-950 to-dark-300 p-6 shadow-xl shadow-red-950/40 sm:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-200">
                  <Trophy aria-hidden="true" className="h-4 w-4" />
                  Game day starts here
                </p>
                <h2 id="sports-spotlight-title" className="text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl">
                  Are you ready for some <span className="block text-amber-300">football?</span>
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90">
                  Big plays. Big rivalries. Bring the game-day energy home with Kristal Streams.
                </p>
                <div className="my-5 rounded-2xl border border-white/20 bg-black/40 p-4">
                  <p className="text-sm font-bold uppercase tracking-wider text-white">Your full streaming package</p>
                  <p className="mt-2 text-sm text-gray-200">Football · Sports · PPV · Movies · Series</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-gray-300">12-month streaming plans from</p>
                  <p className="mt-1 text-4xl font-bold text-white">$95 <span className="text-sm font-normal text-gray-300">for 12 months</span></p>
                  <p className="mt-2 text-xs text-gray-300">1 connection · One upfront payment</p>
                  <p className="mt-3 text-sm font-semibold text-amber-200">PPV included at no extra charge.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/ppv" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    See Sports &amp; PPV <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Find Your Streaming Plan
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <PricingPlans />
          <FAQ />
        </Suspense>
      )}
    </>
  );
};

export default Home;
