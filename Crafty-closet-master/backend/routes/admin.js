// backend/routes/admin.js
const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Every admin route requires JWT + admin role
router.use(authenticate, requireAdmin);

router.get('/stats',              ctrl.getStats);
router.get('/users',              ctrl.getUsers);
router.patch('/users/:id/toggle', ctrl.toggleUserStatus);
router.patch('/users/:id/role',   ctrl.updateUserRole);

module.exports = router;
