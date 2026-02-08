import express from 'express';
import {
  getPodcastAdsStatus,
  getFeaturedShowInterval,
} from '../services/settingsService.js';

const router = express.Router();

/**
 * GET /api/settings/podcast-ads
 * Get podcast ads enabled status (public endpoint)
 */
router.get('/podcast-ads', async (req, res) => {
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
 * GET /api/settings/featured-show-interval
 * Get featured show interval in minutes (public endpoint)
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

export default router;
