import express from 'express';
import {
  getPodcastAdsStatus,
  getFeaturedShowInterval,
  getWrappedStatus,
  getSunsetMode,
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

/**
 * GET /api/settings/wrapped-status
 * Get wrapped page enabled status (public endpoint)
 */
router.get('/wrapped-status', async (req, res) => {
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
 * GET /api/settings/sunset-mode
 * Get sunset mode status (public endpoint - only exposes enabled/applied, not admin controls)
 */
router.get('/sunset-mode', async (req, res) => {
  try {
    const sunsetMode = await getSunsetMode();
    res.json({
      success: true,
      enabled: sunsetMode.enabled,
      applied: sunsetMode.applied,
    });
  } catch (error) {
    console.error('Error fetching sunset mode:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sunset mode' });
  }
});

export default router;
