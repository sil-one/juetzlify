import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const Header = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
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

  // Use offline logo when offline
  const logoSrc = isOnline ? '/juetzlify_logo.png' : '/juetzlify_offline.png';
  const logoGlowColor = isOnline
    ? 'rgba(46, 204, 113, 0.3)'
    : 'rgba(251, 146, 60, 0.3)'; // Orange glow for offline

  return (
    <header className="glass-heavy sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={logoSrc}
                alt={isOnline ? "Jützlify Logo" : "Jützlify Offline"}
                className="h-12 w-12 rounded-full shadow-lg transition-all duration-500 group-hover:scale-105"
                style={{
                  boxShadow: `0 0 20px ${logoGlowColor}, 0 4px 12px rgba(0, 0, 0, 0.4)`
                }}
              />
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: isOnline
                    ? '0 0 30px rgba(46, 204, 113, 0.5), 0 0 60px rgba(46, 204, 113, 0.2)'
                    : '0 0 30px rgba(251, 146, 60, 0.5), 0 0 60px rgba(251, 146, 60, 0.2)'
                }}
              />
            </div>
            <span className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <span className={`
                transition-colors duration-500 drop-shadow-lg
                ${isOnline
                  ? 'text-sp-text group-hover:text-sp-green'
                  : 'text-orange-400 group-hover:text-orange-300'
                }
              `}>
                Jützlify
              </span>
              {!isOnline && (
                <span className="text-xs text-orange-300/80 font-normal">
                  (offline)
                </span>
              )}
            </span>
          </Link>
          <CountdownTimer />
        </div>
      </div>
    </header>
  );
};

export default Header;
