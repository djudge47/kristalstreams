import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Check, ArrowLeft } from 'lucide-react';

interface LocationState {
  plan: string;
  price: number;
  connections: number;
  annually: boolean;
}

const StandardPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  const connectionOptions = [1, 2, 3, 4, 5];
  const [selectedConnections, setSelectedConnections] = useState(state?.connections || 2);

  if (!state) {
    navigate('/pricing');
    return null;
  }

  const planPriceMap: Record<number, number> = { 1: 45, 2: 75, 3: 110, 4: 140, 5: 175 };
  const finalPriceTotal = planPriceMap[selectedConnections] ?? 0;

  const features = [
    '2 Connections',
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
        plan: 'standard',
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

          <div className="bg-dark-100 rounded-2xl border border-green-500 overflow-hidden relative shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-shadow duration-300">
            <div className="bg-gradient-to-br from-green-500/30 via-green-500/15 to-dark-100 p-8 border-b border-green-500/20">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-xl mr-4 shadow-lg shadow-green-500/50">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Standard Plan</h1>
                  <p className="text-gray-400">For Small Groups - 3 Months (27.8% OFF)</p>
                </div>
              </div>

              <div className="flex items-end mb-6">
                <span className="text-5xl font-bold text-white">${finalPriceTotal.toLocaleString()}</span>
                <span className="text-xl text-gray-400 ml-2">/3 months</span>
              </div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Number of Connections</h4>
                <div className="flex gap-2">
                  {connectionOptions.map((count) => (
                    <button
                      key={count}
                      onClick={() => setSelectedConnections(count)}
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        selectedConnections === count
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-dark-200 text-gray-300 border-gray-700 hover:border-green-400/70'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

              <div className="text-green-400 font-medium">
                {selectedConnections} Connection{selectedConnections > 1 ? 's' : ''} • 3 Months
              </div>
            </div>

            <div className="p-8 bg-gradient-to-b from-dark-100 to-dark-200/50">
              <h2 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-green-500/20">What's Included</h2>
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center p-2 rounded-lg hover:bg-green-500/10 transition-colors">
                    <Check className="text-green-400 w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-gray-200">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg shadow-green-500/50 hover:shadow-xl hover:shadow-green-500/70 hover:scale-105"
                >
                  Get Standard Plan - 3 Months
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="mt-8 p-5 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 shadow-inner">
                <h3 className="text-green-300 font-semibold mb-2">Great for Families!</h3>
                <p className="text-gray-300 text-sm">
                  The Standard plan offers excellent value with 2 connections and comprehensive streaming features for families.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardPlan;