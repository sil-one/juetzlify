import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { extractMetadata } from './metadataService.js';
import { config } from '../config/config.js';
import { getTrackVisibility, Visibility } from './visibilityService.js';
import { onCacheInvalidation } from './cacheInvalidationService.js';

const ALL_TRACKS_DIR = path.join(config.tracksPath, 'all');

// In-memory cache for tracks
let tracksCache = null;

// File watcher for track visibility changes
let watcher = null;

// Register for cross-worker cache invalidation
onCacheInvalidation(() => {
  console.log('[TrackService] Cache invalidated by another worker');
  tracksCache = null;
});

/**
 * Initialize file watcher for track-visibility.json
 * Automatically refreshes cache when visibility changes
 */
function initializeWatcher() {
  if (watcher) return; // Already watching

  const trackVisibilityPath = path.join(config.dataPath, 'track-visibility.json');

  try {
    // Check if file exists before watching
    if (!fsSync.existsSync(trackVisibilityPath)) {
      console.log('track-visibility.json not found, watcher will start when file is created');
      return;
    }

    watcher = fsSync.watch(trackVisibilityPath, (eventType) => {
      if (eventType === 'change') {
        console.log('Track visibility changed, refreshing cache across all workers...');
        refreshCache();
      }
    });

    console.log('✓ File watcher initialized for track-visibility.json');
  } catch (error) {
    console.warn('⚠ Could not initialize file watcher:', error.message);
  }
}

/**
 * Get all tracks from the all/ directory with visibility info
 * @returns {Promise<Array>} Array of track objects with visibility
 */
async function loadAllTracks() {
  try {
    // Ensure directory exists
    await fs.mkdir(ALL_TRACKS_DIR, { recursive: true });

    const files = await fs.readdir(ALL_TRACKS_DIR);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

    const tracks = await Promise.all(
      mp3Files.map(async (file, index) => {
        const filePath = path.join(ALL_TRACKS_DIR, file);
        const visibility = await getTrackVisibility(file);
        const trackId = `track-${index}-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const metadata = await extractMetadata(filePath, trackId);

        return {
          id: trackId,
          filename: file,
          visibility,
          ...metadata,
        };
      })
    );

    // Sort by album, then track number, then filename
    tracks.sort((a, b) => {
      // First sort by album
      const albumA = a.album || '';
      const albumB = b.album || '';
      const albumCompare = albumA.localeCompare(albumB);
      if (albumCompare !== 0) return albumCompare;

      // Within same album, sort by track number
      if (a.trackNo != null && b.trackNo != null) {
        const trackA = parseInt(String(a.trackNo), 10);
        const trackB = parseInt(String(b.trackNo), 10);
        if (!isNaN(trackA) && !isNaN(trackB)) {
          return trackA - trackB;
        }
      }

      // If only one has a track number, prioritize it
      if (a.trackNo != null && !isNaN(parseInt(String(a.trackNo), 10))) return -1;
      if (b.trackNo != null && !isNaN(parseInt(String(b.trackNo), 10))) return 1;

      // Otherwise, sort alphabetically by filename
      return a.filename.localeCompare(b.filename);
    });

    return tracks;
  } catch (error) {
    console.error(`Error reading tracks from ${ALL_TRACKS_DIR}:`, error.message);
    return [];
  }
}

/**
 * Get all tracks filtered by type
 * @param {string} type - 'public', 'private', or 'all'
 * @returns {Promise<Array>} Array of filtered tracks
 */
export async function getAllTracks(type = 'public') {
  // Build cache if needed
  if (!tracksCache) {
    const allTracks = await loadAllTracks();
    tracksCache = {
      all: allTracks,
      public: allTracks.filter(t => t.visibility === Visibility.PUBLIC),
      private: allTracks.filter(t => t.visibility === Visibility.PRIVATE),
      enabled: allTracks.filter(t => t.visibility !== Visibility.DISABLED),
    };

    console.log(
      `Loaded ${tracksCache.public.length} public, ` +
      `${tracksCache.private.length} private, ` +
      `${tracksCache.all.length - tracksCache.enabled.length} disabled tracks`
    );

    // Initialize file watcher after first cache load
    initializeWatcher();
  }

  // Return filtered tracks based on type
  switch (type) {
    case 'public':
      return tracksCache.public;
    case 'private':
      return tracksCache.private;
    case 'all':
      return tracksCache.enabled; // Return all enabled (public + private)
    case 'admin':
      return tracksCache.all; // Return everything including disabled
    default:
      return tracksCache.public;
  }
}

/**
 * Refresh tracks cache
 */
export function refreshCache() {
  tracksCache = null;
  console.log('Tracks cache cleared');
}

/**
 * Get track by ID
 * @param {string} trackId - Track ID
 * @returns {Promise<Object|null>} Track object or null
 */
export async function getTrackById(trackId) {
  const allTracks = await getAllTracks('admin');
  return allTracks.find(track => track.id === trackId) || null;
}
