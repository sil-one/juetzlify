import express from 'express';
import { getAllTracks, refreshCache } from '../services/trackService.js';

const router = express.Router();

/**
 * GET /api/tracks?type=public|private
 * Get list of tracks
 */
router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'public';
    const includePrivate = type === 'private';

    const tracks = await getAllTracks(includePrivate);

    res.json({
      success: true,
      tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracks',
    });
  }
});

/**
 * POST /api/tracks/refresh
 * Refresh tracks cache (useful after uploading new files)
 */
router.post('/refresh', async (req, res) => {
  try {
    refreshCache();
    const tracks = await getAllTracks(true);

    res.json({
      success: true,
      message: 'Cache refreshed',
      count: tracks.length,
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
    });
  }
});

export default router;
