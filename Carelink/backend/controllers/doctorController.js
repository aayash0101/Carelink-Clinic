const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Category = require('../models/Category'); // Department model
const mongoose = require('mongoose');
const { logSecurityEvent } = require('../utils/logger');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get doctors (optionally filtered by department)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  try {
    const { department } = req.query;
    
    const query = { isActive: true };
    
    if (department) {
      if (!isValidObjectId(department)) {
        return res.status(400).json({ success: false, message: 'Invalid department ID' });
      }
      query.departmentId = department;
    }

    const doctorProfiles = await DoctorProfile.find(query)
      .populate('userId', 'name email')
      .populate('departmentId', 'name slug')
      .select('-__v')
      .lean();

    // Format response
    const doctors = doctorProfiles.map(profile => ({
      _id: profile.userId._id,
      name: profile.userId.name,
      email: profile.userId.email,
      department: {
        _id: profile.departmentId._id,
        name: profile.departmentId.name
      },
      qualifications: profile.qualifications,
      experienceYears: profile.experienceYears,
      consultationFee: profile.consultationFee,
      availability: profile.availability
    }));

    res.status(200).json({
      success: true,
      data: { doctors }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single doctor details
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const doctorProfile = await DoctorProfile.findOne({ 
      userId: id, 
      isActive: true 
    })
      .populate('userId', 'name email')
      .populate('departmentId', 'name slug')
      .lean();

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const doctor = {
      _id: doctorProfile.userId._id,
      name: doctorProfile.userId.name,
      email: doctorProfile.userId.email,
      department: {
        _id: doctorProfile.departmentId._id,
        name: doctorProfile.departmentId.name
      },
      qualifications: doctorProfile.qualifications,
      experienceYears: doctorProfile.experienceYears,
      consultationFee: doctorProfile.consultationFee,
      availability: doctorProfile.availability
    };

    res.status(200).json({ success: true, data: { doctor } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

