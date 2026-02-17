import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';
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
    '2026-02-17': 'Gidelziischtig',
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
 * Atomic write to file with file locking (write to .tmp, then rename)
 * Prevents race conditions in PM2 cluster mode
 */
async function atomicWriteStatistics(statistics) {
  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist (required for lockfile)
    try {
      await fs.access(STATISTICS_FILE);
    } catch {
      const initialData = {
        plays: [],
        carnival2026: CARNIVAL_2026,
      };
      await fs.writeFile(STATISTICS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }

    // Acquire exclusive lock (wait up to 10s, retry every 100ms)
    release = await lockfile.lock(STATISTICS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000, // Consider lock stale after 10s
    });

    console.log('[Statistics] Lock acquired, writing statistics...');

    // Write to temporary file first
    await fs.writeFile(
      STATISTICS_TMP,
      JSON.stringify(statistics, null, 2),
      'utf-8'
    );

    // Atomic rename (overwrites target atomically)
    await fs.rename(STATISTICS_TMP, STATISTICS_FILE);

    // Clear cache after write
    statisticsCache = null;

    console.log('[Statistics] Statistics saved successfully');
  } catch (error) {
    console.error('Error saving play statistics:', error.message);

    // Clean up temp file if it exists
    try {
      await fs.unlink(STATISTICS_TMP);
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  } finally {
    // Always release the lock
    if (release) {
      try {
        await release();
        console.log('[Statistics] Lock released');
      } catch (error) {
        console.error('[Statistics] Error releasing lock:', error.message);
      }
    }
  }
}

/**
 * Save statistics to file
 */
async function saveStatistics(statistics) {
  return atomicWriteStatistics(statistics);
}

/**
 * Get statistics (cached, used by recordPlay for fast non-blocking reads)
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
 * Flush this worker's pending plays to disk, then read fresh from disk.
 * Bypasses cache to ensure consistency across PM2 workers.
 * Used by admin/stats endpoints.
 */
async function flushAndGetStatistics() {
  await flushPendingPlays();
  const statistics = await loadStatistics();
  statisticsCache = statistics;
  return statistics;
}

/**
 * Record a play after 15 seconds (adds to queue for batch writing)
 * @param {string} timestamp - Optional timestamp for offline plays (ISO string)
 */
export async function recordPlay(trackId, filename, visibility, title, artist, album, timestamp) {
  try {
    const now = timestamp ? new Date(timestamp) : new Date();
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

    console.log(`Play queued: ${title || filename} by ${artist || 'Unknown Artist'} (${visibility})${timestamp ? ' [offline sync]' : ''}`);
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
  const statistics = await flushAndGetStatistics();
  const count = statistics.plays.filter((play) => play.filename === filename)
    .length;
  return count;
}

/**
 * Get play counts for all tracks (for admin panel)
 */
export async function getAllTrackPlayCounts() {
  const statistics = await flushAndGetStatistics();
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
  const statistics = await flushAndGetStatistics();
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
  const statistics = await flushAndGetStatistics();
  const { startDate, endDate, dayNames } = statistics.carnival2026;

  // All-time total plays (all tracks, regardless of visibility)
  const allTimeTotalPlays = statistics.plays.length;

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
    allTimeTotalPlays,
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
 * Flush pending plays to disk (batch write with file locking)
 * Ensures atomic read-modify-write across PM2 instances
 */
async function flushPendingPlays() {
  if (pendingPlays.length === 0) {
    return; // Nothing to write
  }

  let release = null;

  try {
    await ensureDataDir();

    // Create file if it doesn't exist (required for lockfile)
    try {
      await fs.access(STATISTICS_FILE);
    } catch {
      const initialData = {
        plays: [],
        carnival2026: CARNIVAL_2026,
      };
      await fs.writeFile(STATISTICS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }

    // Acquire exclusive lock BEFORE reading
    release = await lockfile.lock(STATISTICS_FILE, {
      retries: {
        retries: 100,
        minTimeout: 100,
        maxTimeout: 500,
      },
      stale: 10000,
    });

    console.log(`[Statistics] Lock acquired for batch write (${pendingPlays.length} plays)...`);

    // NOW read the file with lock held (ensures latest data)
    const data = await fs.readFile(STATISTICS_FILE, 'utf-8');
    const statistics = JSON.parse(data);

    // Add pending plays
    const playsToWrite = [...pendingPlays];
    statistics.plays.push(...playsToWrite);

    // Write to temporary file first
    await fs.writeFile(
      STATISTICS_TMP,
      JSON.stringify(statistics, null, 2),
      'utf-8'
    );

    // Atomic rename
    await fs.rename(STATISTICS_TMP, STATISTICS_FILE);

    // Clear cache and pending queue only after successful write
    statisticsCache = null;
    pendingPlays = [];

    console.log(`✓ Batch written ${playsToWrite.length} play records to disk`);
  } catch (error) {
    console.error('Error flushing pending plays:', error.message);
    // Don't clear pending plays on error - they'll be retried next interval
  } finally {
    // Always release the lock
    if (release) {
      try {
        await release();
        console.log('[Statistics] Lock released');
      } catch (error) {
        console.error('[Statistics] Error releasing lock:', error.message);
      }
    }
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

/**
 * Get recent plays (sorted by timestamp descending)
 */
export async function getRecentPlays(limit = 50) {
  const statistics = await flushAndGetStatistics();

  // Sort plays by timestamp descending and return top N
  return statistics.plays
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Get hottest tracks within a time window
 */
export async function getHottestTracks(hoursAgo = 24) {
  const statistics = await flushAndGetStatistics();
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  // Filter plays within time window
  const recentPlays = statistics.plays.filter((play) => {
    return new Date(play.timestamp) >= cutoffTime;
  });

  // Aggregate plays per track
  const trackCounts = {};
  const trackMetadata = {};

  recentPlays.forEach((play) => {
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

  // Return top 10 tracks with metadata
  return Object.entries(trackCounts)
    .map(([filename, count]) => ({
      trackId: trackMetadata[filename].trackId,
      filename,
      title: trackMetadata[filename].title,
      artist: trackMetadata[filename].artist,
      album: trackMetadata[filename].album,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get plays timeline (hourly buckets)
 */
export async function getPlaysTimeline(hoursAgo = 24) {
  const statistics = await flushAndGetStatistics();
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  // Filter plays within time window
  const recentPlays = statistics.plays.filter((play) => {
    return new Date(play.timestamp) >= cutoffTime;
  });

  // Determine bucket size based on time window to keep data points manageable
  let bucketSizeHours = 1; // default: hourly buckets
  if (hoursAgo > 24 && hoursAgo <= 72) {
    bucketSizeHours = 4; // 3d: 4-hour buckets → 18 points
  } else if (hoursAgo > 72) {
    bucketSizeHours = 12; // 7d: 12-hour buckets → 14 points
  }

  const numBuckets = Math.ceil(hoursAgo / bucketSizeHours);

  // Create buckets
  const buckets = [];
  for (let i = numBuckets - 1; i >= 0; i--) {
    const bucketTime = new Date(now.getTime() - i * bucketSizeHours * 60 * 60 * 1000);
    const hour = bucketTime.getHours();
    const day = bucketTime.getDate();
    const month = bucketTime.getMonth() + 1;

    let label;
    if (bucketSizeHours >= 12) {
      // Show date + time for large buckets: "9.2 12:00"
      label = `${day}.${month} ${hour.toString().padStart(2, '0')}:00`;
    } else if (bucketSizeHours >= 4) {
      // Show date + time for medium buckets: "9.2 08:00"
      label = `${day}.${month} ${hour.toString().padStart(2, '0')}:00`;
    } else {
      label = `${hour.toString().padStart(2, '0')}:00`;
    }

    buckets.push({
      hour,
      time: bucketTime.toISOString(),
      label,
      plays: 0,
      tracks: {}, // Track counts per bucket { filename: { count, title, artist } }
    });
  }

  // Fill buckets with play counts and track data
  recentPlays.forEach((play) => {
    const playTime = new Date(play.timestamp);
    const hoursDiff = (now - playTime) / (60 * 60 * 1000);
    const bucketIndex = numBuckets - 1 - Math.floor(hoursDiff / bucketSizeHours);

    if (bucketIndex >= 0 && bucketIndex < buckets.length) {
      buckets[bucketIndex].plays++;

      // Track individual songs in this bucket
      if (!buckets[bucketIndex].tracks[play.filename]) {
        buckets[bucketIndex].tracks[play.filename] = {
          count: 0,
          title: play.title,
          artist: play.artist,
          trackId: play.trackId,
        };
      }
      buckets[bucketIndex].tracks[play.filename].count++;
    }
  });

  // Convert tracks object to sorted array (top 3 per bucket)
  buckets.forEach((bucket) => {
    bucket.topTracks = Object.entries(bucket.tracks)
      .map(([filename, data]) => ({
        filename,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Keep only top 3 tracks per bucket

    // Remove the raw tracks object (we only need topTracks in response)
    delete bucket.tracks;
  });

  return buckets;
}
