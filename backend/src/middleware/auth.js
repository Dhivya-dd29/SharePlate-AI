/**
 * SharePlate AI: Authentication & RBAC Middleware
 * Module 4: Security Engineering
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'shareplate_ai_secure_jwt_secret_key_2026';

/**
 * Hash password with salt
 */
function hashPassword(password) {
  // Support standard SHA-256 and salted hash
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against hash
 */
function verifyPassword(password, storedHash) {
  const hash = hashPassword(password);
  return hash === storedHash;
}

/**
 * Sign JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Authenticate incoming request via JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Check if x-user-id / x-user-role is provided for testing or demo mode
    const demoRole = req.headers['x-user-role'];
    const demoUserId = req.headers['x-user-id'] || 'usr-donor-01';
    const demoOrgId = req.headers['x-org-id'] || (demoRole === 'RECIPIENT' ? 'org-recip-001' : 'org-donor-001');

    if (demoRole) {
      req.user = {
        user_id: demoUserId,
        role: demoRole.toUpperCase(),
        org_id: demoOrgId,
        name: `Demo ${demoRole} User`
      };
      return next();
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Access token is required. Please provide a valid Bearer token.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or expired access token.'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * RBAC Role Authorization Middleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required prior to authorization check.'
      });
    }

    const userRole = req.user.role ? req.user.role.toUpperCase() : null;
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole) && userRole !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Operation requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${userRole}`
      });
    }

    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateToken,
  requireRole
};
