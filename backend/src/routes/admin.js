import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import {
  migrateTracks,
  setTrackVisibility,
  removeTrackVisibility,
  Visibility,
} from '../services/visibilityService.js';
import { getAllTracks } from '../services/trackService.js';
import { deleteAlbumArtCache, clearAllAlbumArtCache } from '../services/albumArtService.js';
import { invalidateAllCaches } from '../services/cacheInvalidationService.js';
import {
  getAllTrackPlayCounts,
  getOverallStatistics,
  getCarnivalStatistics,
  getRecentPlays,
  getHottestTracks,
  getPlaysTimeline,
} from '../services/playStatisticsService.js';
import {
  getWrappedStatus,
  setWrappedEnabled,
  getPodcastAdsStatus,
  setPodcastAdsEnabled,
  getFeaturedShowInterval,
  setFeaturedShowInterval,
} from '../services/settingsService.js';
import { config } from '../config/config.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin authentication to all routes in this router
router.use(requireAdmin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(config.tracksPath, 'all');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, sanitizedName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept MP3 files
    if (file.mimetype === 'audio/mpeg' || file.originalname.toLowerCase().endsWith('.mp3')) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

/**
 * POST /api/admin/upload
 * Upload new MP3 track(s)
 */
router.post('/upload', upload.array('tracks', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const uploadedTracks = [];

    // Set all uploaded tracks to disabled visibility
    for (const file of req.files) {
      await setTrackVisibility(file.filename, Visibility.DISABLED);
      uploadedTracks.push({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
      });
    }

    // Invalidate caches across all workers
    await invalidateAllCaches();

    res.json({
      success: true,
      message: `${uploadedTracks.length} track(s) uploaded successfully`,
      tracks: uploadedTracks,
    });
  } catch (error) {
    console.error('Error uploading tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/refresh
 * Force refresh all metadata and clear album art cache
 */
router.post('/refresh', async (req, res) => {
  try {
    // Clear album art cache so it gets regenerated
    const artResult = await clearAllAlbumArtCache();

    // Invalidate caches across all workers
    await invalidateAllCaches();

    res.json({
      success: true,
      message: 'All caches cleared across all workers. Metadata will be reloaded on next request.',
      albumArtCleared: artResult.deletedCount,
    });
  } catch (error) {
    console.error('Error refreshing metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh metadata',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/migrate
 * Trigger track migration from public/private to all/
 */
router.post('/migrate', async (req, res) => {
  try {
    const result = await migrateTracks();

    // Invalidate caches across all workers
    if (result.success) {
      await invalidateAllCaches();
    }

    res.json(result);
  } catch (error) {
    console.error('Error during migration:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/tracks
 * Get all tracks with visibility info (including disabled)
 */
router.get('/tracks', async (req, res) => {
  try {
    const tracks = await getAllTracks('admin');

    res.json({
      success: true,
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Error fetching admin tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracks',
    });
  }
});

/**
 * PUT /api/admin/tracks/:filename/visibility
 * Update track visibility
 */
router.put('/tracks/:filename/visibility', async (req, res) => {
  try {
    const { filename } = req.params;
    const { visibility } = req.body;

    if (!visibility || !Object.values(Visibility).includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: `Invalid visibility. Must be one of: ${Object.values(Visibility).join(', ')}`,
      });
    }

    const result = await setTrackVisibility(filename, visibility);

    // Invalidate caches across all workers
    await invalidateAllCaches();

    res.json({
      success: true,
      message: `Track visibility updated to ${visibility}`,
      ...result,
    });
  } catch (error) {
    console.error('Error updating track visibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update track visibility',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/tracks/:filename
 * Delete a track completely (file, visibility, album art cache)
 */
router.delete('/tracks/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const decodedFilename = decodeURIComponent(filename);

    // 1. Delete the MP3 file
    const filePath = path.join(config.tracksPath, 'all', decodedFilename);
    try {
      await fs.unlink(filePath);
      console.log(`Deleted track file: ${decodedFilename}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, continue with cleanup
        console.log(`Track file not found (already deleted?): ${decodedFilename}`);
      } else {
        throw error;
      }
    }

    // 2. Remove visibility entry
    await removeTrackVisibility(decodedFilename);

    // 3. Delete album art cache
    await deleteAlbumArtCache(decodedFilename);

    // 4. Invalidate caches across all workers
    await invalidateAllCaches();

    res.json({
      success: true,
      message: `Track "${decodedFilename}" deleted successfully`,
      filename: decodedFilename,
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete track',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/statistics/play-counts
 * Get play counts for all tracks
 */
router.get('/statistics/play-counts', async (req, res) => {
  try {
    const playCounts = await getAllTrackPlayCounts();

    res.json({
      success: true,
      playCounts,
    });
  } catch (error) {
    console.error('Error fetching play counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch play counts',
    });
  }
});

/**
 * GET /api/admin/statistics/overview
 * Get overall statistics
 */
router.get('/statistics/overview', async (req, res) => {
  try {
    const statistics = await getOverallStatistics();

    res.json({
      success: true,
      ...statistics,
    });
  } catch (error) {
    console.error('Error fetching overview statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/admin/statistics/carnival
 * Get carnival statistics (all tracks)
 */
router.get('/statistics/carnival', async (req, res) => {
  try {
    const statistics = await getCarnivalStatistics(true); // Include all tracks

    res.json({
      success: true,
      ...statistics,
    });
  } catch (error) {
    console.error('Error fetching carnival statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carnival statistics',
    });
  }
});

/**
 * GET /api/admin/wrapped/status
 * Get wrapped page enabled status
 */
router.get('/wrapped/status', async (req, res) => {
  try {
    const status = await getWrappedStatus();

    res.json({
      success: true,
      wrappedEnabled: status,
    });
  } catch (error) {
    console.error('Error fetching wrapped status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wrapped status',
    });
  }
});

/**
 * POST /api/admin/wrapped/enable
 * Enable/disable wrapped pages
 */
router.post('/wrapped/enable', async (req, res) => {
  try {
    const { type, enabled } = req.body;

    if (!type || (type !== 'public' && type !== 'private')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "public" or "private"',
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid enabled value. Must be boolean',
      });
    }

    const result = await setWrappedEnabled(type, enabled);

    res.json({
      success: true,
      message: `Wrapped ${type} page ${enabled ? 'enabled' : 'disabled'}`,
      ...result,
    });
  } catch (error) {
    console.error('Error setting wrapped status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set wrapped status',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/podcast-ads/status
 * Get podcast ads enabled status
 */
router.get('/podcast-ads/status', async (req, res) => {
  try {
    const status = await getPodcastAdsStatus();

    res.json({
      success: true,
      podcastAdsEnabled: status,
    });
  } catch (error) {
    console.error('Error fetching podcast ads status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch podcast ads status',
    });
  }
});

/**
 * POST /api/admin/podcast-ads/enable
 * Enable/disable podcast ads
 */
router.post('/podcast-ads/enable', async (req, res) => {
  try {
    const { type, enabled } = req.body;

    if (!type || (type !== 'public' && type !== 'private')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "public" or "private"',
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid enabled value. Must be boolean',
      });
    }

    const result = await setPodcastAdsEnabled(type, enabled);

    res.json({
      success: true,
      message: `Podcast ads ${type} page ${enabled ? 'enabled' : 'disabled'}`,
      ...result,
    });
  } catch (error) {
    console.error('Error setting podcast ads status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set podcast ads status',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/statistics/recent-plays
 * Get recent plays (sorted by timestamp descending)
 */
router.get('/statistics/recent-plays', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const plays = await getRecentPlays(limit);

    res.json({
      success: true,
      plays,
      count: plays.length,
    });
  } catch (error) {
    console.error('Error fetching recent plays:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent plays',
    });
  }
});

/**
 * GET /api/admin/statistics/hottest
 * Get hottest tracks within a time window
 */
router.get('/statistics/hottest', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const tracks = await getHottestTracks(hours);

    res.json({
      success: true,
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Error fetching hottest tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hottest tracks',
    });
  }
});

/**
 * GET /api/admin/statistics/timeline
 * Get plays timeline (hourly buckets)
 */
router.get('/statistics/timeline', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const timeline = await getPlaysTimeline(hours);

    res.json({
      success: true,
      timeline,
      hours,
    });
  } catch (error) {
    console.error('Error fetching plays timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plays timeline',
    });
  }
});

/**
 * GET /api/admin/featured-show-interval
 * Get featured show interval in minutes
 */
router.get('/featured-show-interval', async (req, res) => {
  try {
    const minutes = await getFeaturedShowInterval();

    res.json({
      success: true,
      intervalMinutes: minutes,
    });
  } catch (error) {
    console.error('Error fetching featured show interval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured show interval',
    });
  }
});

/**
 * POST /api/admin/featured-show-interval
 * Set featured show interval in minutes (0 = every reload, max 1440 = 24 hours)
 */
router.post('/featured-show-interval', async (req, res) => {
  try {
    const { minutes } = req.body;

    if (typeof minutes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid minutes value. Must be a number',
      });
    }

    if (minutes < 0 || minutes > 1440) {
      return res.status(400).json({
        success: false,
        error: 'Invalid minutes value. Must be between 0 and 1440',
      });
    }

    const result = await setFeaturedShowInterval(minutes);

    res.json({
      success: true,
      message: `Featured show interval set to ${minutes} minutes`,
      ...result,
    });
  } catch (error) {
    console.error('Error setting featured show interval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set featured show interval',
      message: error.message,
    });
  }
});

export default router;
