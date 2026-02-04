import fs from 'fs/promises';
import fsSync from 'fs';
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

/**
 * Delete all cached album art for a given filename
 * Since trackId includes the filename, we delete all matching cache files
 * @param {string} filename - The filename to match (e.g., "song.mp3")
 */
export async function deleteAlbumArtCache(filename) {
  try {
    // Convert filename to the pattern used in trackId
    const filenamePattern = filename.replace(/[^a-zA-Z0-9]/g, '-');

    // Read cache directory
    const files = await fs.readdir(CACHE_DIR);

    // Find and delete matching files
    let deletedCount = 0;
    for (const file of files) {
      if (file.includes(filenamePattern) && file.endsWith('.jpg')) {
        const filePath = path.join(CACHE_DIR, file);
        await fs.unlink(filePath);
        console.log(`Deleted album art cache: ${file}`);
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Cache directory doesn't exist, nothing to delete
      return { success: true, deletedCount: 0 };
    }
    console.error(`Error deleting album art cache for ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Clear all cached album art
 * Used when refreshing all metadata
 */
export async function clearAllAlbumArtCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.jpg')) {
        const filePath = path.join(CACHE_DIR, file);
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    console.log(`Cleared ${deletedCount} album art cache files`);
    return { success: true, deletedCount };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, deletedCount: 0 };
    }
    console.error('Error clearing album art cache:', error.message);
    throw error;
  }
}
