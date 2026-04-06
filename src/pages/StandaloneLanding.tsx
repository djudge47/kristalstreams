import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Star, 
  Check, 
  ArrowRight, 
  Tv, 
  Smartphone, 
  Monitor, 
  Globe,
  Shield,
  Zap,
  Users,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone
} from 'lucide-react';

const StandaloneLanding: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleStartTrial = () => {
    window.open('https://kristalstreams.com/free-trial', '_blank');
  };

  const handleViewPricing = () => {
    window.open('https://kristalstreams.com/pricing', '_blank');
  };

  const handleSignUp = () => {
    window.open('https://kristalstreams.com/register', '_blank');
  };

  const features = [
    {
      icon: <Tv className="w-8 h-8 text-red-500" />,
      title: "18,000+ Live Channels",
      description: "Access thousands of live TV channels from around the world in crystal-clear HD and 4K quality."
    },
    {
      icon: <Globe className="w-8 h-8 text-red-500" />,
      title: "Global Content",
      description: "International channels and content from every major region and language, all in one place."
    },
    {
      icon: <Zap className="w-8 h-8 text-red-500" />,
      title: "Ultra-Fast Streaming",
      description: "Experience lightning-fast streaming with minimal buffering and instant channel switching."
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "Secure & Reliable",
      description: "Encrypted connections and 99.9% uptime guarantee for uninterrupted entertainment."
    },
    {
      icon: <Monitor className="w-8 h-8 text-red-500" />,
      title: "Multi-Device Support",
      description: "Watch on Smart TVs, phones, tablets, computers, and streaming devices simultaneously."
    },
    {
      icon: <Clock className="w-8 h-8 text-red-500" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support to help you with any questions or technical issues."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Family Entertainment Enthusiast",
      content: "Kristal Streams has completely transformed our family's entertainment experience. The variety of channels and crystal-clear quality is unmatched!",
      rating: 5,
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: "Michael Chen",
      role: "Sports Fan",
      content: "As a sports enthusiast, I love having access to live games from around the world. The streaming quality is fantastic and never buffers during crucial moments.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: "Emma Rodriguez",
      role: "International Content Lover",
      content: "The international channel selection is incredible. I can watch content from my home country and discover new shows from around the globe.",
      rating: 5,
      avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150"
    }
  ];

  const stats = [
    { number: "18,000+", label: "Live Channels" },
    { number: "50+", label: "Countries" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-2xl font-bold text-red-500">
              <PlayCircle className="w-8 h-8 mr-2" />
              Kristal Streams
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleStartTrial}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900/70"></div>
          <img 
            src="https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Streaming Entertainment"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Stream the World's
              <span className="block text-red-500">Best Entertainment</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Access 18,000+ live channels, movies, and shows from around the globe. 
              Experience premium streaming in stunning HD and 4K quality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={handleStartTrial}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Free Trial
              </button>
              <button
                onClick={handleViewPricing}
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center justify-center"
              >
                View Pricing
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                  <div className="text-2xl md:text-3xl font-bold text-red-500">{stat.number}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Kristal Streams?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the future of streaming with cutting-edge technology and unparalleled content variety.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-900 p-8 rounded-xl border border-gray-700 hover:border-red-500 transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="mb-6 p-3 bg-gray-800 inline-block rounded-lg group-hover:bg-red-500/10 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Compatibility Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Watch Anywhere, Anytime
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Stream on all your favorite devices with seamless synchronization across platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-center">
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Smartphone className="h-12 w-12 text-red-500" />
              </div>
              <span className="text-gray-400 text-center">Mobile</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Tv className="h-12 w-12 text-red-500" />
              </div>
              <span className="text-gray-400 text-center">Smart TV</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Monitor className="h-12 w-12 text-red-500" />
              </div>
              <span className="text-gray-400 text-center">Computer</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Monitor className="h-12 w-12 text-orange-500" />
              </div>
              <span className="text-gray-400 text-center">Fire TV</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Monitor className="h-12 w-12 text-purple-500" />
              </div>
              <span className="text-gray-400 text-center">Roku</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Monitor className="h-12 w-12 text-gray-300" />
              </div>
              <span className="text-gray-400 text-center">Apple TV</span>
            </div>
            <div className="flex flex-col items-center group">
              <div className="bg-gray-800 p-6 rounded-xl mb-4 group-hover:bg-red-500/10 transition-colors duration-300">
                <Monitor className="h-12 w-12 text-blue-500" />
              </div>
              <span className="text-gray-400 text-center">Chromecast</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Join millions of satisfied customers who have made Kristal Streams their entertainment destination.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-700">
              <div className="flex items-center mb-6">
                <img 
                  src={testimonials[currentTestimonial].avatar}
                  alt={testimonials[currentTestimonial].name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="text-xl font-semibold text-white">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-300 text-lg italic leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </p>
            </div>

            <button 
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors duration-200"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button 
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors duration-200"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === currentTestimonial ? 'bg-red-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Choose the perfect plan for your entertainment needs. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-red-500 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">Basic</h3>
              <div className="text-4xl font-bold text-red-500 mb-6">$20<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  1 Connection
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  HD Streaming
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  Basic Channels
                </li>
              </ul>
              <button 
                onClick={handleSignUp}
                className="w-full bg-gray-700 hover:bg-red-500 text-white py-3 rounded-lg transition-colors duration-200"
              >
                Choose Basic
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-8 border-2 border-red-500 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Premium</h3>
              <div className="text-4xl font-bold text-red-500 mb-6">$35<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  4 Connections
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  4K Ultra HD
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  All Channels
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  Premium Support
                </li>
              </ul>
              <button 
                onClick={handleSignUp}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors duration-200"
              >
                Choose Premium
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-red-500 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-4">Ultimate</h3>
              <div className="text-4xl font-bold text-red-500 mb-6">$45<span className="text-lg text-gray-400">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  4 Connections
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  4K Ultra HD
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  All Channels + PPV
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  VIP Support
                </li>
              </ul>
              <button 
                onClick={handleSignUp}
                className="w-full bg-gray-700 hover:bg-red-500 text-white py-3 rounded-lg transition-colors duration-200"
              >
                Choose Ultimate
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleViewPricing}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              View All Plans & Features
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Streaming?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join millions of satisfied customers and experience the future of entertainment. 
              Start your free trial today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartTrial}
                className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Free Trial
              </button>
              <button
                onClick={() => window.open('https://kristalstreams.com/support', '_blank')}
                className="border-2 border-white text-white hover:bg-white hover:text-red-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 flex items-center justify-center"
              >
                Learn More
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-8 text-white/80">
              <div className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                <span>36-Hour Free Trial</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default StandaloneLanding;