import React from 'react';

const TrackInfo = ({ title, artist, album, trackNo, trackTotal }) => {
  return (
    <div className="text-center mb-8 px-4">
      {(trackNo || album) && (
        <p className="text-sm md:text-base text-juetzli-yellow font-semibold mb-2">
          {album && <span>{album}</span>}
          {album && trackNo && <span> • </span>}
          {trackNo && (
            <span>
              Track {trackNo}{trackTotal && `/${trackTotal}`}
            </span>
          )}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg">{title}</h1>
      <p className="text-xl md:text-2xl text-juetzli-yellow font-semibold">{artist}</p>
    </div>
  );
};

export default TrackInfo;
