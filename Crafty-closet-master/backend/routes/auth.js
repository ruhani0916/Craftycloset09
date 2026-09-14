// backend/routes/auth.js
const router   = require('express').Router();
const ctrl     = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Firebase sync
router.post('/sync', ctrl.syncUser);

// Standard auth routes (we can keep me for fetching profile)
router.get('/me', authenticate, ctrl.me);

module.exports = router;
