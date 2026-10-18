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
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950 via-dark-100 to-dark-300 p-6 shadow-xl shadow-black/30 sm:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative">
                <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
                  <Trophy aria-hidden="true" className="h-4 w-4" />
                  Football · Sports · PPV
                </p>
                <h2 id="sports-spotlight-title" className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Football season.<br />Big-event value.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-300 sm:text-base">
                  Football, fight nights and more. Explore the events and find your Kristal Streams package.
                </p>
                <div className="my-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">12-month plans from</p>
                  <p className="mt-1 text-4xl font-bold text-white">$95 <span className="text-sm font-normal text-gray-300">for 12 months</span></p>
                  <p className="mt-2 text-xs text-gray-300">1 connection · One upfront payment</p>
                  <p className="mt-2 text-xs text-gray-400">1-month plans also available from $20.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/ppv" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Explore Sports &amp; PPV <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                  <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    View Packages
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
