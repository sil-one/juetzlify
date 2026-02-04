import express from 'express';
import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../config/config.js';

const router = express.Router();

const BANNER_FILE_PATH = join(config.dataPath, 'banner-version.json');

// Get current banner version
router.get('/version', async (req, res) => {
  try {
    // Try to read banner version file
    let bannerData;
    try {
      const fileContent = await fs.readFile(BANNER_FILE_PATH, 'utf-8');
      bannerData = JSON.parse(fileContent);
    } catch (err) {
      // If file doesn't exist, create it with default version 1
      bannerData = { version: 1, lastUpdated: new Date().toISOString() };
      await fs.mkdir(config.dataPath, { recursive: true });
      await fs.writeFile(BANNER_FILE_PATH, JSON.stringify(bannerData, null, 2));
    }

    res.json({
      success: true,
      version: bannerData.version,
      lastUpdated: bannerData.lastUpdated,
    });
  } catch (error) {
    console.error('Error getting banner version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get banner version',
    });
  }
});

// Update banner version (admin only)
router.post('/version', async (req, res) => {
  try {
    // Check Authorization header first, then body for backwards compatibility
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Verify admin token
    const jwt = await import('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.default.verify(token, config.jwtSecret);
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Read current version
    let bannerData;
    try {
      const fileContent = await fs.readFile(BANNER_FILE_PATH, 'utf-8');
      bannerData = JSON.parse(fileContent);
    } catch (err) {
      bannerData = { version: 0, lastUpdated: new Date().toISOString() };
    }

    // Increment version
    bannerData.version += 1;
    bannerData.lastUpdated = new Date().toISOString();

    // Save updated version
    await fs.mkdir(config.dataPath, { recursive: true });
    await fs.writeFile(BANNER_FILE_PATH, JSON.stringify(bannerData, null, 2));

    res.json({
      success: true,
      version: bannerData.version,
      message: 'Banner version updated. All users will see the welcome banner again.',
    });
  } catch (error) {
    console.error('Error updating banner version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner version',
    });
  }
});

export default router;
