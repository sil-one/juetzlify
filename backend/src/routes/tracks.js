import express from 'express';
import { getAllTracks, refreshCache, getTrackById } from '../services/trackService.js';
import { recordPlay } from '../services/playStatisticsService.js';

const router = express.Router();

/**
 * GET /api/tracks?type=public|private
 * Get list of tracks
 */
router.get('/', async (req, res) => {
  try {
    const type = req.query.type || 'public';
    const tracks = await getAllTracks(type);

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
    const tracks = await getAllTracks('all');

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

/**
 * POST /api/tracks/:trackId/play
 * Record a play after 15 seconds
 */
router.post('/:trackId/play', async (req, res) => {
  try {
    const { trackId } = req.params;
    const { visibility, timestamp } = req.body;

    if (!visibility || !['public', 'private'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visibility. Must be "public" or "private"',
      });
    }

    // Get track metadata
    const track = await getTrackById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        error: 'Track not found',
      });
    }

    // Record the play with full metadata and optional timestamp
    const result = await recordPlay(
      trackId,
      track.filename,
      visibility,
      track.title,
      track.artist,
      track.album,
      timestamp // Pass optional timestamp for offline plays
    );

    res.json({
      success: true,
      totalPlays: result.totalPlays,
    });
  } catch (error) {
    console.error('Error recording play:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record play',
    });
  }
});

export default router;
