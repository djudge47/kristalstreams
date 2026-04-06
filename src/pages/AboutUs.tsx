import React from 'react';
import { Users, Award, Globe, Shield, Clock, Heart } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-300 text-white py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Kristal Streams</h1>
            <p className="text-xl text-gray-300">
              Your trusted partner in premium entertainment streaming
            </p>
          </div>

          <div className="mb-16">
            <div className="bg-dark-200 rounded-xl p-8 md:p-12 border border-gray-800">
              <h2 className="text-3xl font-bold mb-6 text-primary">Our Story</h2>
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  Founded with a vision to revolutionize the streaming experience, Kristal Streams has grown
                  to become one of the most trusted names in premium IPTV services. We bring together a passion
                  for entertainment and cutting-edge technology to deliver exceptional streaming experiences to
                  households worldwide.
                </p>
                <p>
                  With over 18,000+ channels, thousands of movies and TV shows, and comprehensive sports coverage,
                  we provide our customers with unparalleled access to global entertainment. Our commitment to
                  quality, reliability, and customer satisfaction has made us the preferred choice for streaming
                  enthusiasts around the world.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
                    <p className="text-gray-400">
                      Access content from around the world with channels in multiple languages and
                      regional programming.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                    <p className="text-gray-400">
                      Crystal-clear HD and 4K streaming with minimal buffering and maximum reliability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                    <p className="text-gray-400">
                      Our dedicated support team is always available to assist you with any questions
                      or technical issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
                    <p className="text-gray-400">
                      Advanced security measures and reliable infrastructure ensure your streaming
                      experience is safe and uninterrupted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Multi-Device Support</h3>
                    <p className="text-gray-400">
                      Watch on any device - Smart TV, smartphone, tablet, computer, or streaming device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-200 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Customer First</h3>
                    <p className="text-gray-400">
                      Your satisfaction is our priority. We continuously improve our service based on
                      customer feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8 md:p-12 border border-primary/20">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                To provide accessible, high-quality streaming services that bring the world's best
                entertainment to your fingertips. We believe everyone deserves access to premium content
                without compromise on quality or affordability.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Through innovation, dedication, and a customer-first approach, we strive to make
                entertainment more accessible, enjoyable, and convenient for families worldwide.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Join Our Growing Community</h2>
            <p className="text-gray-300 text-lg mb-8">
              Experience the difference with Kristal Streams. Start your free trial today and discover
              why thousands of customers trust us for their entertainment needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/free-trial"
                className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
              </a>
              <a
                href="/pricing"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                View Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
