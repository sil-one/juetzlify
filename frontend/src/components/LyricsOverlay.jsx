import React, { useState, useEffect, useRef } from 'react';
import useColorExtractor from '../hooks/useColorExtractor';
import { API_BASE_URL } from '../utils/constants';

const LyricsOverlay = ({ track, isOpen, onClose }) => {
  const [lyrics, setLyrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);
  const touchStartY = useRef(null);
  const { color: albumColor } = useColorExtractor(track?.albumArt);

  useEffect(() => {
    if (isOpen && track) {
      fetchLyrics();
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
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Swipe down to close (threshold: 100px)
    if (deltaY > 100) {
      onClose();
    }
    touchStartY.current = null;
  };

  if (!isOpen) return null;

  const gradientColor = albumColor
    ? albumColor.vibrantRgba(0.3)
    : 'rgba(46, 204, 113, 0.2)';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-lg"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${gradientColor} 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-6">
        {/* Swipe indicator (mobile) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-sp-text-muted/30 rounded-full md:hidden" />

        <div className="min-w-0 flex-1 mr-4">
          <p className="text-sp-text font-semibold truncate">{track?.title}</p>
          <p className="text-sp-text-secondary text-sm truncate">{track?.artist}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-sp-text-muted hover:text-sp-text rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Lyrics content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sp-text-secondary text-lg">Loading...</span>
          </div>
        ) : hasLyrics ? (
          <div className="max-w-lg mx-auto">
            <pre className="text-sp-text text-lg leading-relaxed whitespace-pre-wrap font-sans">
              {lyrics}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-sp-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
              </svg>
              <p className="text-sp-text-secondary text-lg">Kei Text verfiägbar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LyricsOverlay;
