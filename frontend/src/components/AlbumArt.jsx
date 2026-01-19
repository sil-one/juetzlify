import React from 'react';

const AlbumArt = ({ src, alt = 'Album Art' }) => {
  return (
    <div className="w-full max-w-sm aspect-square mb-8 px-4">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg shadow-2xl shadow-black/50"
        />
      ) : (
        <div className="w-full h-full bg-sp-gray rounded-lg shadow-2xl shadow-black/50 flex items-center justify-center">
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
  );
};

export default AlbumArt;
