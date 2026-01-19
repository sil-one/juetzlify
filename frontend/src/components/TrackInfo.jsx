import React from 'react';

const TrackInfo = ({ title, artist, album, trackNo, trackTotal }) => {
  return (
    <div className="text-center mb-4 px-4 max-w-md">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-sp-text truncate">{title}</h1>
      <p className="text-lg text-sp-text-secondary truncate">{artist}</p>
      {(trackNo || album) && (
        <p className="text-sm text-sp-text-muted mt-2">
          {album && <span>{album}</span>}
          {album && trackNo && <span> · </span>}
          {trackNo && (
            <span>
              Track {trackNo}{trackTotal && ` of ${trackTotal}`}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default TrackInfo;
