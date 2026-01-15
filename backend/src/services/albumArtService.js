import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/config.js';

const CACHE_DIR = config.cachePath;

/**
 * Cache album art from MP3 ID3 tags
 * @param {string} trackId - Unique track identifier
 * @param {Object} pictureData - ID3 picture data from music-metadata
 * @returns {Promise<string>} URL path to cached album art
 */
export async function cacheAlbumArt(trackId, pictureData) {
  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const outputPath = path.join(CACHE_DIR, `${trackId}.jpg`);

  // Check if already cached
  try {
    await fs.access(outputPath);
    return `/api/album-art/${trackId}.jpg`;
  } catch {
    // Not cached, process and save
  }

  try {
    // Resize to max 800x800 for mobile optimization
    await sharp(pictureData.data)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    return `/api/album-art/${trackId}.jpg`;
  } catch (error) {
    console.error(`Error caching album art for ${trackId}:`, error.message);
    return null;
  }
}
