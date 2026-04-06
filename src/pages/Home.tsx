import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import PricingPlans from '../components/PricingPlans';
import FAQ from '../components/FAQ';
import TrendingSlider from '../components/TrendingSlider';

const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <TrendingSlider />
      <Features />
      <PricingPlans />
      <FAQ />
    </>
  );
};

export default Home;