import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware to require admin authentication
 * Checks for valid JWT token in Authorization header or request body
 */
export function requireAdmin(req, res, next) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fall back to token in request body (for backwards compatibility)
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  if (decoded.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  // Attach decoded token to request for downstream use
  req.user = decoded;
  next();
}

/**
 * Middleware to require private or admin authentication
 */
export function requirePrivateOrAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  if (decoded.role !== 'admin' && decoded.role !== 'private') {
    return res.status(403).json({
      success: false,
      error: 'Private or admin access required',
    });
  }

  req.user = decoded;
  next();
}
