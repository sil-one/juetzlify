import React, { useState, useEffect, useRef } from 'react';
import useColorExtractor from '../hooks/useColorExtractor';
import { API_BASE_URL } from '../utils/constants';

const LyricsOverlay = ({ track, isOpen, onClose }) => {
  const [lyrics, setLyrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const touchStartY = useRef(null);
  const scrollRef = useRef(null);
  const { color: albumColor } = useColorExtractor(track?.albumArt);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && track) {
      fetchLyrics();
      // Reset scroll
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isOpen, track?.id]);

  const fetchLyrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/tracks/${track.id}/lyrics`);

      if (response.ok) {
        const data = await response.json();
        setLyrics(data.lyrics);
        setHasLyrics(true);
      } else {
        setLyrics(null);
        setHasLyrics(false);
      }
    } catch (err) {
      console.error('Error fetching lyrics:', err);
      setLyrics(null);
      setHasLyrics(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTouchStart = (e) => {
    // Only track the swipe if the scroll container is at the very top
    const atTop = !scrollRef.current || scrollRef.current.scrollTop <= 0;
    touchStartY.current = atTop ? e.touches[0].clientY : null;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    // Re-check we're still at top (user might have scrolled during the gesture)
    const atTop = !scrollRef.current || scrollRef.current.scrollTop <= 0;
    if (atTop) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 100) {
        onClose();
      }
    }
    touchStartY.current = null;
  };

  if (!isOpen) return null;

  const vibrant = albumColor ? albumColor.vibrant : '#2ECC71';
  const gradientColor = albumColor
    ? albumColor.vibrantRgba(0.35)
    : 'rgba(46, 204, 113, 0.25)';
  const gradientColorFaint = albumColor
    ? albumColor.vibrantRgba(0.08)
    : 'rgba(46, 204, 113, 0.06)';

  // Split lyrics into lines for staggered rendering
  const lyricsLines = lyrics ? lyrics.split('\n') : [];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.97)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Multi-layered gradient background */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, ${gradientColor} 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 20% 50%, ${gradientColorFaint} 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 60%, ${gradientColorFaint} 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className={`relative z-10 flex items-center justify-between px-5 pt-8 pb-4 transition-all duration-500 delay-100 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}>
        {/* Swipe indicator (mobile) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full md:hidden"
          style={{ backgroundColor: `${vibrant}40` }}
        />

        <div className="min-w-0 flex-1 mr-4">
          <p className="text-sp-text font-bold text-lg truncate tracking-tight">{track?.title}</p>
          <p className="text-sm truncate" style={{ color: vibrant }}>{track?.artist}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: `${vibrant}15`,
            color: vibrant,
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="relative z-10 mx-5 h-px" style={{
        background: `linear-gradient(90deg, transparent 0%, ${vibrant}30 50%, transparent 100%)`
      }} />

      {/* Lyrics content */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 pt-6 pb-12 scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 3%, black 90%, transparent 100%)',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${vibrant}40`, borderTopColor: 'transparent' }}
              />
              <span className="text-sp-text-muted text-sm tracking-wide uppercase">Loading</span>
            </div>
          </div>
        ) : hasLyrics ? (
          <div className={`max-w-lg mx-auto transition-all duration-700 delay-200 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            {lyricsLines.map((line, i) => (
              <p
                key={i}
                className={`transition-colors duration-200 leading-[1.9] ${
                  line.trim() === ''
                    ? 'h-6'
                    : 'text-[1.35rem] font-semibold tracking-tight text-white/90 hover:text-white'
                }`}
              >
                {line}
              </p>
            ))}
            {/* Bottom spacer for scroll breathing room */}
            <div className="h-24" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className={`text-center transition-all duration-500 delay-200 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${vibrant}10` }}
              >
                <svg className="w-10 h-10" style={{ color: `${vibrant}60` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                </svg>
              </div>
              <p className="text-sp-text-secondary text-lg font-medium">Kei Text verfiägbar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LyricsOverlay;
