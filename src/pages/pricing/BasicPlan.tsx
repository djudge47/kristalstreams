import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, Check, ArrowLeft } from 'lucide-react';

interface LocationState {
  plan: string;
  price: number;
  connections: number;
  annually: boolean;
}

const BasicPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const connectionOptions = [1, 2, 3, 4, 5];
  const [selectedConnections, setSelectedConnections] = useState(state?.connections || 1);

  if (!state) {
    navigate('/pricing');
    return null;
  }

  const planPriceMap: Record<number, number> = { 1: 20, 2: 35, 3: 50, 4: 65, 5: 80 };
  const finalPriceTotal = planPriceMap[selectedConnections] ?? 0;

  const features = [
    '1 Connection',
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
        plan: 'basic',
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

          <div className="bg-dark-100 rounded-2xl border border-blue-500 overflow-hidden relative shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow duration-300">
            <div className="bg-gradient-to-br from-blue-500/30 via-blue-500/15 to-dark-100 p-8 border-b border-blue-500/20">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-4 rounded-xl mr-4 shadow-lg shadow-blue-500/50">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Basic Plan</h1>
                  <p className="text-gray-400">Quick Start - 1 Month</p>
                </div>
              </div>

              <div className="flex items-end mb-6">
                <span className="text-5xl font-bold text-white">${finalPriceTotal.toLocaleString()}</span>
                <span className="text-xl text-gray-400 ml-2">/1 month</span>
              </div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Number of Connections</h4>
                <div className="flex gap-2">
                  {connectionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedConnections(count)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        selectedConnections === count
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-dark-200 text-gray-300 border-gray-700 hover:border-blue-400/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-blue-400 font-medium">
                {selectedConnections} Connection{selectedConnections > 1 ? 's' : ''} • 1 Month
              </div>
            </div>

            <div className="p-8 bg-gradient-to-b from-dark-100 to-dark-200/50">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-blue-500/20">What's Included</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-blue-500/10 transition-colors">
                    <Check className="text-blue-400 w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 hover:scale-105"
                >
                  Get Basic Plan - 1 Month
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 shadow-inner">
                <h3 className="text-blue-300 font-semibold mb-2">Perfect for Testing!</h3>
                <p className="text-gray-300 text-sm">
                  Try Kristal Streams with our Basic plan featuring 1 connection and all essential streaming features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicPlan;