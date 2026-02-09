import React from 'react';
import AlbumArt from './AlbumArt';
import TrackInfo from './TrackInfo';
import useColorExtractor from '../hooks/useColorExtractor';
import DownloadButton from './DownloadButton';

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
  isShuffleOn,
  repeatMode,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLyrics,
  lyricsOpen,
}) => {
  // Extract dominant color from current track's album art
  const { color: albumColor } = useColorExtractor(currentTrack?.albumArt);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Dynamic gradient color based on album art
  const gradientColor = albumColor
    ? albumColor.vibrantRgba(0.2)
    : 'rgba(46, 204, 113, 0.15)';

  // Play button glow color
  const playButtonGlow = albumColor
    ? albumColor.vibrantRgba(0.5)
    : 'rgba(46, 204, 113, 0.4)';

  return (
    <div
      className="flex flex-col items-center justify-start pt-4 md:justify-center md:pt-0 min-h-screen text-sp-text p-4 pb-2 md:pb-4 relative overflow-hidden"
    >
      {/* Dynamic gradient background */}
      {currentTrack && (
        <div
          className="absolute inset-0 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${gradientColor} 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {currentTrack ? (
          <>
            <AlbumArt
              src={currentTrack.albumArt}
              alt={currentTrack.title}
              glowColor={albumColor}
            />
            <TrackInfo
              title={currentTrack.title}
              artist={currentTrack.artist}
              album={currentTrack.album}
              trackNo={currentTrack.trackNo}
              trackTotal={currentTrack.trackTotal}
            />

            <audio
              ref={audioRef}
              preload="auto"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
            />

            {/* Player controls */}
            <div className="w-full max-w-md mt-2 md:mt-6">
              {/* Progress bar */}
              <div className="group relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full progress-bar"
                  style={{ '--progress': `${progressPercent}%` }}
                />
                {/* Glow effect under progress */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none transition-all duration-200"
                  style={{
                    width: `${progressPercent}%`,
                    background: albumColor ? albumColor.vibrant : '#2ECC71',
                    filter: 'blur(6px)',
                    opacity: 0.5,
                  }}
                />
              </div>

              {/* Time display */}
              <div className="flex justify-between text-xs text-sp-text-muted mt-1 mb-3 md:mb-6">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>

              {/* Play/Pause and Skip buttons */}
              <div className="flex justify-between items-center gap-3 w-full">
                {/* Shuffle button */}
                <button
                  onClick={onToggleShuffle}
                  className={`secondary-button w-10 h-10 flex items-center justify-center ${isShuffleOn ? 'shuffle-active' : ''}`}
                  title="Shuffle"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                  </svg>
                </button>

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

                  {/* Play/Pause button with dynamic glow */}
                  <div className="relative">
                    {/* Glow layer */}
                    <div
                      className={`absolute inset-0 rounded-full transition-all duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        background: playButtonGlow,
                        filter: 'blur(16px)',
                        transform: 'scale(1.3)',
                        animation: isPlaying ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                      }}
                    />
                    <button
                      onClick={onTogglePlay}
                      className="relative w-16 h-16 bg-sp-green hover:bg-sp-green-bright text-black rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-black/40 flex items-center justify-center"
                      title={isPlaying ? 'Paisä' : 'Spielä'}
                      style={{
                        boxShadow: isPlaying
                          ? `0 0 30px ${playButtonGlow}, 0 8px 20px rgba(0, 0, 0, 0.4)`
                          : '0 8px 20px rgba(0, 0, 0, 0.4)',
                      }}
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
                  </div>

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

                {/* Repeat button */}
                <button
                  onClick={onToggleRepeat}
                  className={`secondary-button w-10 h-10 flex items-center justify-center ${repeatMode !== 'off' ? 'repeat-active' : ''}`}
                  title={
                    repeatMode === 'off' ? 'Repeat Off' :
                    repeatMode === 'all' ? 'Repeat All' :
                    repeatMode === 'queue' ? 'Repeat Queue' :
                    'Repeat One'
                  }
                >
                  {repeatMode === 'one' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                      <path d="M11 11h2v6h-2v-6zm0-2h2v1h-2V9z" />
                    </svg>
                  ) : repeatMode === 'queue' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                      <path d="M9 10h6v1H9v-1zm0 2h6v1H9v-1zm0 2h4v1H9v-1z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Download & Lyrics button row */}
              <div className="flex justify-center items-center gap-4 mt-2 md:mt-4">
                <DownloadButton
                  trackId={currentTrack.id}
                  track={currentTrack}
                  size="medium"
                  showLabel={true}
                />
                {onToggleLyrics && (
                  <button
                    onClick={onToggleLyrics}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm ${
                      lyricsOpen
                        ? 'bg-sp-green/20 text-sp-green'
                        : 'text-sp-text-secondary hover:text-sp-text hover:bg-sp-gray'
                    }`}
                    title="Text"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                    </svg>
                    <span>Text</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-sp-gray flex items-center justify-center elevation-2">
              <svg className="w-12 h-12 text-sp-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <p className="text-xl text-sp-text-secondary font-medium">Keis Liäd üsgwählt</p>
            <p className="text-sm mt-2 text-sp-text-muted">Wähl äs Liäd üs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
