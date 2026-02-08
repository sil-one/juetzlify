import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import { config } from '../config/config.js';

const SETTINGS_FILE = path.join(config.dataPath, 'settings.json');
const SETTINGS_TMP = SETTINGS_FILE + '.tmp';
const SETTINGS_LOCK = SETTINGS_FILE + '.lock';
const STATISTICS_FILE = path.join(config.dataPath, 'play-statistics.json');

let settingsCache = null;
let settingsWatcher = null;

/**
 * Initialize file watcher for settings.json
 * Ensures all PM2 workers see settings updates (wrapped, ads) in real-time
 */
function initializeSettingsWatcher() {
  if (settingsWatcher) return;

  try {
    if (!fsSync.existsSync(SETTINGS_FILE)) {
      console.log('settings.json not found yet, watcher will start when file is created');
      return;
    }

    settingsWatcher = fsSync.watch(SETTINGS_FILE, (eventType) => {
      if (eventType === 'change') {
        settingsCache = null;
        console.log('Settings file changed (wrapped/ads), cache cleared across worker');
      }
    });

    console.log('✓ Settings file watcher initialized');
  } catch (error) {
    console.warn('⚠ Could not initialize settings watcher:', error.message);
  }
}

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
 * Load settings from file
 */
async function loadSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, try to migrate from play-statistics.json
      return await migrateFromStatistics();
    }
    console.error('Error loading settings:', error.message);
    return getDefaultSettings();
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    wrappedEnabled: {
      public: false,
      private: false,
    },
    podcastAdsEnabled: {
      public: true,
      private: true,
    },
    featuredShowIntervalMinutes: 60, // Default: 1 hour (0 = every reload)
  };
}

/**
 * Migrate settings from play-statistics.json if they exist
 */
async function migrateFromStatistics() {
  try {
    const data = await fs.readFile(STATISTICS_FILE, 'utf-8');
    const statistics = JSON.parse(data);

    const settings = {
      wrappedEnabled: statistics.wrappedEnabled || { public: false, private: false },
      podcastAdsEnabled: statistics.podcastAdsEnabled || { public: true, private: true },
    };

    // Save the migrated settings
    await saveSettings(settings);
    console.log('✓ Migrated settings from play-statistics.json');
    return settings;
  } catch (error) {
    console.error('Error migrating settings:', error.message);
    return getDefaultSettings();
  }
}

/**
 * Atomic write to file with file locking (write to .tmp, then rename)
 * Prevents race conditions in PM2 cluster mode
 */
async function atomicWriteSettings(settings) {
  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist (required for lockfile)
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(getDefaultSettings(), null, 2), 'utf-8');
    }

    // Acquire exclusive lock (wait up to 10s, retry every 100ms)
    release = await lockfile.lock(SETTINGS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000, // Consider lock stale after 10s
    });

    console.log('[Settings] Lock acquired, writing settings...');

    // Write to temporary file first
    await fs.writeFile(
      SETTINGS_TMP,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );

    // Atomic rename (overwrites target atomically)
    await fs.rename(SETTINGS_TMP, SETTINGS_FILE);

    // Clear cache after write
    settingsCache = null;

    console.log('[Settings] Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error.message);

    // Clean up temp file if it exists
    try {
      await fs.unlink(SETTINGS_TMP);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  } finally {
    // Always release the lock
    if (release) {
      try {
        await release();
        console.log('[Settings] Lock released');
      } catch (error) {
        console.error('[Settings] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Save settings to file
 */
async function saveSettings(settings) {
  return atomicWriteSettings(settings);
}

/**
 * Get settings (with caching)
 */
async function getSettings() {
  if (settingsCache) {
    return settingsCache;
  }
  const settings = await loadSettings();
  settingsCache = settings;

  // Initialize watcher after first load
  initializeSettingsWatcher();

  return settings;
}

/**
 * Get wrapped pages enabled status
 */
export async function getWrappedStatus() {
  const settings = await getSettings();
  return settings.wrappedEnabled;
}

/**
 * Set wrapped page enabled status with atomic read-modify-write
 */
export async function setWrappedEnabled(type, enabled) {
  if (type !== 'public' && type !== 'private') {
    throw new Error('Invalid wrapped type. Must be "public" or "private"');
  }

  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(getDefaultSettings(), null, 2), 'utf-8');
    }

    // Acquire lock BEFORE reading
    release = await lockfile.lock(SETTINGS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    console.log(`[Settings] Lock acquired for updating wrapped ${type}...`);

    // Read latest data with lock held
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    // Ensure structure exists
    if (!settings.wrappedEnabled) {
      settings.wrappedEnabled = { public: false, private: false };
    }

    // Modify
    settings.wrappedEnabled[type] = enabled;

    // Write to temp file
    await fs.writeFile(SETTINGS_TMP, JSON.stringify(settings, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(SETTINGS_TMP, SETTINGS_FILE);

    // Clear cache
    settingsCache = null;

    console.log(`[Settings] Updated wrapped ${type} to ${enabled}`);

    return { success: true, type, enabled };
  } catch (error) {
    console.error('Error setting wrapped enabled:', error.message);

    try {
      await fs.unlink(SETTINGS_TMP);
    } catch {
      // Ignore
    }

    throw error;
  } finally {
    if (release) {
      try {
        await release();
        console.log('[Settings] Lock released');
      } catch (error) {
        console.error('[Settings] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Check if wrapped page is enabled
 */
export async function isWrappedEnabled(type) {
  const settings = await getSettings();
  return settings.wrappedEnabled[type] === true;
}

/**
 * Get podcast ads enabled status
 */
export async function getPodcastAdsStatus() {
  const settings = await getSettings();
  return settings.podcastAdsEnabled;
}

/**
 * Set podcast ads enabled status with atomic read-modify-write
 */
export async function setPodcastAdsEnabled(type, enabled) {
  if (type !== 'public' && type !== 'private') {
    throw new Error('Invalid podcast ads type. Must be "public" or "private"');
  }

  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(getDefaultSettings(), null, 2), 'utf-8');
    }

    // Acquire lock BEFORE reading
    release = await lockfile.lock(SETTINGS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    console.log(`[Settings] Lock acquired for updating podcast ads ${type}...`);

    // Read latest data with lock held
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    // Ensure structure exists
    if (!settings.podcastAdsEnabled) {
      settings.podcastAdsEnabled = { public: true, private: true };
    }

    // Modify
    settings.podcastAdsEnabled[type] = enabled;

    // Write to temp file
    await fs.writeFile(SETTINGS_TMP, JSON.stringify(settings, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(SETTINGS_TMP, SETTINGS_FILE);

    // Clear cache
    settingsCache = null;

    console.log(`[Settings] Updated podcast ads ${type} to ${enabled}`);

    return { success: true, type, enabled };
  } catch (error) {
    console.error('Error setting podcast ads enabled:', error.message);

    try {
      await fs.unlink(SETTINGS_TMP);
    } catch {
      // Ignore
    }

    throw error;
  } finally {
    if (release) {
      try {
        await release();
        console.log('[Settings] Lock released');
      } catch (error) {
        console.error('[Settings] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Check if podcast ads are enabled for a type
 */
export async function arePodcastAdsEnabled(type) {
  const settings = await getSettings();
  return settings.podcastAdsEnabled[type] === true;
}

/**
 * Clear settings cache
 */
export function clearSettingsCache() {
  settingsCache = null;
}

/**
 * Get featured show interval in minutes
 */
export async function getFeaturedShowInterval() {
  const settings = await getSettings();
  return settings.featuredShowIntervalMinutes ?? 60;
}

/**
 * Set featured show interval in minutes with atomic read-modify-write
 */
export async function setFeaturedShowInterval(minutes) {
  if (typeof minutes !== 'number' || minutes < 0) {
    throw new Error('Invalid interval. Must be a non-negative number');
  }

  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist
    try {
      await fs.access(SETTINGS_FILE);
    } catch {
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(getDefaultSettings(), null, 2), 'utf-8');
    }

    // Acquire lock BEFORE reading
    release = await lockfile.lock(SETTINGS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    console.log(`[Settings] Lock acquired for updating featured show interval...`);

    // Read latest data with lock held
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);

    // Modify
    settings.featuredShowIntervalMinutes = minutes;

    // Write to temp file
    await fs.writeFile(SETTINGS_TMP, JSON.stringify(settings, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(SETTINGS_TMP, SETTINGS_FILE);

    // Clear cache
    settingsCache = null;

    console.log(`[Settings] Updated featured show interval to ${minutes} minutes`);

    return { success: true, minutes };
  } catch (error) {
    console.error('Error setting featured show interval:', error.message);

    try {
      await fs.unlink(SETTINGS_TMP);
    } catch {
      // Ignore
    }

    throw error;
  } finally {
    if (release) {
      try {
        await release();
        console.log('[Settings] Lock released');
      } catch (error) {
        console.error('[Settings] Error releasing lock:', error.message);
      }
    }
  }
}
