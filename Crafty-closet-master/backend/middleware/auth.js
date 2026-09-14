// backend/middleware/auth.js
const admin = require('../config/firebase');
const pool  = require('../config/db');

// ── authenticate ─────────────────────────────────────────────────
// Verifies Firebase ID token, then looks up (or auto-creates) the
// MySQL user so req.user is always populated on success.
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const token        = header.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture } = decodedToken;

    // GitHub users with no public email will have no email claim — reject clearly
    if (!email) {
      return res.status(401).json({
        success: false,
        code:    'NO_EMAIL',
        message: 'Account has no email address. Please add one in your provider settings.',
      });
    }

    // Look up user by email
    let [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, avatar FROM users WHERE email = ?',
      [email]
    );

    // Auto-create if the user signed in via Firebase but hasn't hit /sync yet
    if (!rows.length) {
      const displayName = name || email.split('@')[0];
      const avatar      = picture || null;
      const [result] = await pool.query(
        'INSERT INTO users (name, email, avatar, email_verified, is_active) VALUES (?, ?, ?, 1, 1)',
        [displayName, email, avatar]
      );
      rows = [{ id: result.insertId, name: displayName, email, role: 'user', is_active: 1, avatar }];
    }

    const dbUser = rows[0];
    if (!dbUser.is_active) {
      return res.status(401).json({ success: false, message: 'Account deactivated.' });
    }

    req.user        = dbUser;
    req.firebaseUser = decodedToken;
    next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

// ── requireAdmin ─────────────────────────────────────────────────
// Must come AFTER authenticate
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrator access required.' });
  }
  next();
};

// ── optionalAuth ─────────────────────────────────────────────────
// Attach user if token present, continue either way (for public routes)
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token        = header.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Only look up if we actually have an email (GitHub may not provide one)
      if (decodedToken.email) {
        const [rows] = await pool.query(
          'SELECT id, name, email, role FROM users WHERE email = ? AND is_active = 1',
          [decodedToken.email]
        );
        if (rows.length) {
          req.user         = rows[0];
          req.firebaseUser = decodedToken;
        }
      }
    }
  } catch { /* ignore — optional auth never blocks the request */ }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
