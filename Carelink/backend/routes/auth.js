// backend/routes/auth.js
const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyEmail,
  validatePassword,
  getActiveSessions,
  logoutAllSessions
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { dynamicRateLimiter } = require('../middleware/advancedSecurity');

const isProd = process.env.NODE_ENV === 'production';

// disable rate limit in dev to stop 429 spam
const limiter = isProd ? dynamicRateLimiter : (req, res, next) => next();

// Public
router.post('/register', limiter, register);
router.post('/login', limiter, login);
router.get('/verify-email', verifyEmail);

router.post('/forgot-password', limiter, forgotPassword);
router.post('/verify-otp', limiter, verifyOTP);
router.post('/reset-password', limiter, resetPassword);
router.post('/validate-password', limiter, validatePassword);

// Protected
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/sessions', protect, getActiveSessions);
router.post('/logout-all', protect, logoutAllSessions);

module.exports = router;
