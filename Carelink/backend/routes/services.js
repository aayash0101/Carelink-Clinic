const express = require('express');
const router = express.Router();
const {
  getServices,
  getService
} = require('../controllers/productController');

// Public routes - returns services (using Product model)
router.get('/', getServices);
router.get('/:id', getService);

module.exports = router;

