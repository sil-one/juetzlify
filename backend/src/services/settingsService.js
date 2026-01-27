import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config.js';

const SETTINGS_FILE = path.join(config.dataPath, 'settings.json');
const SETTINGS_TMP = SETTINGS_FILE + '.tmp';
const STATISTICS_FILE = path.join(config.dataPath, 'play-statistics.json');

let settingsCache = null;

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
 * Atomic write to file (write to .tmp, then rename)
 */
async function atomicWriteSettings(settings) {
  try {
    await ensureDataDir();
    // Write to temporary file first
    await fs.writeFile(
      SETTINGS_TMP,
      JSON.stringify(settings, null, 2),
      'utf-8'
    );
    // Atomic rename
    await fs.rename(SETTINGS_TMP, SETTINGS_FILE);
    settingsCache = null; // Clear cache after write
  } catch (error) {
    console.error('Error saving settings:', error.message);
    // Clean up temp file if it exists
    try {
      await fs.unlink(SETTINGS_TMP);
    } catch (e) {
      // Ignore
    }
    throw error;
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
 * Set wrapped page enabled status
 */
export async function setWrappedEnabled(type, enabled) {
  if (type !== 'public' && type !== 'private') {
    throw new Error('Invalid wrapped type. Must be "public" or "private"');
  }

  const settings = await getSettings();
  settings.wrappedEnabled[type] = enabled;
  await saveSettings(settings);

  return { success: true, type, enabled };
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
 * Set podcast ads enabled status
 */
export async function setPodcastAdsEnabled(type, enabled) {
  if (type !== 'public' && type !== 'private') {
    throw new Error('Invalid podcast ads type. Must be "public" or "private"');
  }

  const settings = await getSettings();
  settings.podcastAdsEnabled[type] = enabled;
  await saveSettings(settings);

  return { success: true, type, enabled };
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
