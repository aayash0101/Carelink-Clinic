// backend/controllers/doctorController.js
const DoctorProfile = require("../models/DoctorProfile");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get doctors (optionally filtered by department/category)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    // frontend currently sends ?category=<id>
    // existing backend used ?department=<id>
    const department = req.query.department || req.query.category;

    const query = { isActive: true };

    if (department) {
      if (!isValidObjectId(department)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department/category ID",
        });
      }
      // DoctorProfile uses departmentId
      query.departmentId = department;
    }

    const doctorProfiles = await DoctorProfile.find(query)
      .populate("userId", "name email")
      .populate("departmentId", "name slug")
      .select("-__v")
      .lean();

    // Filter out broken profiles safely (prevents _id crash)
    const doctors = doctorProfiles
      .filter((p) => p.userId && p.departmentId)
      .map((p) => ({
        _id: p.userId._id,
        name: p.userId.name,
        email: p.userId.email,
        department: {
          _id: p.departmentId._id,
          name: p.departmentId.name,
          slug: p.departmentId.slug,
        },
        qualifications: p.qualifications || "",
        experienceYears: p.experienceYears || 0,
        consultationFee: p.consultationFee || 0,
        availability: p.availability || null,
      }));

    return res.status(200).json({
      success: true,
      data: { doctors },
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single doctor details
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    }

    // Here, :id is a USER id because you return _id: profile.userId._id
    const profile = await DoctorProfile.findOne({ userId: id, isActive: true })
      .populate("userId", "name email")
      .populate("departmentId", "name slug")
      .select("-__v")
      .lean();

    if (!profile || !profile.userId || !profile.departmentId) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctor: {
          _id: profile.userId._id,
          name: profile.userId.name,
          email: profile.userId.email,
          department: {
            _id: profile.departmentId._id,
            name: profile.departmentId.name,
            slug: profile.departmentId.slug,
          },
          qualifications: profile.qualifications || "",
          experienceYears: profile.experienceYears || 0,
          consultationFee: profile.consultationFee || 0,
          availability: profile.availability || null,
        },
      },
    });
  } catch (error) {
    console.error("Get doctor error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/:userId/availability
// @access  Private (admin)
exports.updateDoctorAvailability = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days, startTime, endTime, slotDuration } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    // Validate days
    if (!Array.isArray(days) || !days.every(d => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].includes(d))) {
      return res.status(400).json({ success: false, message: 'Invalid days array' });
    }

    // Validate times
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:mm' });
    }

    // Validate slotDuration
    if (!Number.isInteger(slotDuration) || slotDuration < 15 || slotDuration > 240) {
      return res.status(400).json({ success: false, message: 'Slot duration must be integer between 15-240 minutes' });
    }

    const doctorProfile = await DoctorProfile.findOne({ userId, isActive: true });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Update availability
    doctorProfile.availability = {
      days,
      startTime,
      endTime,
      slotDuration
    };

    await doctorProfile.save();

    return res.status(200).json({
      success: true,
      data: { doctor: { _id: doctorProfile.userId, availability: doctorProfile.availability } }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
}
