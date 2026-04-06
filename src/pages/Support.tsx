import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Monitor, Wifi, HelpCircle, BarChart, MessageSquare, Bot, Zap } from 'lucide-react';
import ContactForm from '../components/ContactForm';
import NewsletterSignup from '../components/NewsletterSignup';

interface SupportSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  links: {
    title: string;
    url: string;
  }[];
}

const supportSections: SupportSection[] = [
  {
    id: 'ai-chat',
    title: 'AI Chat Support',
    description: 'Get instant answers to your questions with our intelligent AI assistant.',
    icon: <Bot className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Start AI Chat', url: '/support/ai-chat' },
      { title: 'Common Questions', url: '/support/ai-faq' },
      { title: 'Chat History', url: '/support/chat-history' },
      { title: 'AI Capabilities', url: '/support/ai-help' }
    ]
  },
  {
    id: 'help-center',
    title: 'Help Center',
    description: 'Find answers to common questions and learn how to get the most out of Kristal Streams.',
    icon: <HelpCircle className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Getting Started Guide', url: '/support/getting-started' },
      { title: 'Account & Billing', url: '/support/billing' },
      { title: 'Streaming Issues', url: '/support/streaming' },
      { title: 'FAQ', url: '/support/faq' }
    ]
  },
  {
    id: 'quick-fixes',
    title: 'Quick Fixes',
    description: 'Instant solutions for common streaming issues and technical problems.',
    icon: <Zap className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Buffering Issues', url: '/support/buffering' },
      { title: 'Login Problems', url: '/support/login-help' },
      { title: 'Audio/Video Sync', url: '/support/sync-issues' },
      { title: 'App Crashes', url: '/support/app-crashes' }
    ]
  },
  {
    id: 'setup-guides',
    title: 'Setup Guides',
    description: 'Step-by-step instructions for setting up Kristal Streams on your devices.',
    icon: <Monitor className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Smart TV Setup', url: '/support/tv-setup' },
      { title: 'Mobile Setup', url: '/support/mobile-setup' },
      { title: 'Computer Setup', url: '/support/computer-setup' },
      { title: 'Gaming Console Setup', url: '/support/console-setup' }
    ]
  },
  {
    id: 'device-compatibility',
    title: 'Device Compatibility',
    description: 'Check if your device is compatible with Kristal Streams.',
    icon: <Monitor className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Supported Devices', url: '/support/devices' },
      { title: 'System Requirements', url: '/support/requirements' },
      { title: 'Browser Support', url: '/support/browsers' },
      { title: 'App Versions', url: '/support/apps' }
    ]
  },
  {
    id: 'speed-test',
    title: 'Speed Test',
    description: 'Test your internet connection speed for optimal streaming quality.',
    icon: <Wifi className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Run Speed Test', url: '/support/speed-test' },
      { title: 'Connection Guide', url: '/support/connection' },
      { title: 'Bandwidth Calculator', url: '/support/bandwidth' },
      { title: 'Network Tips', url: '/support/network-tips' }
    ]
  },
  {
    id: 'network-status',
    title: 'Network Status',
    description: 'Check the current status of our streaming services and any known issues.',
    icon: <BarChart className="w-6 h-6 text-primary" />,
    links: [
      { title: 'Service Status', url: '/support/status' },
      { title: 'Known Issues', url: '/support/issues' },
      { title: 'Maintenance Schedule', url: '/support/maintenance' },
      { title: 'Status History', url: '/support/status-history' }
    ]
  }
];

const Support: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (location.state?.scrollToContact) {
      const contactSection = document.getElementById('contact-section');
      if (contactSection) {
        setTimeout(() => {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-4">Support Center</h1>
            <p className="text-gray-400 text-lg">
              Get help with Kristal Streams. Find answers, troubleshooting guides, and contact information.
            </p>
          </div>

          {/* Support Tickets Button */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl p-8 border border-primary/30 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <MessageSquare className="text-primary w-8 h-8 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Get Personalized Help</h2>
              </div>
              <p className="text-gray-400 mb-6">
                Create a support ticket for personalized assistance or try our AI chat for instant answers.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <Link
                  to="/support/ai-chat"
                  className="bg-primary hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <Bot className="w-5 h-5 mr-2" />
                  Try AI Chat Support
                </Link>
                <Link
                  to="/client/support"
                  className="bg-dark-200 hover:bg-dark-100 text-white px-8 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  View Support Tickets
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    const contactSection = document.getElementById('contact-section');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="border border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* Support Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {supportSections.map((section) => (
              <div
                key={section.id}
                className="bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300"
              >
                <div className="flex items-start mb-4">
                  <div className="p-2 bg-dark-200 rounded-lg mr-4">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
                    <p className="text-gray-400 text-sm">{section.description}</p>
                  </div>
                </div>
                <ul className="space-y-2 mt-4">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <Link
                        to={link.url}
                        className="text-gray-300 hover:text-primary transition-colors duration-200 block py-1"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Form Section */}
          <div id="contact-section" className="bg-dark-100 rounded-xl p-8 border border-gray-800 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Contact Support</h2>
              <p className="text-gray-400">
                Can't find what you're looking for? Send us a message and we'll get back to you.
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Newsletter Signup */}
          <div>
            <NewsletterSignup 
              title="Stay Informed"
              description="Get updates about new features, maintenance schedules, and important announcements."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;