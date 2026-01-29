const express = require('express');
const router = express.Router();
const {
  initiateEsewaPayment,
  esewaSuccess,
  esewaFailure,
  verifyPayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/esewa/initiate', protect, initiateEsewaPayment);
router.post('/esewa/success', esewaSuccess);
router.get('/esewa/success', esewaSuccess);
router.post('/esewa/failure', esewaFailure);
router.get('/esewa/failure', esewaFailure);
router.get('/verify/:appointmentId', protect, verifyPayment);

module.exports = router;

