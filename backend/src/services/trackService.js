import fs from 'fs/promises';
import path from 'path';
import { extractMetadata } from './metadataService.js';
import { config } from '../config/config.js';

const PUBLIC_DIR = path.join(config.tracksPath, 'public');
const PRIVATE_DIR = path.join(config.tracksPath, 'private');

// In-memory cache for tracks
let tracksCache = null;

/**
 * Get tracks from a specific directory
 * @param {string} directory - Directory path
 * @param {boolean} isPublic - Whether tracks are public
 * @returns {Promise<Array>} Array of track objects
 */
async function getTracksFromDirectory(directory, isPublic) {
  try {
    const files = await fs.readdir(directory);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

    const tracks = await Promise.all(
      mp3Files.map(async (file, index) => {
        const filePath = path.join(directory, file);
        const trackId = `${isPublic ? 'pub' : 'priv'}-${index}-${file.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const metadata = await extractMetadata(filePath, trackId);

        return {
          id: trackId,
          filename: file,
          isPublic,
          ...metadata,
        };
      })
    );

    // Sort by track number if available, otherwise by filename
    tracks.sort((a, b) => {
      // If both have track numbers, sort by those
      if (a.trackNo !== null && b.trackNo !== null) {
        return a.trackNo - b.trackNo;
      }
      // If only one has a track number, prioritize it
      if (a.trackNo !== null) return -1;
      if (b.trackNo !== null) return 1;
      // Otherwise, sort alphabetically by filename
      return a.filename.localeCompare(b.filename);
    });

    return tracks;
  } catch (error) {
    console.error(`Error reading tracks from ${directory}:`, error.message);
    return [];
  }
}

/**
 * Get all tracks (public and optionally private)
 * @param {boolean} includePrivate - Whether to include private tracks
 * @returns {Promise<Array>} Array of all tracks
 */
export async function getAllTracks(includePrivate = false) {
  // Use cache if available and not forcing refresh
  if (tracksCache) {
    return includePrivate
      ? tracksCache.all
      : tracksCache.public;
  }

  // Build cache
  const publicTracks = await getTracksFromDirectory(PUBLIC_DIR, true);
  const privateTracks = await getTracksFromDirectory(PRIVATE_DIR, false);

  tracksCache = {
    public: publicTracks,
    all: [...publicTracks, ...privateTracks],
  };

  console.log(`Loaded ${publicTracks.length} public tracks and ${privateTracks.length} private tracks`);

  return includePrivate ? tracksCache.all : tracksCache.public;
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
  const allTracks = await getAllTracks(true);
  return allTracks.find(track => track.id === trackId) || null;
}
