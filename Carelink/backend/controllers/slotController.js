const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/slots?doctorId=<USER_ID>&date=YYYY-MM-DD
// @access  Public
// Note: doctorId is a User._id, not DoctorProfile._id
// Test: curl.exe -i "http://localhost:5000/api/slots?doctorId=507f1f77bcf86cd799439001&date=2026-01-30"
// Must always return HTTP 200 JSON (with or without slots), never 500.
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    // Validate required parameters
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' });
    }

    // Validate doctorId is a valid ObjectId
    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID format' });
    }

    // Validate date format (YYYY-MM-DD) and parse
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Parse and validate the date
    const selectedDate = new Date(`${date}T00:00:00`);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    // Find doctor profile by userId (doctorId is a User._id)
    const doctorProfile = await DoctorProfile.findOne({ 
      userId: doctorId, 
      isActive: true 
    }).lean();

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found or inactive' });
    }

    // Defensive: Check if availability is configured
    if (!doctorProfile.availability || !Array.isArray(doctorProfile.availability.days) || doctorProfile.availability.days.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          slots: [],
          message: 'Doctor availability not configured',
          doctor: { availability: doctorProfile.availability || {} }
        }
      });
    }

    // Get day of week using toLocaleDateString (fixed weekday bug)
    const dayOfWeekFull = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Verify the day is valid and doctor is available
    const availableDays = doctorProfile.availability.days || [];
    if (!availableDays.includes(dayOfWeekFull)) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          slots: [], 
          message: 'Doctor not available on this day',
          doctor: { availability: doctorProfile.availability }
        } 
      });
    }

    // Parse start and end times with defensive validation
    const startTimeStr = doctorProfile.availability.startTime || '09:00';
    const endTimeStr = doctorProfile.availability.endTime || '17:00';
    const slotDuration = doctorProfile.availability.slotDuration || 30;

    // Validate time format HH:mm
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTimeStr) || !timeRegex.test(endTimeStr)) {
      return res.status(200).json({
        success: true,
        data: {
          slots: [],
          message: 'Doctor schedule malformed',
          doctor: { availability: doctorProfile.availability }
        }
      });
    }

    // Validate slotDuration is an integer and within bounds
    if (!Number.isInteger(slotDuration) || slotDuration < 10 || slotDuration > 240) {
      return res.status(200).json({
        success: true,
        data: {
          slots: [],
          message: 'Doctor schedule malformed',
          doctor: { availability: doctorProfile.availability }
        }
      });
    }

    // Parse times and ensure endTime > startTime
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    if (endTotalMinutes <= startTotalMinutes) {
      return res.status(200).json({
        success: true,
        data: {
          slots: [],
          message: 'Doctor schedule malformed',
          doctor: { availability: doctorProfile.availability }
        }
      });
    }

    // Generate all possible slots for the day (local time, no timezone drift)
    const slots = [];
    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    let currentSlotStart = new Date(startTime);
    while (currentSlotStart < endTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60000);
      if (currentSlotEnd <= endTime) {
        slots.push({
          start: currentSlotStart.toISOString(),
          end: currentSlotEnd.toISOString(),
          duration: slotDuration
        });
      }
      currentSlotStart = currentSlotEnd;
    }

    // If no slots generated, return empty (e.g., slot duration too long for working hours)
    if (slots.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          slots: [],
          message: 'No available slots for this day',
          doctor: { availability: doctorProfile.availability }
        }
      });
    }

    // Query booked appointments for this doctor on this date (using scheduledAt between startOfDay and endOfDay)
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId,  // doctorId is User._id, not DoctorProfile._id
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending_payment', 'booked', 'confirmed'] }
    }).select('scheduledAt durationMinutes').lean();

    // Filter out slots that overlap with booked appointments
    const availableSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      
      return !bookedAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + (apt.durationMinutes || 30) * 60000);
        
        // Robust overlap check: slotStart < aptEnd AND slotEnd > aptStart
        return slotStart < aptEnd && slotEnd > aptStart;
      });
    });

    // Format slots for frontend response with displayTime in 12h format
    const formattedSlots = availableSlots.map(slot => ({
      start: slot.start,
      end: slot.end,
      duration: slot.duration,
      displayTime: new Date(slot.start).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }));

    return res.status(200).json({
      success: true,
      data: {
        slots: formattedSlots,
        doctor: {
          availability: doctorProfile.availability
        }
      }
    });
  } catch (error) {
    console.error('Get slots error:', error);
    return res.status(200).json({
      success: true,
      data: {
        slots: [],
        message: 'Error retrieving slots',
        doctor: {}
      }
    });
  }
};

