// backend/routes/cart.js
const router   = require('express').Router();
const ctrl     = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators');

router.use(authenticate);
router.get('/',      ctrl.getCart);
router.post('/',     v.addToCart,      validate, ctrl.addToCart);
router.put('/:id',   v.updateCartItem, validate, ctrl.updateCartItem);
router.delete('/',   ctrl.clearCart);
router.delete('/:id', ctrl.removeCartItem);

module.exports = router;
