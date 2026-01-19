import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config.js';

const METADATA_FILE = path.join(config.dataPath, 'track-visibility.json');
const OLD_PUBLIC_DIR = path.join(config.tracksPath, 'public');
const OLD_PRIVATE_DIR = path.join(config.tracksPath, 'private');
const NEW_ALL_DIR = path.join(config.tracksPath, 'all');

let visibilityCache = null;
let migrationCompleted = false;

/**
 * Track visibility states
 */
export const Visibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  DISABLED: 'disabled',
};

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(config.dataPath, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error.message);
  }
}

/**
 * Load visibility metadata from file
 */
async function loadMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet
      return { tracks: {} };
    }
    console.error('Error loading visibility metadata:', error.message);
    return { tracks: {} };
  }
}

/**
 * Save visibility metadata to file
 */
async function saveMetadata(metadata) {
  try {
    await ensureDataDir();
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
    visibilityCache = null; // Clear cache
  } catch (error) {
    console.error('Error saving visibility metadata:', error.message);
    throw error;
  }
}

/**
 * Check if migration is needed
 */
async function needsMigration() {
  try {
    // Check if old directories exist and have MP3 files
    const [publicExists, privateExists] = await Promise.all([
      fs.access(OLD_PUBLIC_DIR).then(() => true).catch(() => false),
      fs.access(OLD_PRIVATE_DIR).then(() => true).catch(() => false),
    ]);

    // If neither old directory exists, no migration needed
    if (!publicExists && !privateExists) {
      return false;
    }

    // Check if there are MP3 files in old directories
    let hasMp3sInOld = false;

    if (publicExists) {
      const publicFiles = await fs.readdir(OLD_PUBLIC_DIR);
      const publicMp3s = publicFiles.filter(f => f.toLowerCase().endsWith('.mp3'));
      if (publicMp3s.length > 0) {
        hasMp3sInOld = true;
      }
    }

    if (privateExists) {
      const privateFiles = await fs.readdir(OLD_PRIVATE_DIR);
      const privateMp3s = privateFiles.filter(f => f.toLowerCase().endsWith('.mp3'));
      if (privateMp3s.length > 0) {
        hasMp3sInOld = true;
      }
    }

    return hasMp3sInOld;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Migrate tracks from public/private folders to all/ folder
 */
export async function migrateTracks() {
  if (migrationCompleted) {
    return { success: true, message: 'Migration already completed' };
  }

  const needsMig = await needsMigration();
  if (!needsMig) {
    migrationCompleted = true;
    return { success: true, message: 'Migration not needed' };
  }

  console.log('Starting track migration...');

  try {
    // Create all/ directory
    await fs.mkdir(NEW_ALL_DIR, { recursive: true });

    const metadata = { tracks: {} };
    let movedCount = 0;

    // Migrate public tracks
    try {
      const publicFiles = await fs.readdir(OLD_PUBLIC_DIR);
      const publicMp3s = publicFiles.filter(f => f.toLowerCase().endsWith('.mp3'));

      for (const file of publicMp3s) {
        const oldPath = path.join(OLD_PUBLIC_DIR, file);
        const newPath = path.join(NEW_ALL_DIR, file);
        await fs.rename(oldPath, newPath);
        metadata.tracks[file] = Visibility.PUBLIC;
        movedCount++;
      }

      console.log(`Migrated ${publicMp3s.length} public tracks`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error migrating public tracks:', error.message);
      }
    }

    // Migrate private tracks
    try {
      const privateFiles = await fs.readdir(OLD_PRIVATE_DIR);
      const privateMp3s = privateFiles.filter(f => f.toLowerCase().endsWith('.mp3'));

      for (const file of privateMp3s) {
        const oldPath = path.join(OLD_PRIVATE_DIR, file);
        const newPath = path.join(NEW_ALL_DIR, file);
        await fs.rename(oldPath, newPath);
        metadata.tracks[file] = Visibility.PRIVATE;
        movedCount++;
      }

      console.log(`Migrated ${privateMp3s.length} private tracks`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error migrating private tracks:', error.message);
      }
    }

    // Save metadata
    await saveMetadata(metadata);

    migrationCompleted = true;
    console.log(`Migration completed! Moved ${movedCount} tracks to all/ directory`);

    return {
      success: true,
      message: `Migration completed successfully. Moved ${movedCount} tracks.`,
      movedCount,
    };
  } catch (error) {
    console.error('Migration failed:', error.message);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
    };
  }
}

/**
 * Get all visibility metadata
 */
export async function getVisibilityMetadata() {
  if (visibilityCache) {
    return visibilityCache;
  }

  const metadata = await loadMetadata();
  visibilityCache = metadata;
  return metadata;
}

/**
 * Get visibility for a specific track
 */
export async function getTrackVisibility(filename) {
  const metadata = await getVisibilityMetadata();
  return metadata.tracks[filename] || Visibility.DISABLED;
}

/**
 * Set visibility for a specific track
 */
export async function setTrackVisibility(filename, visibility) {
  if (!Object.values(Visibility).includes(visibility)) {
    throw new Error(`Invalid visibility: ${visibility}`);
  }

  const metadata = await getVisibilityMetadata();
  metadata.tracks[filename] = visibility;
  await saveMetadata(metadata);

  return { success: true, filename, visibility };
}

/**
 * Get all tracks with their visibility
 */
export async function getAllTracksWithVisibility() {
  const metadata = await getVisibilityMetadata();
  return metadata.tracks;
}

/**
 * Clear visibility cache
 */
export function clearVisibilityCache() {
  visibilityCache = null;
}
