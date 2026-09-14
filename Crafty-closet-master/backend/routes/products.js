// backend/routes/products.js
const router            = require('express').Router();
const ctrl              = require('../controllers/productController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate          = require('../middleware/validate');
const upload            = require('../middleware/upload');
const cloudinaryUpload  = require('../middleware/cloudinaryUpload');
const v                 = require('../validators');

// Public — no auth needed
router.get('/',           ctrl.getProducts);   // productQuery is [] so no validation runs
router.get('/categories', ctrl.getCategories);
router.get('/:id',        ctrl.getProduct);

// Authenticated users
router.post('/:id/rate', authenticate, v.rateProduct, validate, ctrl.rateProduct);

// Admin only — multer buffers in memory, cloudinaryUpload sends to cloud
router.post('/',
  authenticate, requireAdmin, upload.single('image'), cloudinaryUpload,
  v.createProduct, validate,
  ctrl.createProduct
);
router.put('/:id',
  authenticate, requireAdmin, upload.single('image'), cloudinaryUpload,
  v.updateProduct, validate,
  ctrl.updateProduct
);
router.delete('/:id',
  authenticate, requireAdmin,
  ctrl.deleteProduct
);

module.exports = router;
