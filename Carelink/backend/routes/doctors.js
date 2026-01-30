const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  updateDoctorAvailability,
} = require('../controllers/doctorController');
const auth = require('../middleware/auth');
const csrf = require('../middleware/csrf');

// Public routes
router.get('/', getDoctors);
router.get('/:id', getDoctor);

// Protected routes (admin only)
router.put('/:userId/availability', auth.protect, auth.authorize('admin'), csrf.verifyToken, updateDoctorAvailability);

module.exports = router;

