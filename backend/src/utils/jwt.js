import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

const ONE_WEEK_IN_SECONDS = 604800; // 7 days * 24 hours * 60 minutes * 60 seconds

/**
 * Generate a JWT token for a user role
 * @param {'admin' | 'private'} role - The user's role
 * @returns {string} JWT token valid for 1 week
 */
export function generateToken(role) {
  if (!['admin', 'private'].includes(role)) {
    throw new Error('Invalid role. Must be "admin" or "private"');
  }

  const payload = {
    role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: ONE_WEEK_IN_SECONDS,
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {{ role: string, iat: number, exp: number } | null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}
