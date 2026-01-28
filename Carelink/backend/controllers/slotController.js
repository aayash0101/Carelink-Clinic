const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get available time slots for a doctor on a specific date
// @route   GET /api/slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' });
    }

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ 
      userId: doctorId, 
      isActive: true 
    });

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Parse the date
    const selectedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Check if doctor is available on this day
    if (!doctorProfile.availability.days.includes(dayOfWeek)) {
      return res.status(200).json({ 
        success: true, 
        data: { slots: [], message: 'Doctor not available on this day' } 
      });
    }

    // Parse start and end times
    const [startHour, startMinute] = doctorProfile.availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = doctorProfile.availability.endTime.split(':').map(Number);
    const slotDuration = doctorProfile.availability.slotDuration || 30;

    // Generate all possible slots for the day
    const slots = [];
    const startTime = new Date(selectedDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    let currentSlot = new Date(startTime);
    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
      if (slotEnd <= endTime) {
        slots.push({
          start: currentSlot.toISOString(),
          end: slotEnd.toISOString(),
          duration: slotDuration
        });
      }
      currentSlot = slotEnd;
    }

    // Get booked appointments for this doctor on this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['pending_payment', 'booked', 'confirmed'] }
    }).select('scheduledAt durationMinutes').lean();

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
      const slotStart = new Date(slot.start);
      return !bookedAppointments.some(apt => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60000);
        // Check if slots overlap
        return (slotStart >= aptStart && slotStart < aptEnd) ||
               (slotStart < aptStart && new Date(slot.end) > aptStart);
      });
    });

    // Format slots for frontend
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

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

