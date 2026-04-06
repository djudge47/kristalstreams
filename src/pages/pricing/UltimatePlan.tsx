import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Diamond, Check, ArrowLeft } from 'lucide-react';

interface LocationState {
  plan: string;
  price: number;
  connections: number;
  annually: boolean;
}

const UltimatePlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const connectionOptions = [1, 2, 3, 4, 5];
  const [selectedConnections, setSelectedConnections] = useState(state?.connections || 4);

  if (!state) {
    navigate('/pricing');
    return null;
  }

  const planPriceMap: Record<number, number> = { 1: 95, 2: 165, 3: 235, 4: 305, 5: 375 };
  const finalPriceTotal = planPriceMap[selectedConnections] ?? 0;

  const features = [
    '4 Connections',
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
        plan: 'ultimate',
        interval: state.annually ? 'yearly' : 'monthly',
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

          <div className="bg-dark-100 rounded-2xl border border-indigo-500 overflow-hidden relative shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow duration-300">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-indigo-500/50">
              ULTIMATE
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500/30 via-indigo-500/15 to-dark-100 p-8 border-b border-indigo-500/20">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 p-4 rounded-xl mr-4 shadow-lg shadow-indigo-500/50">
                  <Diamond className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Ultimate Plan</h1>
                  <p className="text-gray-400">Maximum Value - 12 Months (61.1% OFF)</p>
                </div>
              </div>

              <div className="flex items-end mb-6">
                <span className="text-5xl font-bold text-white">${finalPriceTotal.toLocaleString()}</span>
                <span className="text-xl text-gray-400 ml-2">/12 months</span>
              </div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Number of Connections</h4>
                <div className="flex gap-2">
                  {connectionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedConnections(count)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        selectedConnections === count
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-dark-200 text-gray-300 border-gray-700 hover:border-indigo-400/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-indigo-400 font-medium">
                {selectedConnections} Connection{selectedConnections > 1 ? 's' : ''} • 12 Months
              </div>
            </div>

            <div className="p-8 bg-gradient-to-b from-dark-100 to-dark-200/50">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-indigo-500/20">What's Included</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-indigo-500/10 transition-colors">
                    <Check className="text-indigo-400 w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 hover:scale-105"
                >
                  Get Ultimate Plan - 12 Months
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 rounded-xl border border-indigo-500/20 shadow-inner">
                <h3 className="text-indigo-300 font-semibold mb-2">The Ultimate Experience!</h3>
                <p className="text-gray-300 text-sm">
                  Get the ultimate streaming experience with 4 connections and all premium features for the best value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimatePlan;