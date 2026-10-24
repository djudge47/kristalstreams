import React, { useState, useEffect, memo, useCallback } from 'react';
import { Menu, X, User, Home, ChevronDown, Facebook, Twitter, Instagram, Youtube, Smartphone, Trophy, LayoutDashboard, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { User as AuthUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const Header: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const isAdmin = Boolean(user && !user.is_anonymous && user.email_confirmed_at
    && user.email?.trim().toLowerCase() === 'djudge47@gmail.com');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      // Do not auto-redirect on SIGNED_IN. That was forcing users away from /free-trial.
      if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = useCallback(() => navigate('/login'), [navigate]);
  const handleSignUp = useCallback(() => navigate('/register'), [navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const closeMenu = () => setIsOpen(false);

  const socialLinks = (
    <div className="flex items-center space-x-4">
      <a href="https://www.facebook.com/kristalstreams" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors duration-200" aria-label="Facebook"><Facebook size={18} /></a>
      <a href="https://x.com/kristalstreams" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors duration-200" aria-label="Twitter"><Twitter size={18} /></a>
      <a href="https://www.instagram.com/kristalstreams" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors duration-200" aria-label="Instagram"><Instagram size={18} /></a>
      <a href="https://www.youtube.com/@kristalstreams" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors duration-200" aria-label="YouTube"><Youtube size={18} /></a>
    </div>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-dark-200 border-b border-gray-800 lg:border-0 lg:bg-transparent transition-all duration-300 ${isScrolled ? 'bg-dark-200/95 backdrop-blur-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 pt-1 lg:pt-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <Link to="/" className="flex items-center min-w-0 text-lg lg:text-xl font-bold text-primary">
            <img src="/logo/ks-mark.png" alt="Kristal Streams" className="h-8 lg:h-9 w-auto mr-2" />
            Kristal Streams
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center"><Home size={18} className="mr-1" />Home</Link>
            <Link to="/pricing" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">Pricing</Link>
            <Link to="/support" className="text-gray-300 hover:text-white font-medium transition-colors duration-200">Support</Link>
            <Link to="/download-app" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 flex items-center"><Smartphone size={18} className="mr-1" />Get App</Link>
            {socialLinks}
          </nav>

          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/free-trial" className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200">
              Start Free Trial
            </Link>

            {user ? (
              <div className="relative">
                <button aria-label="Account menu" aria-expanded={showProfileMenu} aria-controls="account-navigation" onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200">
                  <User size={20} />
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div id="account-navigation" className="absolute right-0 mt-2 w-56 bg-dark-100 rounded-lg shadow-lg border border-gray-800 py-1 z-50">
                    {isAdmin && <>
                      <Link to="/admin" className="flex min-h-12 items-center gap-2 px-4 py-3 font-semibold text-red-300 hover:bg-dark-200 hover:text-white" onClick={() => setShowProfileMenu(false)}><LayoutDashboard size={18} aria-hidden="true" />Admin Dashboard</Link>
                      <Link to="/admin/crm" className="flex min-h-12 items-center gap-2 px-4 py-3 font-semibold text-red-300 hover:bg-dark-200 hover:text-white" onClick={() => setShowProfileMenu(false)}><Users size={18} aria-hidden="true" />Customer Workspace</Link>
                      <div className="border-t border-gray-800 my-1" />
                    </>}
                    <Link to="/dashboard" className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200" onClick={() => setShowProfileMenu(false)}>Dashboard</Link>
                    <Link to="/client/account" className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200" onClick={() => setShowProfileMenu(false)}>Account</Link>
                    <Link to="/client/subscription" className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200" onClick={() => setShowProfileMenu(false)}>Subscription</Link>
                    <Link to="/client/devices" className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200" onClick={() => setShowProfileMenu(false)}>Devices</Link>
                    <Link to="/client/settings" className="block px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200" onClick={() => setShowProfileMenu(false)}>Settings</Link>
                    <div className="border-t border-gray-800 my-1" />
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-200 hover:text-white transition-colors duration-200">Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={handleSignIn} className="text-gray-300 hover:text-white transition-colors duration-200">Sign In</button>
                <button onClick={handleSignUp} className="text-gray-300 hover:text-white transition-colors duration-200">Create Account</button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            
            <button type="button" aria-label={isOpen ? "Close navigation" : "Open navigation"} aria-expanded={isOpen} aria-controls="mobile-navigation" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-700 bg-dark-100 text-white hover:border-primary transition-colors duration-200">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="mobile-navigation" className="absolute top-full left-0 right-0 lg:hidden bg-dark-200 border-b border-gray-700 shadow-2xl overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(100dvh - 64px)" }}>
          <div className="container mx-auto px-4 py-4">
            <nav aria-label="Mobile navigation" className="flex flex-col space-y-2">
              {isAdmin && <div className="mb-2 space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-red-300">Manage Kristal Streams</p>
                <Link to="/admin" className="flex min-h-12 items-center gap-3 rounded-xl border border-gray-700 bg-dark-100 px-4 py-3 font-semibold text-white hover:border-primary" onClick={closeMenu}><LayoutDashboard size={20} aria-hidden="true" />Admin Dashboard</Link>
                <Link to="/admin/crm" className="flex min-h-12 items-center gap-3 rounded-xl border border-gray-700 bg-dark-100 px-4 py-3 font-semibold text-white hover:border-primary" onClick={closeMenu}><Users size={20} aria-hidden="true" />Customer Workspace</Link>
              </div>}
              <Link to="/" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100 flex items-center" onClick={closeMenu}><Home size={18} className="mr-2" />Home</Link>
              <Link to="/ppv" className="text-red-300 hover:text-white font-semibold transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center" onClick={closeMenu}><Trophy size={18} className="mr-2" />Sports &amp; PPV</Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Pricing</Link>
              <Link to="/support" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Support</Link>
              <Link to="/download-app" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100 flex items-center" onClick={closeMenu}><Smartphone size={18} className="mr-2" />Get App</Link>
              <Link to="/free-trial" className="bg-primary hover:bg-red-700 text-white px-4 py-3 rounded-xl min-h-12 font-semibold transition-colors duration-200 text-center" onClick={closeMenu}>Start Free Trial</Link>

              <div className="flex items-center space-x-4 pt-4 border-t border-gray-700">
                <span className="text-gray-400 text-sm">Follow us:</span>
                {socialLinks}
              </div>

              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Dashboard</Link>
                  <Link to="/client/account" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Account</Link>
                  <Link to="/client/subscription" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Subscription</Link>
                  <Link to="/client/devices" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Devices</Link>
                  <Link to="/client/settings" className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100" onClick={closeMenu}>Settings</Link>
                  <button onClick={() => { handleSignOut(); closeMenu(); }} className="bg-primary hover:bg-red-700 text-white px-4 py-3 rounded-xl min-h-12 font-semibold transition-colors duration-200">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => { handleSignIn(); closeMenu(); }} className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100">Sign In</button>
                  <button onClick={() => { handleSignUp(); closeMenu(); }} className="text-gray-300 hover:text-white font-medium transition-colors duration-200 min-h-12 px-4 py-3 rounded-xl hover:bg-dark-100">Create Account</button>
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
