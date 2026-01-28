const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  // optional aliases if you use /api/services
  getServices,
  getService,
} = ctrl;

console.log('PRODUCT CTRL exports:', Object.keys(ctrl));

// Public
router.get('/', getProducts);
router.get('/:id', getProduct);

// Optional: if you expose /api/services somewhere else, ignore
// router.get('/services', getServices);
// router.get('/services/:id', getService);

// Admin (NO upload middleware)
router.post('/', protect, authorize('admin'), createProduct);
router.patch('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
