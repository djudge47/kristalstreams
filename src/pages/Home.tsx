import React, { lazy, Suspense, useEffect, useState } from 'react';
import Hero from '../components/Hero';
import DemoReel from '../components/DemoReel';

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
      <DemoReel />
      {showDeferred && (
        <Suspense fallback={<div className="h-20" />}>
          <TrendingSlider />
          <Features />
          <PricingPlans />
          <FAQ />
        </Suspense>
      )}
    </>
  );
};

export default Home;
