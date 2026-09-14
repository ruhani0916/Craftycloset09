// backend/controllers/authController.js
const pool  = require('../config/db');
const admin = require('../config/firebase');

const safeUser = (u) => ({
  id:     u.id,
  name:   u.name,
  email:  u.email,
  role:   u.role,
  avatar: u.avatar || null,
});

// ── POST /api/auth/sync ─────────────────────────────────────────
exports.syncUser = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token        = header.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    // GitHub users with a private/no email will not have decodedToken.email.
    // We must reject early with a clear actionable message rather than crashing.
    const email = decodedToken.email || null;
    if (!email) {
      return res.status(400).json({
        success: false,
        code:    'NO_EMAIL',
        message: 'No email address is associated with this account. ' +
                 'Please add and verify a public email in your GitHub settings, then sign in again.',
      });
    }

    const name   = decodedToken.name   || email.split('@')[0];
    const avatar = decodedToken.picture || null;

    let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (!rows.length) {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, avatar, email_verified, is_active) VALUES (?, ?, ?, 1, 1)',
        [name, email, avatar]
      );
      user = { id: result.insertId, name, email, avatar, role: 'user' };
    } else {
      user = rows[0];
      if (!user.is_active) {
        return res.status(401).json({ success: false, message: 'Account deactivated.' });
      }
      // Keep avatar in sync with the provider's latest picture
      if (avatar && user.avatar !== avatar) {
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id]);
        user.avatar = avatar;
      }
    }

    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────
exports.me = (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
};
