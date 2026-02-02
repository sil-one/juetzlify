import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { getColorForImage } from '../hooks/useColorExtractor';
import DownloadButton from './DownloadButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDownloads } from '../contexts/DownloadsContext';

// Swipe threshold to trigger add to queue (in pixels)
const SWIPE_THRESHOLD = 120;

// Component for individual track item with dynamic color and swipe-to-queue
const TrackItem = ({ track, isCurrentTrack, displayNumber, onTrackSelect, onAddToQueue, showAlbumArt, isAdmin = false, isAvailable = true }) => {
  const [glowColor, setGlowColor] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const itemRef = useRef(null);

  useEffect(() => {
    if (track.albumArt) {
      getColorForImage(track.albumArt).then(setGlowColor);
    }
  }, [track.albumArt]);

  const accentColor = glowColor ? glowColor.vibrant : '#2ECC71';
  const glowRgba = glowColor ? glowColor.vibrantRgba(0.15) : 'rgba(46, 204, 113, 0.1)';

  // Touch handlers for swipe gesture
  const handleTouchStart = useCallback((e) => {
    if (!onAddToQueue) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  }, [onAddToQueue]);

  const handleTouchMove = useCallback((e) => {
    if (!onAddToQueue || isConfirming) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = Math.abs(touchStartY.current - currentY);

    // Only trigger horizontal swipe if horizontal movement > vertical
    if (diffX > 10 && diffX > diffY) {
      setIsSwiping(true);
      // Only allow left swipe (positive diff), with resistance after threshold
      const offset = Math.min(diffX, SWIPE_THRESHOLD + (diffX - SWIPE_THRESHOLD) * 0.3);
      setSwipeOffset(Math.max(0, offset));
    }
  }, [onAddToQueue, isConfirming]);

  const handleTouchEnd = useCallback(() => {
    if (!onAddToQueue || isConfirming) return;

    if (swipeOffset >= SWIPE_THRESHOLD) {
      // Trigger add to queue with confirmation animation
      setIsConfirming(true);
      setSwipeOffset(SWIPE_THRESHOLD + 20); // Slight overshoot for effect

      // Add to queue
      onAddToQueue(track);

      // Reset after confirmation animation
      setTimeout(() => {
        setSwipeOffset(0);
        setTimeout(() => {
          setIsConfirming(false);
        }, 300);
      }, 800);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
    setIsSwiping(false);
  }, [swipeOffset, onAddToQueue, track, isConfirming]);

  // Calculate reveal progress (0 to 1)
  const revealProgress = Math.min(swipeOffset / SWIPE_THRESHOLD, 1);
  const isTriggered = revealProgress >= 1;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background reveal layer */}
      {onAddToQueue && (
        <div
          className={`absolute inset-0 flex items-center justify-end pr-4 transition-all duration-300 ${
            isConfirming ? 'bg-sp-green' : ''
          }`}
          style={{
            background: isConfirming
              ? accentColor
              : `linear-gradient(to left, ${accentColor} 0%, ${glowColor?.vibrantRgba(0.8) || 'rgba(46, 204, 113, 0.8)'} 100%)`,
            opacity: revealProgress * 0.9 + 0.1,
          }}
        >
          <div
            className={`flex items-center gap-2 text-white font-medium transition-all duration-300 ${
              isConfirming ? 'scale-110' : ''
            }`}
            style={{
              opacity: revealProgress,
              transform: `translateX(${(1 - revealProgress) * 20}px) scale(${isConfirming ? 1.1 : 1})`,
            }}
          >
            {isConfirming ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Id Warteschlangä!</span>
              </>
            ) : (
              <>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${isTriggered ? 'scale-125' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">{isTriggered ? 'Loslah!' : 'Id Warteschlangä'}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main track item content */}
      <div
        ref={itemRef}
        onClick={() => !isSwiping && isAvailable && onTrackSelect(track)}
        role="button"
        tabIndex={isAvailable ? 0 : -1}
        onKeyDown={(e) => e.key === 'Enter' && isAvailable && onTrackSelect(track)}
        onTouchStart={isAvailable ? handleTouchStart : undefined}
        onTouchMove={isAvailable ? handleTouchMove : undefined}
        onTouchEnd={isAvailable ? handleTouchEnd : undefined}
        className={`relative w-full text-left px-2 py-3 sm:p-3 rounded-lg group track-item-accent ${
          isCurrentTrack ? 'active' : ''
        } ${isSwiping || swipeOffset > 0 ? '' : 'transition-all duration-300'} ${
          isAvailable ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
        style={{
          '--accent-color': accentColor,
          background: isCurrentTrack ? glowRgba : 'rgba(24, 24, 24, 0.95)',
          transform: `translateX(-${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
          opacity: isAvailable ? 1 : 0.4,
          filter: isAvailable ? 'none' : 'grayscale(0.7)',
        }}
      >
      <div className="flex items-center gap-3 md:gap-4">
        {/* Track number or playing indicator */}
        <div className="w-6 text-right flex-shrink-0">
          {isCurrentTrack ? (
            <div className="relative">
              <svg
                className="w-4 h-4 mx-auto"
                fill={accentColor}
                viewBox="0 0 24 24"
              >
                <path d="M3 22v-20l18 10-18 10z"/>
              </svg>
              {/* Pulsing glow for current track */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: glowRgba,
                  animationDuration: '2s',
                }}
              />
            </div>
          ) : (
            <span className="text-sp-text-muted text-sm group-hover:hidden">
              {displayNumber}
            </span>
          )}
          {!isCurrentTrack && (
            <svg className="w-4 h-4 text-sp-text mx-auto hidden group-hover:block" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>

        {/* Album art - only show if no album grouping (for grouped tracks it's redundant) */}
        {showAlbumArt && (
          track.albumArt ? (
            <div
              className="relative rounded shadow-md transition-all duration-300 group-hover:shadow-lg"
              style={{
                boxShadow: isCurrentTrack ? `0 4px 20px ${glowRgba}` : undefined,
              }}
            >
              <img
                src={track.albumArt}
                alt={track.title}
                className="w-10 h-10 object-cover rounded"
              />
            </div>
          ) : (
            <div className="w-9 h-9 md:w-10 md:h-10 bg-sp-gray rounded flex items-center justify-center shadow-md">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-sp-text-muted"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )
        )}

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm md:text-base font-medium truncate transition-colors duration-300"
            style={{ color: isCurrentTrack ? accentColor : undefined }}
          >
            {track.title}
          </p>
          <p className="text-xs md:text-sm truncate text-sp-text-secondary">
            {track.artist}
          </p>
        </div>

        {/* Download button and duration */}
        <div className="flex items-center gap-2 md:gap-3">
          {!isAvailable && (
            <div className="flex items-center gap-1 text-orange-400 text-xs" title="Abälade für Offline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          )}
          <DownloadButton
            trackId={track.id}
            track={track}
            size="small"
            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          />
          {track.duration > 0 && (
            <span className="text-sm text-sp-text-muted tabular-nums">
              {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Visibility indicators - only visible to admins */}
        {isAdmin && (
          <>
            {track.visibility === 'private' && (
              <div className="text-blue-400 opacity-80" title="Privats Liäd">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
            {track.visibility === 'disabled' && (
              <div className="text-sp-text-muted opacity-60" title="Deaktiviertes Liäd">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </div>
            )}
          </>
        )}

        {/* Add to queue button - visible on mobile, hover on desktop (hidden when swiping) */}
        {onAddToQueue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(track);
            }}
            className={`p-2 rounded-full hover:bg-sp-light-gray text-sp-text-secondary hover:text-sp-text transition-all duration-300 active:scale-90 md:hover:scale-110 ${
              swipeOffset > 0 ? 'opacity-0' : 'opacity-70 md:opacity-0 md:group-hover:opacity-100'
            }`}
            title="Ab id Warteschlangä"
          >
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

const TrackList = ({ tracks, currentTrack, onTrackSelect, onAddToQueue, isAdmin = false }) => {
  const isOnline = useOnlineStatus();
  const { getDownloadState } = useDownloads();

  // Group tracks by album
  const groupedTracks = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];

    const groups = {};
    const noAlbum = [];

    tracks.forEach((track) => {
      if (track.album) {
        if (!groups[track.album]) {
          groups[track.album] = {
            name: track.album,
            albumArt: track.albumArt,
            tracks: [],
          };
        }
        groups[track.album].tracks.push(track);
      } else {
        noAlbum.push(track);
      }
    });

    // Sort tracks within each album by track number
    Object.values(groups).forEach((group) => {
      group.tracks.sort((a, b) => {
        // Parse track numbers, handling nulls and non-numeric values
        const aTrack = a.trackNo != null ? parseInt(String(a.trackNo), 10) : 999;
        const bTrack = b.trackNo != null ? parseInt(String(b.trackNo), 10) : 999;

        // If parsing failed, use 999 as fallback
        const aNum = isNaN(aTrack) ? 999 : aTrack;
        const bNum = isNaN(bTrack) ? 999 : bTrack;

        return aNum - bNum;
      });
    });

    // Convert to array and sort albums alphabetically
    const albumGroups = Object.values(groups).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Add tracks without album at the end
    if (noAlbum.length > 0) {
      albumGroups.push({
        name: null,
        albumArt: null,
        tracks: noAlbum,
      });
    }

    return albumGroups;
  }, [tracks]);

  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-12 text-sp-text-muted">
        <p>No tracks available</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 pb-24">
      <h2 className="text-2xl font-bold mb-6 text-sp-text">Liäder</h2>

      <div className="space-y-8">
        {groupedTracks.map((group) => (
          <AlbumGroup
            key={group.name || 'no-album'}
            group={group}
            currentTrack={currentTrack}
            onTrackSelect={onTrackSelect}
            onAddToQueue={onAddToQueue}
            isAdmin={isAdmin}
            isOnline={isOnline}
            getDownloadState={getDownloadState}
          />
        ))}
      </div>
    </div>
  );
};

// Album group component with dynamic color
const AlbumGroup = ({ group, currentTrack, onTrackSelect, onAddToQueue, isAdmin = false, isOnline, getDownloadState }) => {
  const [glowColor, setGlowColor] = useState(null);

  useEffect(() => {
    if (group.albumArt) {
      getColorForImage(group.albumArt).then(setGlowColor);
    }
  }, [group.albumArt]);

  const accentColor = glowColor ? glowColor.vibrant : '#2ECC71';
  const glowRgba = glowColor ? glowColor.vibrantRgba(0.1) : 'rgba(46, 204, 113, 0.05)';
  const borderColor = glowColor ? glowColor.vibrantRgba(0.3) : 'rgba(46, 204, 113, 0.2)';

  return (
    <div
      className="glass rounded-xl px-2 py-4 sm:px-3 md:px-4 transition-all duration-300 hover:elevation-1"
      style={{
        background: `linear-gradient(135deg, ${glowRgba} 0%, rgba(24, 24, 24, 0.7) 100%)`,
      }}
    >
      {/* Album header */}
      {group.name ? (
        <div
          className="flex items-center gap-3 mb-3 pb-3"
          style={{
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          {group.albumArt && (
            <div
              className="relative rounded-lg shadow-lg transition-all duration-300"
              style={{
                boxShadow: `0 8px 32px ${glowRgba}, 0 0 0 2px ${glowColor?.vibrantRgba(0.4) || 'rgba(46, 204, 113, 0.4)'}`,
              }}
            >
              <img
                src={group.albumArt}
                alt={group.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: accentColor }}
            >
              {group.name}
            </h3>
            <p className="text-xs text-sp-text-muted">
              {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-sp-gray">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-sp-gray flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 md:w-10 md:h-10 text-sp-text-muted" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-sp-text-secondary truncate">
              Ohni Album
            </h3>
            <p className="text-xs text-sp-text-muted">
              {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>
      )}

      {/* Tracks in this album */}
      <div className="space-y-1">
        {group.tracks.map((track, trackIndex) => {
          const isCurrentTrack = currentTrack?.id === track.id;
          // Always use sequential numbering within the album, not the metadata track number
          const displayNumber = trackIndex + 1;
          // Track is available if online OR downloaded
          const isDownloaded = getDownloadState(track.id) === 'downloaded';
          const isAvailable = isOnline || isDownloaded;

          return (
            <TrackItem
              key={track.id}
              track={track}
              isCurrentTrack={isCurrentTrack}
              displayNumber={displayNumber}
              onTrackSelect={onTrackSelect}
              onAddToQueue={onAddToQueue}
              showAlbumArt={!group.name}
              isAdmin={isAdmin}
              isAvailable={isAvailable}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TrackList;
