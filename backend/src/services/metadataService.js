import { parseFile } from 'music-metadata';
import path from 'path';
import { cacheAlbumArt } from './albumArtService.js';

/**
 * Extract metadata from MP3 file
 * @param {string} filePath - Path to MP3 file
 * @param {string} trackId - Unique track identifier
 * @returns {Promise<Object>} Track metadata
 */
export async function extractMetadata(filePath, trackId) {
  try {
    const metadata = await parseFile(filePath);
    const { common, format } = metadata;

    // Extract and cache album art if available
    let albumArtUrl = null;
    if (common.picture && common.picture.length > 0) {
      albumArtUrl = await cacheAlbumArt(trackId, common.picture[0]);
    }

    return {
      title: common.title || path.basename(filePath, '.mp3'),
      artist: common.artist || 'Unknown Artist',
      album: common.album || null,
      albumArt: albumArtUrl,
      duration: format.duration || 0,
      trackNo: common.track?.no || null,
      trackTotal: common.track?.of || null,
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error.message);

    // Return basic metadata if extraction fails
    return {
      title: path.basename(filePath, '.mp3'),
      artist: 'Unknown Artist',
      album: null,
      albumArt: null,
      duration: 0,
      trackNo: null,
      trackTotal: null,
    };
  }
}
