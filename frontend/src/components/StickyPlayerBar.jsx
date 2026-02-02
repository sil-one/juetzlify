import React from 'react';
import useColorExtractor from '../hooks/useColorExtractor';
import MarqueeText from './MarqueeText';

const StickyPlayerBar = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onPlayNext,
  onPlayPrevious,
  isShuffleOn,
  isRepeatOn,
  onToggleShuffle,
  onToggleRepeat,
  isVisible = true,
}) => {
  // Extract dominant color from current track's album art
  const { color: albumColor } = useColorExtractor(currentTrack?.albumArt);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Dynamic gradient color based on album art
  const gradientColor = albumColor
    ? albumColor.vibrantRgba(0.3)
    : 'rgba(46, 204, 113, 0.3)';

  const accentColor = albumColor ? albumColor.vibrant : '#2ECC71';

  if (!currentTrack) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        height: '72px',
      }}
    >
      {/* Background with glass effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${gradientColor}, rgba(18, 18, 18, 0.95))`,
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      />

      {/* Content */}
      <div className="relative h-full flex items-center px-4 gap-3">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          {currentTrack.albumArt ? (
            <div
              className="relative rounded shadow-lg"
              style={{
                boxShadow: `0 4px 16px ${albumColor ? albumColor.vibrantRgba(0.4) : 'rgba(46, 204, 113, 0.3)'}`,
              }}
            >
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                className="w-12 h-12 object-cover rounded"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-sp-gray rounded flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-sp-text-muted"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div style={{ color: accentColor }}>
            <MarqueeText
              text={currentTrack.title}
              className="font-semibold text-sm"
            />
          </div>
          <MarqueeText
            text={currentTrack.artist}
            className="text-xs text-sp-text-secondary"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Shuffle button - hidden on mobile, shown on larger screens */}
          <button
            onClick={onToggleShuffle}
            className={`hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 ${
              isShuffleOn ? 'text-white' : 'bg-sp-gray/50 text-sp-text-secondary hover:bg-sp-light-gray hover:text-sp-text'
            }`}
            style={isShuffleOn ? {
              background: accentColor,
              boxShadow: `0 4px 16px ${albumColor ? albumColor.vibrantRgba(0.5) : 'rgba(46, 204, 113, 0.4)'}`,
            } : {}}
            aria-label="Shuffle"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>

          {/* Previous button */}
          <button
            onClick={onPlayPrevious}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sp-light-gray text-sp-text-secondary hover:text-sp-text transition-all duration-200 active:scale-90"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105"
            style={{
              background: accentColor,
              boxShadow: `0 4px 16px ${albumColor ? albumColor.vibrantRgba(0.5) : 'rgba(46, 204, 113, 0.4)'}`,
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next button */}
          <button
            onClick={onPlayNext}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sp-light-gray text-sp-text-secondary hover:text-sp-text transition-all duration-200 active:scale-90"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18V6l8.5 6zm10-12v12h2V6z" />
            </svg>
          </button>

          {/* Repeat button - hidden on mobile, shown on larger screens */}
          <button
            onClick={onToggleRepeat}
            className={`hidden sm:flex w-8 h-8 rounded-full items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 ${
              isRepeatOn ? 'text-white' : 'bg-sp-gray/50 text-sp-text-secondary hover:bg-sp-light-gray hover:text-sp-text'
            }`}
            style={isRepeatOn ? {
              background: accentColor,
              boxShadow: `0 4px 16px ${albumColor ? albumColor.vibrantRgba(0.5) : 'rgba(46, 204, 113, 0.4)'}`,
            } : {}}
            aria-label="Repeat"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-sp-gray"
        style={{ zIndex: 1 }}
      >
        <div
          className="h-full transition-all duration-200"
          style={{
            width: `${progressPercent}%`,
            background: accentColor,
            boxShadow: `0 0 8px ${albumColor ? albumColor.vibrantRgba(0.6) : 'rgba(46, 204, 113, 0.5)'}`,
          }}
        />
      </div>
    </div>
  );
};

export default StickyPlayerBar;
