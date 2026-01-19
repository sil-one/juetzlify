import React, { useMemo } from 'react';

const TrackList = ({ tracks, currentTrack, onTrackSelect, onAddToQueue }) => {
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
      group.tracks.sort((a, b) => (a.trackNo || 999) - (b.trackNo || 999));
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
    <div className="w-full max-w-2xl mx-auto px-4 pb-24">
      <h2 className="text-2xl font-bold mb-6 text-sp-text">Liäder</h2>

      <div className="space-y-8">
        {groupedTracks.map((group, groupIndex) => (
          <div key={group.name || 'no-album'}>
            {/* Album header */}
            {group.name ? (
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-sp-gray">
                {group.albumArt && (
                  <img
                    src={group.albumArt}
                    alt={group.name}
                    className="w-8 h-8 rounded shadow-md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-sp-green truncate">
                    {group.name}
                  </h3>
                  <p className="text-xs text-sp-text-muted">
                    {group.tracks.length} {group.tracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-sp-gray">
                <div className="w-8 h-8 rounded bg-sp-gray flex items-center justify-center">
                  <svg className="w-4 h-4 text-sp-text-muted" fill="currentColor" viewBox="0 0 20 20">
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
                const displayNumber = track.trackNo || trackIndex + 1;

                return (
                  <div
                    key={track.id}
                    onClick={() => onTrackSelect(track)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onTrackSelect(track)}
                    className={`w-full text-left p-3 rounded-md transition-all duration-200 group cursor-pointer ${
                      isCurrentTrack
                        ? 'bg-sp-gray'
                        : 'hover:bg-sp-gray/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Track number or playing indicator */}
                      <div className="w-6 text-right flex-shrink-0">
                        {isCurrentTrack ? (
                          <svg className="w-4 h-4 text-sp-green mx-auto" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 22v-20l18 10-18 10z"/>
                          </svg>
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

                      {/* Album art - only show if no album (for grouped tracks it's redundant) */}
                      {!group.name && (
                        track.albumArt ? (
                          <img
                            src={track.albumArt}
                            alt={track.title}
                            className="w-10 h-10 object-cover rounded shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-sp-gray rounded flex items-center justify-center shadow-md">
                            <svg
                              className="w-5 h-5 text-sp-text-muted"
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
                        <p className={`font-medium truncate ${isCurrentTrack ? 'text-sp-green' : 'text-sp-text'}`}>
                          {track.title}
                        </p>
                        <p className="text-sm truncate text-sp-text-secondary">
                          {track.artist}
                        </p>
                      </div>

                      {/* Duration */}
                      {track.duration > 0 && (
                        <span className="text-sm text-sp-text-muted tabular-nums">
                          {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
                        </span>
                      )}

                      {/* Add to queue button */}
                      {onAddToQueue && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(track);
                          }}
                          className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-sp-light-gray text-sp-text-secondary hover:text-sp-text transition-all"
                          title="Ab id Warteschlangä"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
