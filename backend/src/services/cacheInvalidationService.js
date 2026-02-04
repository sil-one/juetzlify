import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { config } from '../config/config.js';

const CACHE_VERSION_FILE = path.join(config.dataPath, 'cache-version.json');

let currentVersion = null;
let watcher = null;
let invalidationCallbacks = [];

/**
 * Register a callback to be called when caches should be invalidated
 * @param {Function} callback - Function to call on invalidation
 */
export function onCacheInvalidation(callback) {
  invalidationCallbacks.push(callback);
}

/**
 * Get the current cache version from file
 */
async function readCacheVersion() {
  try {
    const data = await fs.readFile(CACHE_VERSION_FILE, 'utf-8');
    return JSON.parse(data).version;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return 0;
    }
    console.error('Error reading cache version:', error.message);
    return 0;
  }
}

/**
 * Initialize the cache invalidation watcher
 * Call this once on server startup
 */
export async function initializeCacheInvalidation() {
  if (watcher) return; // Already initialized

  try {
    // Ensure data directory exists
    await fs.mkdir(config.dataPath, { recursive: true });

    // Create version file if it doesn't exist
    try {
      await fs.access(CACHE_VERSION_FILE);
    } catch {
      await fs.writeFile(CACHE_VERSION_FILE, JSON.stringify({ version: 0, timestamp: new Date().toISOString() }), 'utf-8');
    }

    // Read initial version
    currentVersion = await readCacheVersion();
    console.log(`[Cache] Initialized with version ${currentVersion}`);

    // Watch for changes
    watcher = fsSync.watch(CACHE_VERSION_FILE, async (eventType) => {
      if (eventType === 'change') {
        const newVersion = await readCacheVersion();
        if (newVersion !== currentVersion) {
          console.log(`[Cache] Version changed from ${currentVersion} to ${newVersion}, invalidating caches...`);
          currentVersion = newVersion;

          // Call all registered callbacks
          for (const callback of invalidationCallbacks) {
            try {
              callback();
            } catch (error) {
              console.error('[Cache] Error in invalidation callback:', error.message);
            }
          }
        }
      }
    });

    console.log('✓ Cache invalidation watcher initialized');
  } catch (error) {
    console.error('⚠ Could not initialize cache invalidation watcher:', error.message);
  }
}

/**
 * Trigger cache invalidation across all workers
 * This bumps the version number, which all workers detect via file watcher
 */
export async function invalidateAllCaches() {
  try {
    await fs.mkdir(config.dataPath, { recursive: true });

    const newVersion = Date.now(); // Use timestamp as version for uniqueness
    await fs.writeFile(
      CACHE_VERSION_FILE,
      JSON.stringify({ version: newVersion, timestamp: new Date().toISOString() }),
      'utf-8'
    );

    console.log(`[Cache] Triggered invalidation, new version: ${newVersion}`);
    return { success: true, version: newVersion };
  } catch (error) {
    console.error('Error triggering cache invalidation:', error.message);
    throw error;
  }
}
