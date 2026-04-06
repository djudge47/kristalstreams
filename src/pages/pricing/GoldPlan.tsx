import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, Check, ArrowLeft } from 'lucide-react';

interface LocationState {
  tier: string;
  months: number;
  connections: number;
  duration: string;
  savings?: string;
}

const GoldPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const connectionOptions = [1, 2, 3, 4, 5];
  const [selectedConnections, setSelectedConnections] = useState(state?.connections || 3);

  if (!state) {
    navigate('/pricing');
    return null;
  }

  const planPriceMap: Record<number, number> = { 1: 60, 2: 105, 3: 150, 4: 195, 5: 240 };
  const finalPriceTotal = planPriceMap[selectedConnections] ?? 0;

  const features = [
    '3 Connections',
    'Live TV and EPG Guide',
    'Movies and VOD Shows',
    'Compatible with all devices',
    'Anti-Freeze Technology',
    'PPV and Sports Events',
    'No Setup Fees',
    'Cancel Anytime',
    '36-Hour Free Trial'
  ];

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        plan: 'premium' as const,
        interval: 'yearly' as const,
        price: finalPriceTotal
      }
    });
  };

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Pricing
          </button>

          <div className="bg-dark-100 rounded-2xl border border-yellow-500 overflow-hidden relative shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-shadow duration-300">
            <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              MOST POPULAR
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/30 via-yellow-500/15 to-dark-100 p-8 border-b border-yellow-500/20">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-xl mr-4 shadow-lg shadow-yellow-500/50">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Gold Plan</h1>
                  <p className="text-gray-400">Most Popular - 6 Months (50% OFF)</p>
                </div>
              </div>
              
              <div className="flex items-end mb-6">
                <span className="text-5xl font-bold text-white">${finalPriceTotal.toLocaleString()}</span>
                <span className="text-xl text-gray-400 ml-2">/6 months</span>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Number of Connections</h4>
                <div className="flex gap-2">
                  {connectionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedConnections(count)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        selectedConnections === count
                          ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-dark-200 text-gray-300 border-gray-700 hover:border-yellow-500/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-yellow-500 font-medium">
                {selectedConnections} Connection{selectedConnections > 1 ? 's' : ''} • 6 Months
              </div>
            </div>

            <div className="p-8 bg-gradient-to-b from-dark-100 to-dark-200/50">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-yellow-500/20">What's Included</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-yellow-500/10 transition-colors">
                    <Check className="text-yellow-400 w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/70 hover:scale-105"
                >
                  Get Gold Plan - 6 Months
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20 shadow-inner">
                <h3 className="text-yellow-300 font-semibold mb-2">Perfect for Small Families!</h3>
                <p className="text-gray-300 text-sm">
                  The Gold plan offers the perfect balance of features and value with 3 connections and premium content for small families.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldPlan;