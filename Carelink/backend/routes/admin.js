const express = require('express');
const router = express.Router();
const {
  getDashboard,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getUsers,
  getOrders,
  updateOrder,
  createCoupon,
  updateCoupon,
  getCoupons,
  deleteCoupon
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Users
router.get('/users', getUsers);

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrder);
// router.put('/orders/:id', updateOrder);


router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.put('/coupons/:id', updateCoupon);

module.exports = router;

