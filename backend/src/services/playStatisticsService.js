import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/config.js';

const STATISTICS_FILE = path.join(config.dataPath, 'play-statistics.json');
const STATISTICS_TMP = STATISTICS_FILE + '.tmp';

let statisticsCache = null;
let pendingPlays = [];
let batchWriterInterval = null;

/**
 * Carnival 2026 date configuration
 */
const CARNIVAL_2026 = {
  startDate: '2026-02-11',
  endDate: '2026-02-17',
  dayNames: {
    '2026-02-11': 'Yytrummlä-Mittwuch',
    '2026-02-12': 'Schmutzigä Donnstig',
    '2026-02-13': 'Fritig',
    '2026-02-14': 'Samschtig',
    '2026-02-15': 'Sunntig',
    '2026-02-16': 'Gidelmäntig',
    '2026-02-17': 'Üstrummlä-Zischtig',
  },
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
 * Load statistics from file
 */
async function loadStatistics() {
  try {
    const data = await fs.readFile(STATISTICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, create initial structure
      const initialData = {
        plays: [],
        carnival2026: CARNIVAL_2026,
      };
      await saveStatistics(initialData);
      return initialData;
    }
    console.error('Error loading play statistics:', error.message);
    return {
      plays: [],
      carnival2026: CARNIVAL_2026,
    };
  }
}

/**
 * Atomic write to file (write to .tmp, then rename)
 */
async function atomicWriteStatistics(statistics) {
  try {
    await ensureDataDir();
    // Write to temporary file first
    await fs.writeFile(
      STATISTICS_TMP,
      JSON.stringify(statistics, null, 2),
      'utf-8'
    );
    // Atomic rename
    await fs.rename(STATISTICS_TMP, STATISTICS_FILE);
    statisticsCache = null; // Clear cache after write
  } catch (error) {
    console.error('Error saving play statistics:', error.message);
    // Clean up temp file if it exists
    try {
      await fs.unlink(STATISTICS_TMP);
    } catch (e) {
      // Ignore
    }
    throw error;
  }
}

/**
 * Save statistics to file
 */
async function saveStatistics(statistics) {
  return atomicWriteStatistics(statistics);
}

/**
 * Get statistics (with caching)
 */
async function getStatistics() {
  if (statisticsCache) {
    return statisticsCache;
  }
  const statistics = await loadStatistics();
  statisticsCache = statistics;
  return statistics;
}

/**
 * Record a play after 15 seconds (adds to queue for batch writing)
 */
export async function recordPlay(trackId, filename, visibility, title, artist, album) {
  try {
    const now = new Date();
    const play = {
      trackId,
      filename,
      title: title || 'Unknown Track',
      artist: artist || 'Unknown Artist',
      album: album || null,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0], // YYYY-MM-DD
      visibility,
    };

    // Add to pending queue (non-blocking)
    pendingPlays.push(play);

    // Get current total for response (from cache + pending)
    const statistics = await getStatistics();
    const totalPlays = statistics.plays.length + pendingPlays.length;

    console.log(`Play queued: ${title || filename} by ${artist || 'Unknown Artist'} (${visibility})`);
    return { success: true, totalPlays };
  } catch (error) {
    console.error('Error recording play:', error.message);
    throw error;
  }
}

/**
 * Get play count for a specific track (for admin panel)
 */
export async function getTrackPlayCount(filename) {
  const statistics = await getStatistics();
  const count = statistics.plays.filter((play) => play.filename === filename)
    .length;
  return count;
}

/**
 * Get play counts for all tracks (for admin panel)
 */
export async function getAllTrackPlayCounts() {
  const statistics = await getStatistics();
  const counts = {};

  statistics.plays.forEach((play) => {
    counts[play.filename] = (counts[play.filename] || 0) + 1;
  });

  return counts;
}

/**
 * Get overall statistics
 */
export async function getOverallStatistics() {
  const statistics = await getStatistics();
  const today = new Date().toISOString().split('T')[0];

  // Calculate totals
  const totalPlays = statistics.plays.length;
  const playsToday = statistics.plays.filter((play) => play.date === today)
    .length;

  // Unique tracks
  const uniqueTracks = new Set(statistics.plays.map((play) => play.filename))
    .size;

  // Top tracks (all time) with metadata
  const trackCounts = {};
  const trackMetadata = {};
  statistics.plays.forEach((play) => {
    trackCounts[play.filename] = (trackCounts[play.filename] || 0) + 1;
    // Store metadata from first occurrence
    if (!trackMetadata[play.filename]) {
      trackMetadata[play.filename] = {
        title: play.title,
        artist: play.artist,
        album: play.album,
      };
    }
  });

  const topTracks = Object.entries(trackCounts)
    .map(([filename, count]) => ({
      filename,
      title: trackMetadata[filename].title,
      artist: trackMetadata[filename].artist,
      album: trackMetadata[filename].album,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  return {
    totalPlays,
    playsToday,
    uniqueTracks,
    topTracks,
  };
}

/**
 * Get carnival statistics
 */
export async function getCarnivalStatistics(includePrivate = false) {
  const statistics = await getStatistics();
  const { startDate, endDate, dayNames } = statistics.carnival2026;

  // Filter by carnival dates and visibility
  const carnivalPlays = statistics.plays.filter((play) => {
    const inCarnival = play.date >= startDate && play.date <= endDate;
    const visibilityMatch =
      includePrivate || play.visibility === 'public';
    return inCarnival && visibilityMatch;
  });

  // Calculate totals
  const totalPlays = carnivalPlays.length;
  const uniqueTracks = new Set(carnivalPlays.map((play) => play.filename)).size;

  // Top tracks during carnival (with metadata)
  const trackCounts = {};
  const trackMetadata = {};
  carnivalPlays.forEach((play) => {
    trackCounts[play.filename] = (trackCounts[play.filename] || 0) + 1;
    // Store metadata from first occurrence
    if (!trackMetadata[play.filename]) {
      trackMetadata[play.filename] = {
        trackId: play.trackId,
        title: play.title,
        artist: play.artist,
        album: play.album,
      };
    }
  });

  const topTracks = Object.entries(trackCounts)
    .map(([filename, count]) => ({
      trackId: trackMetadata[filename].trackId,
      filename,
      title: trackMetadata[filename].title,
      artist: trackMetadata[filename].artist,
      album: trackMetadata[filename].album,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Plays by day
  const playsByDay = {};
  carnivalPlays.forEach((play) => {
    playsByDay[play.date] = (playsByDay[play.date] || 0) + 1;
  });

  // Add day names
  const playsByDayWithNames = Object.entries(playsByDay).map(
    ([date, plays]) => ({
      date,
      name: dayNames[date] || date,
      plays,
    })
  );

  // Find biggest day (sort a copy to avoid mutating the original array)
  const biggestDay = [...playsByDayWithNames].sort((a, b) => b.plays - a.plays)[0];

  // First and last track with metadata
  const firstPlay = carnivalPlays[0];
  const lastPlay = carnivalPlays[carnivalPlays.length - 1];

  const firstTrack = firstPlay ? {
    trackId: firstPlay.trackId,
    filename: firstPlay.filename,
    title: firstPlay.title,
    artist: firstPlay.artist,
    album: firstPlay.album,
  } : null;

  const lastTrack = lastPlay ? {
    trackId: lastPlay.trackId,
    filename: lastPlay.filename,
    title: lastPlay.title,
    artist: lastPlay.artist,
    album: lastPlay.album,
  } : null;

  // Calculate time of day statistics
  const timeOfDayCategories = {
    morning: 0,    // 8:00 - 13:00
    afternoon: 0,  // 13:00 - 18:00
    evening: 0,    // 18:00 - 00:00
    night: 0,      // 00:00 - 8:00
  };

  carnivalPlays.forEach((play) => {
    const hour = new Date(play.timestamp).getHours();

    if (hour >= 8 && hour < 13) {
      timeOfDayCategories.morning++;
    } else if (hour >= 13 && hour < 18) {
      timeOfDayCategories.afternoon++;
    } else if (hour >= 18 && hour < 24) {
      timeOfDayCategories.evening++;
    } else {
      timeOfDayCategories.night++;
    }
  });

  // Find most active time period
  const timeOfDayEntries = Object.entries(timeOfDayCategories).map(([period, plays]) => ({
    period,
    plays,
  })).sort((a, b) => b.plays - a.plays);

  const mostActiveTimeOfDay = timeOfDayEntries[0];

  return {
    totalPlays,
    uniqueTracks,
    topTracks,
    playsByDay: playsByDayWithNames,
    biggestDay,
    firstTrack,
    lastTrack,
    timeOfDayStats: timeOfDayEntries,
    mostActiveTimeOfDay,
  };
}


/**
 * Clear statistics cache
 */
export function clearStatisticsCache() {
  statisticsCache = null;
}

/**
 * Flush pending plays to disk (batch write)
 */
async function flushPendingPlays() {
  if (pendingPlays.length === 0) {
    return; // Nothing to write
  }

  try {
    const statistics = await getStatistics();
    const playsToWrite = [...pendingPlays]; // Copy for atomic operation
    statistics.plays.push(...playsToWrite);

    await atomicWriteStatistics(statistics);

    // Clear pending queue only after successful write
    pendingPlays = [];

    if (playsToWrite.length > 0) {
      console.log(`✓ Batch written ${playsToWrite.length} play records to disk`);
    }
  } catch (error) {
    console.error('Error flushing pending plays:', error.message);
    // Don't clear pending plays on error - they'll be retried next interval
  }
}

/**
 * Initialize batch writer (should be called once on server startup)
 */
export function initializeBatchWriter(intervalMs = 5000) {
  if (batchWriterInterval) {
    console.warn('Batch writer already initialized');
    return;
  }

  console.log(`Starting batch writer (interval: ${intervalMs}ms)`);
  batchWriterInterval = setInterval(flushPendingPlays, intervalMs);

  // Ensure pending plays are flushed on process exit
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, flushing pending plays...');
    flushPendingPlays().then(() => {
      console.log('Pending plays flushed');
      process.exit(0);
    }).catch((error) => {
      console.error('Error flushing on SIGTERM:', error);
      process.exit(1);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, flushing pending plays...');
    flushPendingPlays().then(() => {
      console.log('Pending plays flushed');
      process.exit(0);
    }).catch((error) => {
      console.error('Error flushing on SIGINT:', error);
      process.exit(1);
    });
  });
}

/**
 * Stop batch writer (for testing/graceful shutdown)
 */
export async function stopBatchWriter() {
  if (batchWriterInterval) {
    clearInterval(batchWriterInterval);
    batchWriterInterval = null;
  }
  // Final flush
  await flushPendingPlays();
  console.log('Batch writer stopped');
}
