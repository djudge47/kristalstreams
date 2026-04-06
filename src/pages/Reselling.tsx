import React from 'react';
import { DollarSign, Users, TrendingUp, Shield, Headphones, Star, Package, Award } from 'lucide-react';

const Reselling: React.FC = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: 'High Profit Margins',
      description: 'Competitive wholesale pricing allows you to set your own retail prices and maximize profits.'
    },
    {
      icon: Users,
      title: 'White Label Solution',
      description: 'Brand the service as your own. Custom branding, logos, and domain names available.'
    },
    {
      icon: TrendingUp,
      title: 'Recurring Revenue',
      description: 'Build a stable income stream with monthly subscriptions and loyal customer base.'
    },
    {
      icon: Shield,
      title: 'Reliable Service',
      description: '99.9% uptime guarantee and premium infrastructure ensure customer satisfaction.'
    },
    {
      icon: Headphones,
      title: 'Dedicated Support',
      description: '24/7 support for you and your customers. Technical assistance whenever needed.'
    },
    {
      icon: Star,
      title: 'Premium Content',
      description: 'Access to 18,000+ channels, movies, sports, and on-demand content to offer customers.'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      credits: '10 Credits',
      price: '$50',
      features: [
        '10 subscription credits',
        'Basic reseller panel',
        'Email support',
        'Standard commission rate',
        'Access to all content'
      ]
    },
    {
      name: 'Professional',
      credits: '25 Credits',
      price: '$100',
      popular: true,
      features: [
        '25 subscription credits',
        'Advanced reseller panel',
        'Priority support',
        'Enhanced commission rate',
        'White label option',
        'Marketing materials'
      ]
    },
    {
      name: 'Enterprise',
      credits: '100 Credits',
      price: '$350',
      features: [
        '100 subscription credits',
        'Premium reseller panel',
        '24/7 dedicated support',
        'Highest commission rate',
        'Full white label',
        'Marketing materials',
        'Custom branding',
        'API access'
      ]
    }
  ];

  const features = [
    {
      icon: Package,
      title: 'Easy Management',
      description: 'Intuitive reseller panel to manage customers, subscriptions, and billing all in one place.'
    },
    {
      icon: Award,
      title: 'Training & Resources',
      description: 'Comprehensive guides, video tutorials, and marketing materials to help you succeed.'
    },
    {
      icon: Users,
      title: 'Customer Dashboard',
      description: 'Your customers get their own portal to manage devices, view channels, and contact support.'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Advanced security measures protect both you and your customers with encrypted connections.'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-300 text-white py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Become a Reseller</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Start your own IPTV business with our comprehensive reseller program.
              Earn recurring income by offering premium streaming services to your customers.
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Why Choose Our Reseller Program?</h2>
              <p className="text-gray-300 text-lg">
                Join hundreds of successful resellers worldwide who trust us for reliable service and support
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-dark-200/50 rounded-xl p-6 border border-gray-800 text-center"
                  >
                    <div className="bg-primary/10 p-4 rounded-lg inline-block mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-400 text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Reseller Plans</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`bg-dark-200 rounded-xl p-8 border ${
                    plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-gray-800'
                  } relative transform hover:scale-105 transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-primary text-sm font-semibold mb-4">{plan.credits}</div>
                    <div className="text-4xl font-bold mb-2">{plan.price}</div>
                    <div className="text-gray-400 text-sm">one-time purchase</div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-gray-300">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/support"
                    className={`block text-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      plan.popular
                        ? 'bg-primary hover:bg-red-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    Get Started
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 text-sm mt-6">
              * Credits are used to create customer subscriptions. Contact us for custom enterprise solutions.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Reseller Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-dark-200 rounded-xl p-8 md:p-12 border border-gray-800 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Sign Up</h3>
                <p className="text-gray-400 text-sm">
                  Choose a reseller plan and create your account
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Set Up</h3>
                <p className="text-gray-400 text-sm">
                  Configure your reseller panel and branding
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Add Customers</h3>
                <p className="text-gray-400 text-sm">
                  Start adding customers and creating subscriptions
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">4</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Earn Income</h3>
                <p className="text-gray-400 text-sm">
                  Build your business and earn recurring revenue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20 mb-16">
            <h2 className="text-3xl font-bold mb-6 text-center">What You Get</h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Full access to reseller management panel</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Ability to create and manage customer accounts</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Access to all 18,000+ channels and content</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>White label branding options</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Marketing materials and resources</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>24/7 technical support for you and customers</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Real-time customer usage statistics</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Automated billing and subscription management</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Training videos and documentation</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <span>Priority updates and new features</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Business?</h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join our successful reseller network today and start building a profitable IPTV business.
              Get started in minutes with our easy setup process.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/support"
                className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Become a Reseller
              </a>
              <a
                href="/support"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reselling;
