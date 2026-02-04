import React from 'react';
import { getRelativeTime } from '../../utils/timeUtils';
import { API_BASE_URL } from '../../utils/constants';

function RecentPlaysList({ plays }) {
  if (!plays || plays.length === 0) {
    return (
      <div className="bg-sp-dark rounded-lg p-6">
        <h2 className="text-xl font-bold text-sp-text mb-4">Recent Plays</h2>
        <div className="flex flex-col items-center justify-center py-12 text-sp-text-muted">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <p>No plays recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sp-dark rounded-lg p-6">
      <h2 className="text-xl font-bold text-sp-text mb-4">Recent Plays</h2>
      <div className="h-[60vh] overflow-y-auto space-y-2">
        {plays.map((play, index) => (
          <div
            key={`${play.trackId}-${play.timestamp}-${index}`}
            className="bg-sp-gray hover:bg-sp-light-gray rounded-lg p-3 transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              {/* Album Art */}
              <img
                src={`${API_BASE_URL}/album-art/${play.trackId}.jpg`}
                alt={play.title}
                className="w-12 h-12 md:w-16 md:h-16 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23282828" width="100" height="100"/></svg>';
                }}
              />

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sp-text font-medium truncate text-sm md:text-base">
                  {play.title}
                </p>
                <p className="text-sp-text-secondary text-xs md:text-sm truncate">
                  {play.artist}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-right flex-shrink-0">
                <div className="text-sp-text-muted text-xs md:text-sm whitespace-nowrap">
                  {getRelativeTime(play.timestamp)}
                </div>
                <div className="text-sp-text-muted/50 text-[10px] whitespace-nowrap">
                  {new Date(play.timestamp).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })}{' '}
                  {new Date(play.timestamp).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentPlaysList;
