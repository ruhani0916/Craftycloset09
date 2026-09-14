// backend/validators/index.js
const { body, param } = require('express-validator');

// ── Auth ───────────────────────────────────────────────────────
exports.register = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.login = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.forgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

exports.resetPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// ── Products ───────────────────────────────────────────────────
exports.createProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 250 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['earrings','necklaces','rings','bracelets','anklets','hairclips','bangles','sets'])
    .withMessage('Invalid category'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  body('description').optional().isLength({ max: 5000 }),
  body('compare_price').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
];

exports.updateProduct = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 250 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
];

// NOTE: productQuery is intentionally empty — the controller handles all defaults.
// Do NOT add query validators here — they caused the "Validation failed" bug.
exports.productQuery = [];

// ── Cart ───────────────────────────────────────────────────────
exports.addToCart = [
  body('product_id').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
];

exports.updateCartItem = [
  param('id').isInt({ min: 1 }).withMessage('Invalid cart item ID'),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99'),
];

// ── Orders ─────────────────────────────────────────────────────
exports.placeOrder = [
  body('shipping_name').trim().notEmpty().withMessage('Full name is required'),
  body('shipping_phone').trim().notEmpty().withMessage('Phone number is required'),
  body('shipping_address').trim().notEmpty().withMessage('Delivery address is required'),
  body('payment_method').optional().isIn(['cod','upi','card']),
];

exports.updateOrderStatus = [
  param('id').isInt({ min: 1 }).withMessage('Invalid order ID'),
  body('status')
    .isIn(['pending','processing','shipped','delivered','cancelled'])
    .withMessage('Invalid status value'),
];

// ── Ratings ────────────────────────────────────────────────────
exports.rateProduct = [
  param('id').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('stars').isInt({ min: 1, max: 5 }).withMessage('Stars must be between 1 and 5'),
  body('review').optional().isLength({ max: 1000 }),
];
