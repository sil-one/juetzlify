import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOGO_ASPECT_RATIO } from '../utils/constants';

const Header = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();

  return (
    <header className="bg-juetzlify-yellow border-b-4 border-black sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          {/* Logo and Title - DHL Style */}
          <Link to="/" className="flex items-center gap-4 hover:scale-105 transition-transform">
            <img
              src="/juetzlify_logo.png"
              alt="Jützlify Logo"
              className="h-16 drop-shadow-2xl"
              style={{ aspectRatio: LOGO_ASPECT_RATIO }}
            />
            <div className="dhl-style-logo text-3xl md:text-4xl">
              <span className="text-juetzlify-red" style={{ WebkitTextStroke: '2px black', textStroke: '2px black' }}>Jützlify</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
