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
  availability: {
    days: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.every(d => ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].includes(d)),
        message: 'Invalid availability days'
      }
    },
    startTime: { 
      type: String, 
      default: '09:00', 
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'] 
    },
    endTime:   { 
      type: String, 
      default: '17:00', 
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'] 
    },
    slotDuration: { 
      type: Number, 
      default: 30, 
      min: 15, 
      max: 240, 
      validate: { 
        validator: Number.isInteger, 
        message: 'slotDuration must be an integer' 
      } 
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

// Validate that endTime > startTime
doctorProfileSchema.pre('validate', function(next) {
  if (this.availability && this.availability.startTime && this.availability.endTime) {
    const [startH, startM] = this.availability.startTime.split(':').map(Number);
    const [endH, endM] = this.availability.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (endMinutes <= startMinutes) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

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

