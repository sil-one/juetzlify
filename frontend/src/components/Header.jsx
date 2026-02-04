import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { API_BASE_URL } from '../utils/constants';

const Header = ({ isAuthenticated, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [clickCount, setClickCount] = useState(0);
  const timeoutRef = useRef(null);
  const [wrappedStatus, setWrappedStatus] = useState({ public: false, private: false });

  // Fetch wrapped status
  useEffect(() => {
    const checkWrappedStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/wrapped/status`);
        const data = await response.json();
        if (data.success) {
          setWrappedStatus(data.wrappedEnabled);
        }
      } catch (err) {
        console.error('Error checking wrapped status:', err);
      }
    };
    checkWrappedStatus();
  }, []);

  // Determine if wrapped should show and which link to use
  const isPrivatePage = location.pathname === '/private';
  const wrappedEnabled = isPrivatePage ? wrappedStatus.private : wrappedStatus.public;
  const wrappedLink = isPrivatePage ? '/wrapped-intern' : '/wrapped';

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
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-20 md:w-28 flex-shrink-0" />

          {/* Center content */}
          <div className="flex flex-col items-center justify-center gap-1 md:gap-2 flex-1">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2 md:gap-3 group">
              <div className="relative">
                <img
                  src={logoSrc}
                  alt={isOnline ? "Jützlify Logo" : "Jützlify Offline"}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg transition-all duration-500 group-hover:scale-105"
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
              <span className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
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

          {/* Right content - Wrapped button */}
          <div className="w-20 md:w-28 flex-shrink-0 flex justify-end">
            {wrappedEnabled && wrappedLink && (
              <Link
                to={wrappedLink}
                className="wrapped-button group"
              >
                <div className="relative px-2 py-1.5 md:px-3 md:py-2 bg-sp-black rounded-full flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="text-base md:text-lg">🎭</span>
                  <span className="hidden md:inline text-xs font-bold text-white">Wrapped</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
