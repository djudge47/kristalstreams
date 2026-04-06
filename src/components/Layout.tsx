import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Layout;