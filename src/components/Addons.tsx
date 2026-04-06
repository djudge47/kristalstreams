import React from 'react';
import { PlusCircle } from 'lucide-react';

interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  popular?: boolean;
}

const addons: Addon[] = [
  {
    id: 1,
    name: 'Replacement Filter Pack',
    description: 'Set of 3 high-efficiency filters that capture 99% of allergens, pollen, and dust mites.',
    price: 29.99,
    image: 'https://images.pexels.com/photos/3938465/pexels-photo-3938465.jpeg?auto=compress&cs=tinysrgb&w=600',
    popular: true
  },
  {
    id: 2,
    name: 'Brush Roll Kit',
    description: 'Dual multi-surface rubber brushes that adjust and flex to stay in constant contact with floors.',
    price: 34.99,
    image: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 3,
    name: 'Virtual Wall Barriers',
    description: 'Set of 2 virtual wall barriers to block off-limit areas like pet bowls or delicate decor.',
    price: 49.99,
    image: 'https://images.pexels.com/photos/4108714/pexels-photo-4108714.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 4,
    name: 'Clean Base Dust Bags',
    description: 'Pack of 3 replacement dust bags for automatic dirt disposal, holds up to 60 days of debris.',
    price: 19.99,
    image: 'https://images.pexels.com/photos/6195126/pexels-photo-6195126.jpeg?auto=compress&cs=tinysrgb&w=600',
    popular: true
  },
  {
    id: 5,
    name: 'Extended Warranty',
    description: 'Additional 12-month warranty coverage for complete peace of mind.',
    price: 59.99,
    image: 'https://images.pexels.com/photos/6195263/pexels-photo-6195263.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: 6,
    name: 'Premium Support Package',
    description: 'Priority 24/7 customer service, remote troubleshooting, and annual maintenance check.',
    price: 79.99,
    image: 'https://images.pexels.com/photos/8085845/pexels-photo-8085845.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

const Addons: React.FC = () => {
  return (
    <section id="addons" className="py-16 md:py-24 bg-white px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Enhance Your Experience</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Customize your subscription with add-ons and accessories designed to optimize your Roomba's performance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {addons.map((addon) => (
            <div 
              key={addon.id} 
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md group"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={addon.image} 
                  alt={addon.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {addon.popular && (
                  <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{addon.name}</h3>
                <p className="text-gray-600 mb-4 h-24">{addon.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">${addon.price}</span>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <PlusCircle size={18} className="mr-1" /> Add to Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Addons;