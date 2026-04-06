import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LocationState {
  price: number;
  annually: boolean;
}

const AdultPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  if (!state) {
    navigate('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Adult Content Add-on</h1>
          <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Selected Add-on</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Add-on Type</span>
                  <span className="text-white font-medium">Adult Content Access</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">${state.annually ? 4 : 5}/month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Billing</span>
                  <span className="text-white font-medium">{state.annually ? 'Annual' : 'Monthly'}</span>
                </div>
                {state.annually && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Annual Total</span>
                    <span className="text-white font-medium">${4 * 12}/year</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <button 
                onClick={() => navigate('/register')}
                className="w-full bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Continue to Registration
              </button>
              <button 
                onClick={() => navigate('/pricing')}
                className="w-full bg-dark-200 hover:bg-dark-100 text-white px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Back to Plans
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdultPlan;