import express from 'express';
import { getCarnivalStatistics } from '../services/playStatisticsService.js';
import { isWrappedEnabled } from '../services/settingsService.js';
import { verifyToken } from '../utils/jwt.js';

const router = express.Router();

/**
 * GET /api/wrapped/public
 * Get public carnival statistics (no authentication required)
 */
router.get('/public', async (req, res) => {
  try {
    // Check if public wrapped is enabled
    const enabled = await isWrappedEnabled('public');

    if (!enabled) {
      return res.status(404).json({
        error: 'Public wrapped is not available yet',
        enabled: false
      });
    }

    // Get carnival statistics for public tracks only
    const statistics = await getCarnivalStatistics(false);

    return res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching public wrapped:', error);
    return res.status(500).json({
      error: 'Failed to fetch wrapped statistics'
    });
  }
});

/**
 * GET /api/wrapped/private
 * Get private carnival statistics (requires private authentication)
 */
router.get('/private', async (req, res) => {
  try {
    // Check if private wrapped is enabled
    const enabled = await isWrappedEnabled('private');

    if (!enabled) {
      return res.status(404).json({
        error: 'Private wrapped is not available yet',
        enabled: false
      });
    }

    // Verify JWT token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded || (decoded.role !== 'private' && decoded.role !== 'admin')) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    // Get carnival statistics for all tracks (public + private)
    const statistics = await getCarnivalStatistics(true);

    return res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error fetching private wrapped:', error);
    return res.status(500).json({
      error: 'Failed to fetch wrapped statistics'
    });
  }
});

export default router;
