import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';

const Layout: React.FC = () => {
  const location = useLocation();
  const isPasswordReset = location.pathname === '/reset-password';

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      {!isPasswordReset && <Header />}
      <main className={`flex-grow ${isPasswordReset ? '' : 'pt-20'}`}>
        <Outlet />
      </main>
      {!isPasswordReset && <Footer />}
      {!isPasswordReset && <BackToTop />}
    </div>
  );
};

export default Layout;
