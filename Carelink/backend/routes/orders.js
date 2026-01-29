console.log("ORDERS ROUTE LOADED");
console.log("ordersController exports:", Object.keys(require("../controllers/orderController")));
console.log("auth exports:", Object.keys(require("../middleware/auth")));

const express = require('express');
const router = express.Router();
const {
  prepareOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  verifyCoupon
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { dynamicRateLimiter } = require('../middleware/advancedSecurity');

router.post('/prepare', protect, dynamicRateLimiter, prepareOrder); // Step 1: Create pending order
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/verify-coupon', protect, verifyCoupon);

module.exports = router;

