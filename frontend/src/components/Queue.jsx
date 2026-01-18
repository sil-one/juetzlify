import React from 'react';

const Queue = ({ queue, onRemove, onClear, onPlayTrack }) => {
  if (!queue || queue.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-juetzli-yellow">Up Next ({queue.length})</h2>
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-juetzli-red transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-2">
        {queue.map((track, index) => (
          <div
            key={`${track.id}-${index}`}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
          >
            <span className="text-gray-500 text-sm w-6">{index + 1}</span>
            {track.albumArt ? (
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
            <button
              onClick={() => onPlayTrack(track)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="text-white text-sm font-medium truncate">{track.title}</p>
              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
            </button>
            <button
              onClick={() => onRemove(index)}
              className="p-2 text-gray-400 hover:text-juetzli-red transition-colors"
              title="Remove from queue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queue;
