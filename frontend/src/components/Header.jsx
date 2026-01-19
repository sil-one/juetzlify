import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();

  return (
    <header className="bg-sp-black/95 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/juetzlify_logo.png"
              alt="Jützlify Logo"
              className="h-12 w-12 rounded-full shadow-lg shadow-sp-green/20 group-hover:shadow-sp-green/40 transition-shadow duration-300"
            />
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-sp-text group-hover:text-sp-green transition-colors duration-300">Jützlify</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
