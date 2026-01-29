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

router.post('/', protect, authorize('admin'), createProduct);
router.patch('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
