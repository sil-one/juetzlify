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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
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
          <div className="w-full max-w-md mt-4">
            {/* Time display */}
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Progress bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full mb-6"
            />

            {/* Play/Pause and Skip buttons */}
            <div className="flex justify-center items-center gap-4">
              {/* Previous button */}
              <button
                onClick={onPlayPrevious}
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full transition-all hover:scale-110 shadow-lg"
                title="Previous track (or restart current)"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              {/* Play/Pause button */}
              <button
                onClick={onTogglePlay}
                className="player-button"
              >
                {isPlaying ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play
                  </span>
                )}
              </button>

              {/* Next button */}
              <button
                onClick={onPlayNext}
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full transition-all hover:scale-110 shadow-lg"
                title="Next track"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400">
          <p className="text-xl">No track selected</p>
          <p className="text-sm mt-2">Select a track from the list below</p>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
