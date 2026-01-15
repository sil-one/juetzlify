import React from 'react';

const AlbumArt = ({ src, alt = 'Album Art' }) => {
  return (
    <div className="w-full max-w-md aspect-square mb-8 px-4">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-xl shadow-2xl ring-4 ring-juetzli-yellow"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-2xl flex items-center justify-center ring-4 ring-juetzli-yellow">
          <svg
            className="w-32 h-32 text-juetzli-yellow opacity-50"
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
