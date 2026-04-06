import React, { useState, useEffect, memo, useCallback } from 'react';
import { Menu, X, User, Home, ChevronDown, PlayCircle, Facebook, Twitter, Instagram, Youtube, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get initial user state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      // Redirect on sign in/out
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleSignUp = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-200/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-2xl font-bold text-primary">
              <PlayCircle className="w-8 h-8 mr-2" />
              Kristal Streams
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center"
            >
              <Home size={18} className="mr-1" />
              Home
            </Link>
            <Link to="/pricing" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">
              Pricing
            </Link>
            <Link to="/support" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">
              Support
            </Link>

            <Link to="/download-app" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center">
              <Smartphone size={18} className="mr-1" />
              Get App
            </Link>
            <div className="hidden lg:flex items-center space-x-3 ml-4">
              <a
                href="https://www.facebook.com/kristalstreams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://x.com/kristalstreams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://www.instagram.com/kristalstreams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.youtube.com/@kristalstreams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  <User size={20} />
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-100 rounded-lg shadow-lg border border-gray-800 py-1 z-50">
                    <Link
                      to="/client/account"
                      className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Account
                    </Link>
                    <Link
                      to="/client/subscription"
                      className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Subscription
                    </Link>
                    <Link
                      to="/client/devices"
                      className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Devices
                    </Link>
                    <Link
                      to="/client/settings"
                      className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Settings
                    </Link>
                    <div className="border-t border-gray-800 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Create Account
                </button>
                <Link 
                  to="/free-trial"
                  className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors duration-200"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-dark-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <Home size={18} className="mr-2" />
                Home
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/support"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Support
              </Link>
              <Link
                to="/download-app"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <Smartphone size={18} className="mr-2" />
                Get App
              </Link>
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Follow us:</span>
                <a
                  href="https://www.facebook.com/kristalstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://x.com/kristalstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="https://www.instagram.com/kristalstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://www.youtube.com/@kristalstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <Youtube size={20} />
                </a>
              </div>
              {user ? (
                <>
                  <Link 
                    to="/client/account" 
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Account
                  </Link>
                  <Link 
                    to="/client/subscription" 
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Subscription
                  </Link>
                  <Link 
                    to="/client/devices" 
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Devices
                  </Link>
                  <Link 
                    to="/client/settings" 
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleSignIn();
                      setIsOpen(false);
                    }}
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      handleSignUp();
                      setIsOpen(false);
                    }}
                    className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
                  >
                    Create Account
                  </button>
                  <Link 
                    to="/free-trial"
                    className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
});

Header.displayName = 'Header';

export default Header;