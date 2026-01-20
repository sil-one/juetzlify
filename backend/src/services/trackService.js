import fs from 'fs/promises';
import path from 'path';
import { extractMetadata } from './metadataService.js';
import { config } from '../config/config.js';
import { getTrackVisibility, Visibility } from './visibilityService.js';

const ALL_TRACKS_DIR = path.join(config.tracksPath, 'all');

// In-memory cache for tracks
let tracksCache = null;

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

    // Sort by track number if available, otherwise by filename
    tracks.sort((a, b) => {
      // If both have track numbers, sort by those
      if (a.trackNo !== null && b.trackNo !== null) {
        // Explicitly convert to numbers to ensure numeric sorting
        return Number(a.trackNo) - Number(b.trackNo);
      }
      // If only one has a track number, prioritize it
      if (a.trackNo !== null) return -1;
      if (b.trackNo !== null) return 1;
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
