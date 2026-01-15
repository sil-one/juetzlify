import express from 'express';
import fs from 'fs';
import path from 'path';
import { getTrackById } from '../services/trackService.js';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * GET /api/stream/:trackId
 * Stream MP3 file with byte-range support
 */
router.get('/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;

    // Get track metadata
    const track = await getTrackById(trackId);

    if (!track) {
      return res.status(404).json({
        success: false,
        error: 'Track not found',
      });
    }

    // Determine file path
    const subdir = track.isPublic ? 'public' : 'private';
    const filePath = path.join(config.tracksPath, subdir, track.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Track file not found',
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Support byte-range requests for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });

      file.pipe(res);
    } else {
      // Stream entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream track',
    });
  }
});

export default router;
