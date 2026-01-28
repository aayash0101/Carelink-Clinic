const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Product = require('../models/Product'); // Service model
const Category = require('../models/Category'); // Department model
const User = require('../models/User');
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeInput = (str, limit) => str ? str.toString().replace(/[<>]/g, '').substring(0, limit) : '';

// @desc    Create appointment (pending_payment)
// @route   POST /api/appointments
// @access  Protected (patient)
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, serviceId, scheduledAt, durationMinutes } = req.body;

    if (!doctorId || !serviceId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!isValidObjectId(doctorId) || !isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // Verify doctor exists and is active
    const doctorProfile = await DoctorProfile.findOne({ 
      userId: doctorId, 
      isActive: true 
    }).populate('departmentId');

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found or inactive' });
    }

    // Verify service exists
    const service = await Product.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Verify scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Scheduled time must be in the future' });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      scheduledAt: scheduledDate,
      status: { $in: ['booked', 'confirmed', 'pending_payment'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' });
    }

    // Calculate consultation fee (use doctor override if available, else service price)
    const consultationFee = doctorProfile.consultationFee || service.price;
    const duration = durationMinutes || 30;

    // Create appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      departmentId: doctorProfile.departmentId._id,
      serviceId,
      scheduledAt: scheduledDate,
      durationMinutes: duration,
      consultationFee,
      status: 'pending_payment',
      paymentStatus: 'unpaid'
    });

    logSecurityEvent('APPOINTMENT_CREATED', {
      appointmentId: appointment._id,
      patientId: req.user._id,
      doctorId,
      ip: req.ip
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name price');

    res.status(201).json({ success: true, data: { appointment: populatedAppointment } });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

// @desc    Get patient's appointments
// @route   GET /api/appointments/me
// @access  Protected (patient)
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name email')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name price images')
      .sort('-scheduledAt')
      .lean();

    res.status(200).json({ success: true, data: { appointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Protected (doctor)
// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor
// @access  Protected (doctor/admin)
exports.getDoctorAppointments = async (req, res) => {
  try {
    // ✅ allow doctor OR admin
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // doctor sees their own; admin can optionally pass ?doctorId=...
    const doctorId = req.user.role === 'admin' && req.query.doctorId
      ? req.query.doctorId
      : req.user._id;

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email phone')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name price')
      .sort('-scheduledAt')
      .lean();

    res.status(200).json({ success: true, data: { appointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Protected (doctor/admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const validStatuses = ['booked', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // ✅ doctor can only update their own appointments
    if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      logSecurityEvent('UNAUTHORIZED_APPOINTMENT_UPDATE', {
        userId: req.user._id,
        appointmentId: id,
        ip: req.ip
      });
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const oldStatus = appointment.status; // ✅ keep before update

    appointment.status = status;
    if (notes && (req.user.role === 'doctor' || req.user.role === 'admin')) {
      appointment.notes = sanitizeInput(notes, 1000);
    }

    if (status === 'completed') {
      appointment.completedAt = new Date();
    }
    if (status === 'cancelled') {
      appointment.cancelledAt = new Date();
    }

    await appointment.save();

    logSecurityEvent('APPOINTMENT_STATUS_UPDATED', {
      appointmentId: id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user._id,
      ip: req.ip
    });

    const updatedAppointment = await Appointment.findById(id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name price');

    res.status(200).json({ success: true, data: { appointment: updatedAppointment } });
  } catch (error) {
    console.error('Appointment update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Protected
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email')
      .populate('departmentId', 'name')
      .populate('serviceId', 'name price images description');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Authorization: patient can see their own, doctor can see their own, admin can see all
    const isOwner = appointment.patientId._id.toString() === req.user._id.toString() ||
                    appointment.doctorId._id.toString() === req.user._id.toString();
    
    if (!isOwner && req.user.role !== 'admin') {
      logSecurityEvent('UNAUTHORIZED_APPOINTMENT_ACCESS', {
        userId: req.user._id,
        appointmentId: id,
        ip: req.ip
      });
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: { appointment } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

