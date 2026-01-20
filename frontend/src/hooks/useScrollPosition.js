import { useState, useEffect } from 'react';

/**
 * Hook to detect scroll position and return if scrolled past threshold
 * @param {number} threshold - Scroll threshold in pixels (default 400px)
 * @returns {boolean} - True if scrolled past threshold
 */
export function useScrollPosition(threshold = 400) {
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    let timeoutId = null;

    const handleScroll = () => {
      // Debounce the scroll event
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        setIsScrolledPast(scrollY > threshold);
      }, 10); // 10ms debounce for smooth updates
    };

    // Check initial position
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [threshold]);

  return isScrolledPast;
}
