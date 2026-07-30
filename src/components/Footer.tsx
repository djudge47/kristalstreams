import React, { memo } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

const Footer: React.FC = memo(() => {
  const currentYear = new Date().getFullYear();
  const supportEmail = 'info@kristalstream.com';

  const socialLinks = [
    { platform: 'facebook', url: 'https://www.facebook.com/kristalstreams' },
    { platform: 'twitter', url: 'https://x.com/kristalstreams' },
    { platform: 'instagram', url: 'https://www.instagram.com/kristalstreams' },
    { platform: 'youtube', url: 'https://www.youtube.com/@kristalstreams' },
  ];

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook size={20} />;
      case 'twitter':
        return <Twitter size={20} />;
      case 'instagram':
        return <Instagram size={20} />;
      case 'youtube':
        return <Youtube size={20} />;
      case 'linkedin':
        return <Linkedin size={20} />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-dark-300 text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <img src="/logo/ks-mark.png" alt="Kristal Streams" className="h-7 w-auto mr-2" />
              <h3 className="text-xl font-bold text-primary">Kristal Streams</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Your premier destination for unlimited entertainment with 18,000+ channels, movies, and shows streaming in crystal-clear HD and 4K quality worldwide.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-all duration-200 transform hover:scale-110"
                  aria-label={`Follow us on ${social.platform}`}
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Client Portal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Our Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Streaming Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/ppv" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  PPV
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Help & Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/news" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  News
                </Link>
              </li>
              <li>
                <Link to="/support/faq" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm">
                  Testimonials
                </Link>
              </li>
            </ul>
            
            <h4 className="text-lg font-semibold mb-4 mt-6 text-white">Contact Support</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-start group"
                  aria-label={`Email Kristal Streams support at ${supportEmail}`}
                >
                  <Mail size={18} className="text-primary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium text-sm mb-1 group-hover:text-primary transition-colors duration-200">Email Support</div>
                    <span className="text-gray-400 text-sm group-hover:text-primary transition-colors duration-200 underline-offset-4 group-hover:underline">
                      {supportEmail}
                    </span>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="max-w-md mx-auto">
            <NewsletterSignup 
              title="Stay Connected"
              description="Get the latest updates and exclusive offers"
              compact={true}
              className="text-center"
            />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              &copy; {currentYear} Kristal Streams. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-gray-500 hover:text-primary text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-primary text-sm transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-500 hover:text-primary text-sm transition-colors duration-200">
                Cookie Policy
              </Link>
              <a href="/accessibility" className="text-gray-500 hover:text-primary text-sm transition-colors duration-200">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
