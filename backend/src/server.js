import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/config.js';
import tracksRouter from './routes/tracks.js';
import streamRouter from './routes/stream.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import wrappedRouter from './routes/wrapped.js';
import bannerRouter from './routes/banner.js';
import { getAllTracks } from './services/trackService.js';
import { initializeBatchWriter } from './services/playStatisticsService.js';
import { initializeCacheInvalidation } from './services/cacheInvalidationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/wrapped', wrappedRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/stream', streamRouter);

// Serve cached album art
app.use('/api/album-art', express.static(config.cachePath, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files (production)
if (config.nodeEnv === 'production') {
  app.use(express.static(config.frontendDistPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.frontendDistPath, 'index.html'));
  });
}

// Start server and load tracks
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n🎵 Jützlify server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Tracks path: ${config.tracksPath}`);
  console.log(`Cache path: ${config.cachePath}\n`);

  // Initialize cache invalidation watcher (for PM2 cluster sync)
  await initializeCacheInvalidation();

  // Initialize batch writer for statistics (1s interval for PM2 cluster sync)
  initializeBatchWriter(1000);

  // Preload tracks on startup
  console.log('Loading tracks...');
  try {
    const tracks = await getAllTracks('public');
    console.log(`✓ Successfully loaded ${tracks.length} tracks\n`);
  } catch (error) {
    console.error('✗ Error loading tracks:', error.message);
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
