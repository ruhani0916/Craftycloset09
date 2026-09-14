// backend/routes/orders.js
const router   = require('express').Router();
const ctrl     = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators');

router.use(authenticate);

// Admin routes FIRST (before /:id wildcards)
router.get('/',             requireAdmin, ctrl.getAllOrders);
router.put('/:id/status',   requireAdmin, v.updateOrderStatus, validate, ctrl.updateOrderStatus);

// User routes
router.post('/',     v.placeOrder, validate, ctrl.placeOrder);
router.get('/my',    ctrl.getMyOrders);
router.get('/my/:id', ctrl.getMyOrder);

module.exports = router;
