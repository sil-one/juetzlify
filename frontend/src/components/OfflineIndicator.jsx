/**
 * Offline Indicator - Shows when user is offline
 * Hides on scroll for better UX
 */

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide when scrolling down, show when scrolling up or at top
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (isOnline) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-40
        bg-gradient-to-r from-yellow-500/95 to-orange-500/95
        backdrop-blur-sm
        text-white px-4 py-2.5
        text-center text-sm font-medium
        shadow-lg
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
          />
          <path
            d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
          />
        </svg>
        <span className="drop-shadow-md">
          Offline-Modus • Nur abbägladni Liäder verfiägbar
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
