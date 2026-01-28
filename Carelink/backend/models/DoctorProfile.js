const mongoose = require('mongoose');
const { monitorQuery } = require('../utils/queryMonitor');

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reusing Category model as Department
    required: [true, 'Department is required'],
    index: true
  },
  qualifications: {
    type: String,
    required: [true, 'Qualifications are required'],
    trim: true,
    maxlength: [500, 'Qualifications too long'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9\s\-_.,'&()]+$/.test(v);
      },
      message: 'Qualifications contain invalid characters'
    }
  },
  experienceYears: {
    type: Number,
    required: [true, 'Experience years are required'],
    min: [0, 'Experience cannot be negative'],
    max: [100, 'Experience years too high'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Experience must be a whole number'
    }
  },
  consultationFee: {
    type: Number,
    min: [0, 'Consultation fee cannot be negative'],
    max: [100000, 'Consultation fee too high'],
    validate: {
      validator: function(v) {
        return !v || Number.isFinite(v);
      },
      message: 'Invalid consultation fee'
    }
  },
  availability: {
    // Simple availability config: days of week and time slots
    days: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    startTime: {
      type: String,
      default: '09:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format (HH:MM)'
      }
    },
    endTime: {
      type: String,
      default: '17:00',
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format (HH:MM)'
      }
    },
    slotDuration: {
      type: Number,
      default: 30,
      min: [15, 'Slot duration must be at least 15 minutes'],
      max: [120, 'Slot duration cannot exceed 120 minutes']
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  strict: 'throw'
});

// Indexes
doctorProfileSchema.index({ departmentId: 1, isActive: 1 });
doctorProfileSchema.index({ userId: 1 });

// Pre-save validation
doctorProfileSchema.pre('save', function(next) {
  if (this.consultationFee) {
    this.consultationFee = Math.round(this.consultationFee * 100) / 100;
  }
  next();
});

doctorProfileSchema.pre('find', function() {
  monitorQuery('DoctorProfile', 'find', this.getQuery());
});

doctorProfileSchema.pre('findOne', function() {
  monitorQuery('DoctorProfile', 'findOne', this.getQuery());
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);

