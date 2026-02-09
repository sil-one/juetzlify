import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';
import { config } from '../config/config.js';

const LYRICS_FILE = path.join(config.dataPath, 'track-lyrics.json');
const LYRICS_TMP = LYRICS_FILE + '.tmp';

let lyricsCache = null;

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
 * Load lyrics data from file
 */
async function loadLyricsData() {
  try {
    const data = await fs.readFile(LYRICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { lyrics: {} };
    }
    console.error('Error loading lyrics data:', error.message);
    return { lyrics: {} };
  }
}

/**
 * Get cached or fresh lyrics data
 */
async function getLyricsData() {
  if (lyricsCache) {
    return lyricsCache;
  }
  const data = await loadLyricsData();
  lyricsCache = data;
  return data;
}

/**
 * Get lyrics for a specific track
 */
export async function getLyrics(filename) {
  const data = await getLyricsData();
  return data.lyrics[filename] || null;
}

/**
 * Set lyrics for a specific track with atomic read-modify-write
 */
export async function setLyrics(filename, text) {
  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist (required for lockfile)
    try {
      await fs.access(LYRICS_FILE);
    } catch {
      await fs.writeFile(LYRICS_FILE, JSON.stringify({ lyrics: {} }, null, 2), 'utf-8');
    }

    // Acquire lock BEFORE reading
    release = await lockfile.lock(LYRICS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    // Read latest data with lock held
    const raw = await fs.readFile(LYRICS_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // Modify
    data.lyrics[filename] = text;

    // Write to temp file
    await fs.writeFile(LYRICS_TMP, JSON.stringify(data, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(LYRICS_TMP, LYRICS_FILE);

    // Clear cache
    lyricsCache = null;

    return { success: true, filename };
  } catch (error) {
    console.error('Error setting lyrics:', error.message);

    try {
      await fs.unlink(LYRICS_TMP);
    } catch {
      // Ignore
    }

    throw error;
  } finally {
    if (release) {
      try {
        await release();
      } catch (error) {
        console.error('[Lyrics] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Delete lyrics for a specific track
 */
export async function deleteLyrics(filename) {
  let release = null;

  try {
    await ensureDataDir();

    try {
      await fs.access(LYRICS_FILE);
    } catch {
      return { success: true, filename };
    }

    release = await lockfile.lock(LYRICS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    const raw = await fs.readFile(LYRICS_FILE, 'utf-8');
    const data = JSON.parse(raw);

    if (data.lyrics[filename]) {
      delete data.lyrics[filename];
    }

    await fs.writeFile(LYRICS_TMP, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(LYRICS_TMP, LYRICS_FILE);

    lyricsCache = null;

    return { success: true, filename };
  } catch (error) {
    console.error('Error deleting lyrics:', error.message);

    try {
      await fs.unlink(LYRICS_TMP);
    } catch {
      // Ignore
    }

    throw error;
  } finally {
    if (release) {
      try {
        await release();
      } catch (error) {
        console.error('[Lyrics] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Get a map of { filename: boolean } indicating which tracks have lyrics
 */
export async function getAllLyricsMetadata() {
  const data = await getLyricsData();
  const result = {};
  for (const filename of Object.keys(data.lyrics)) {
    result[filename] = true;
  }
  return result;
}
