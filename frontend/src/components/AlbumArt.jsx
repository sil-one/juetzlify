import React from 'react';

const AlbumArt = ({ src, alt = 'Album Art', glowColor = null }) => {
  // Default glow color is the app's green accent
  const defaultGlow = 'rgba(46, 204, 113, 0.4)';
  const activeGlow = glowColor ? glowColor.vibrantRgba(0.5) : defaultGlow;
  const softGlow = glowColor ? glowColor.vibrantRgba(0.25) : 'rgba(46, 204, 113, 0.2)';

  return (
    <div className="w-full max-w-sm aspect-square mb-3 md:mb-8 px-4">
      <div
        className="relative w-full h-full rounded-lg album-art-glow smooth-transition"
        style={{
          '--glow-color': activeGlow,
        }}
      >
        {src ? (
          <>
            {/* Background glow blur */}
            <div
              className="absolute inset-0 rounded-lg blur-2xl opacity-60 scale-90"
              style={{
                background: `radial-gradient(circle, ${activeGlow} 0%, transparent 70%)`,
              }}
            />
            {/* Main image */}
            <img
              src={src}
              alt={alt}
              className="relative w-full h-full object-cover rounded-lg elevation-3"
            />
            {/* Subtle inner glow overlay */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: `inset 0 0 60px ${softGlow}`,
              }}
            />
          </>
        ) : (
          <div className="relative w-full h-full bg-sp-gray rounded-lg elevation-3 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-sp-text-muted"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumArt;
