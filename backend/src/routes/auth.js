import express from 'express';
import crypto from 'crypto';
import { config } from '../config/config.js';

const router = express.Router();

/**
 * Hash a password using SHA-256
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/auth/private
 * Authenticate for private library access
 */
router.post('/private', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const passwordHash = hashPassword(password);

  if (passwordHash === config.privatePasswordHash) {
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

/**
 * POST /api/auth/admin
 * Authenticate for admin access
 */
router.post('/admin', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const passwordHash = hashPassword(password);

  if (passwordHash === config.adminPasswordHash) {
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
});

export default router;
