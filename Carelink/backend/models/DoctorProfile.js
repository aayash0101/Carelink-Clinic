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
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative'],
    max: [100000, 'Consultation fee too high'],
    validate: {
      validator: function(v) {
        return !v || Number.isFinite(v);
      },
      message: 'Invalid consultation fee'
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

