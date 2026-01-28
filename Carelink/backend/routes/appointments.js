const express = require('express');
const router = express.Router();

const {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  getAppointment
} = require('../controllers/appointmentController');

const { protect, authorize } = require('../middleware/auth');

// Patient routes
router.post('/', protect, createAppointment);
router.get('/me', protect, getMyAppointments);

// Doctor/Admin routes (must come BEFORE "/:id")
router.get('/doctor', protect, authorize('doctor', 'admin'), getDoctorAppointments);
router.patch('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);

// Single appointment (must be LAST)
router.get('/:id', protect, getAppointment);

module.exports = router;
