import React, { useEffect, useState, memo } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getFooterLinks, getFooterSocialLinks } from '../lib/api';
import NewsletterSignup from './NewsletterSignup';

interface FooterLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

const Footer: React.FC = memo(() => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchFooterContent = async () => {
      try {
        setError(null);
        const [linksData, socialLinksData] = await Promise.all([
          getFooterLinks(),
          getFooterSocialLinks()
        ]);
        setLinks(linksData);
        setSocialLinks(socialLinksData);
      } catch (err) {
        console.error('Error fetching footer content:', err);
        setError('Failed to load footer content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFooterContent();
  }, []);

  const getSocialIcon = (platform: string) => {
    if (!platform) return null;
    
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
      case 'discord':
        return <div className="w-5 h-5 flex items-center justify-center text-white font-bold text-sm">D</div>;
      case 'tiktok':
        return <div className="w-5 h-5 flex items-center justify-center text-white font-bold text-sm">T</div>;
      default:
        return null;
    }
  };

  const quickLinks = links.filter(link => link.category === 'Quick Links');
  const supportLinks = links.filter(link => link.category === 'Support');
  const companyLinks = links.filter(link => link.category === 'Company');
  const featureLinks = links.filter(link => link.category === 'Features');

  if (loading) {
    return (
      <footer className="bg-dark-300 text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-dark-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-dark-200 rounded w-3/4"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  if (error) {
    return (
      <footer className="bg-dark-300 text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </footer>
    );
  }

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
                  key={social.id}
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
                <a 
                  href="/support"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a 
                  href="/terms"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a 
                  href="/refund-policy"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a 
                  href="/privacy"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/about"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="/services"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Our Services
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Streaming Services</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <a 
                  href="/reselling"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Reselling
                </a>
              </li>
              <li>
                <a 
                  href="/web-tv-player"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Web TV Player
                </a>
              </li>
              <li>
                <Link
                  to="/ppv"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  PPV
                </Link>
              </li>
              <li>
                <a 
                  href="/support"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Help & Resources</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/news"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  News
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/testimonials"
                  className="text-gray-400 hover:text-primary transition-colors duration-200 text-sm"
                >
                  Testimonials
                </a>
              </li>
            </ul>
            
            <h4 className="text-lg font-semibold mb-4 mt-6 text-white">Contact Support</h4>
            <ul className="space-y-3">
              
            </ul>
          </div>
        </div>

        {/* Newsletter Signup Section */}
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
              <a
                href="/privacy"
                className="text-gray-500 hover:text-primary text-sm transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-gray-500 hover:text-primary text-sm transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                className="text-gray-500 hover:text-primary text-sm transition-colors duration-200"
              >
                Cookie Policy
              </a>
              <a
                href="/accessibility"
                className="text-gray-500 hover:text-primary text-sm transition-colors duration-200"
              >
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