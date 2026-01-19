import React from 'react';
import MarqueeText from './MarqueeText';

const TrackInfo = ({ title, artist, album, trackNo, trackTotal }) => {
  return (
    <div className="text-center mb-4 px-4 max-w-md w-full">
      <MarqueeText
        text={title}
        className="text-2xl md:text-3xl font-bold mb-2 text-sp-text"
      />
      <MarqueeText
        text={artist}
        className="text-lg text-sp-text-secondary"
      />
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
