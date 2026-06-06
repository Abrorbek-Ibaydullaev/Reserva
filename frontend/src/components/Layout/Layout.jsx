import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="app-shell flex flex-col">
      <Navbar />
      <main className="min-w-0 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
