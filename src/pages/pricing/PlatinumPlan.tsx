import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Check, ArrowLeft } from 'lucide-react';

interface LocationState {
  tier: string;
  months: number;
  connections: number;
  duration: string;
  savings?: string;
}

const PlatinumPlan: React.FC = () => {
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
    'Quick Activation',
    'HD FHD 4K Channels',
    'PC/MAC Android/iOS SmartTV',
    'M3U & MAG & Enigma Format',
    'TV Guide (EPG)',
    'No Buffering/Freezing',
    'High Stable Bitrates',
    'Emergency Support',
    'Custom Playlists',
    'Web TV Player'
  ];

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        plan: 'ultimate' as const,
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

          <div className="bg-dark-100 rounded-2xl border border-purple-400 overflow-hidden relative shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow duration-300">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-purple-500/50">
              PLATINUM
            </div>
            
            <div className="bg-gradient-to-br from-purple-400/30 via-purple-400/15 to-dark-100 p-8 border-b border-purple-400/20">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-purple-300 to-purple-500 p-4 rounded-xl mr-4 shadow-lg shadow-purple-500/50">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Platinum Plan</h1>
                  <p className="text-gray-400">Best Value - 12 Months (61.1% OFF)</p>
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
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'bg-dark-200 text-gray-300 border-gray-700 hover:border-purple-400/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-purple-400 font-medium">
                {selectedConnections} Connection{selectedConnections > 1 ? 's' : ''} • 12 Months
              </div>
            </div>

            <div className="p-8 bg-gradient-to-b from-dark-100 to-dark-200/50">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-purple-400/20">What's Included</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-purple-400/10 transition-colors">
                    <Check className="text-purple-400 w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 hover:scale-105"
                >
                  Get Platinum Plan - 12 Months
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-400/20 shadow-inner">
                <h3 className="text-purple-300 font-semibold mb-2">Best for Large Families!</h3>
                <p className="text-gray-300 text-sm">
                  Get everything Kristal Streams has to offer with 4 connections,
                  premium support, and full access across all supported devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatinumPlan;