import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';

const Header = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const timeoutRef = useRef(null);

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const newCount = clickCount + 1;
      setClickCount(newCount);

      if (newCount === 5) {
        navigate('/private');
        setClickCount(0);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setClickCount(0), 2000);
      }
    }
  };

  return (
    <header className="glass-heavy sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/juetzlify_logo.png"
                alt="Jützlify Logo"
                className="h-12 w-12 rounded-full shadow-lg transition-all duration-300 group-hover:scale-105"
                style={{
                  boxShadow: '0 0 20px rgba(46, 204, 113, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)'
                }}
              />
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 30px rgba(46, 204, 113, 0.5), 0 0 60px rgba(46, 204, 113, 0.2)'
                }}
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-sp-text group-hover:text-sp-green transition-colors duration-300 drop-shadow-lg">Jützlify</span>
            </span>
          </Link>
          <CountdownTimer />
        </div>
      </div>
    </header>
  );
};

export default Header;
