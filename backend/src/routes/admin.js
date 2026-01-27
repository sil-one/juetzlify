import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import {
  migrateTracks,
  setTrackVisibility,
  Visibility,
} from '../services/visibilityService.js';
import { getAllTracks, refreshCache } from '../services/trackService.js';
import { clearVisibilityCache } from '../services/visibilityService.js';
import {
  getAllTrackPlayCounts,
  getOverallStatistics,
  getCarnivalStatistics,
} from '../services/playStatisticsService.js';
import {
  getWrappedStatus,
  setWrappedEnabled,
  getPodcastAdsStatus,
  setPodcastAdsEnabled,
} from '../services/settingsService.js';
import { config } from '../config/config.js';

const router = express.Router();

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

    // Clear caches to reload with new tracks
    clearVisibilityCache();
    refreshCache();

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
 * POST /api/admin/migrate
 * Trigger track migration from public/private to all/
 */
router.post('/migrate', async (req, res) => {
  try {
    const result = await migrateTracks();

    // Clear caches to reload with new structure
    if (result.success) {
      clearVisibilityCache();
      refreshCache();
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

    // Clear caches to reload with new visibility
    clearVisibilityCache();
    refreshCache();

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

export default router;
