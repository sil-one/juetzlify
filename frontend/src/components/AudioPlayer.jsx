import React from 'react';
import AlbumArt from './AlbumArt';
import TrackInfo from './TrackInfo';

const AudioPlayer = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  audioRef,
  onTogglePlay,
  onSeek,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
  onPlayNext,
  onPlayPrevious,
}) => {
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-sp-text p-4">
      {currentTrack ? (
        <>
          <AlbumArt src={currentTrack.albumArt} alt={currentTrack.title} />
          <TrackInfo
            title={currentTrack.title}
            artist={currentTrack.artist}
            album={currentTrack.album}
            trackNo={currentTrack.trackNo}
            trackTotal={currentTrack.trackTotal}
          />

          <audio
            ref={audioRef}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
          />

          {/* Player controls */}
          <div className="w-full max-w-md mt-6">
            {/* Progress bar */}
            <div className="group">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full progress-bar"
                style={{ '--progress': `${progressPercent}%` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-sp-text-muted mt-1 mb-6">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Play/Pause and Skip buttons */}
            <div className="flex justify-center items-center gap-6">
              {/* Previous button */}
              <button
                onClick={onPlayPrevious}
                className="secondary-button"
                title="Zrugg (oder z jetzigä niwstartä)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              {/* Play/Pause button */}
              <button
                onClick={onTogglePlay}
                className="w-16 h-16 bg-sp-green hover:bg-sp-green-bright text-black rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-black/40 flex items-center justify-center"
                title={isPlaying ? 'Paisä' : 'Spielä'}
              >
                {isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4l15 8-15 8V4z" />
                  </svg>
                )}
              </button>

              {/* Next button */}
              <button
                onClick={onPlayNext}
                className="secondary-button"
                title="Negschts Liäd"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-sp-gray flex items-center justify-center">
            <svg className="w-12 h-12 text-sp-text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <p className="text-xl text-sp-text-secondary font-medium">Keis Liäd üsgwählt</p>
          <p className="text-sm mt-2 text-sp-text-muted">Wähl äs Liäd üs</p>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
