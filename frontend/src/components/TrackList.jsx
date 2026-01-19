import React from 'react';

const TrackList = ({ tracks, currentTrack, onTrackSelect, onAddToQueue }) => {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No tracks available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-24">
      <h2 className="text-2xl font-bold mb-4 text-juetzlify-yellow">Liäder</h2>
      <div className="space-y-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onTrackSelect(track)}
            className={`w-full text-left p-4 rounded-lg transition-all transform hover:scale-[1.02] ${
              currentTrack?.id === track.id
                ? 'bg-gradient-to-r from-juetzlify-red to-red-600 text-white shadow-lg scale-[1.02]'
                : 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-white'
            }`}
          >
            <div className="flex items-center gap-4">
              {track.trackNo && (
                <div className="text-juetzlify-yellow font-bold text-sm w-8 text-right flex-shrink-0">
                  {track.trackNo}
                </div>
              )}
              {track.albumArt ? (
                <img
                  src={track.albumArt}
                  alt={track.title}
                  className="w-12 h-12 object-cover rounded ring-2 ring-juetzlify-yellow"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded flex items-center justify-center ring-2 ring-juetzlify-yellow">
                  <svg
                    className="w-6 h-6 text-juetzlify-yellow opacity-50"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{track.title}</p>
                <p className="text-sm truncate opacity-90">{track.artist}</p>
              </div>
              {track.duration > 0 && (
                <span className="text-sm text-juetzlify-yellow font-semibold">
                  {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                </span>
              )}
              {onAddToQueue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToQueue(track);
                  }}
                  className="p-2 rounded-full bg-gray-600 hover:bg-juetzlify-yellow hover:text-black transition-colors"
                  title="Ab id Warteschlangä"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
