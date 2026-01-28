const mongoose = require('mongoose');
const { monitorQuery } = require('../utils/queryMonitor');

function generateAppointmentNumber() {
  return `APT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateAppointmentNumber,
      validate: {
        validator: function (v) {
          return /^APT-\d{13}-\d{4}$/.test(v);
        },
        message: 'Invalid appointment number format'
      }
    },

    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },

    scheduledAt: {
      type: Date,
      required: true,
      index: true
      // ✅ I recommend removing the "must be future" validator here,
      // because old appointments (completed) will be in the past and saving updates can fail.
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 240,
      default: 30,
      validate: {
        validator: Number.isInteger,
        message: 'Duration must be a whole number'
      }
    },

    status: {
      type: String,
      enum: ['pending_payment', 'booked', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending_payment',
      index: true
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
      index: true
    },

    notes: { type: String, maxlength: 1000, trim: true },

    paymentResult: {
      transactionId: { type: String, index: true, maxlength: 200 },
      paymentId: { type: String, maxlength: 200 },
      status: { type: String, maxlength: 50 },
      amount: { type: Number, min: 0 },
      paidAt: { type: Date }
    },

    consultationFee: { type: Number, required: true, min: 0, max: 100000 },

    cancelledAt: { type: Date },
    cancelledReason: { type: String, maxlength: 200 },
    completedAt: { type: Date }
  },
  { timestamps: true, strict: 'throw' }
);

// Indexes
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
appointmentSchema.index({ departmentId: 1, scheduledAt: 1 });
appointmentSchema.index({ status: 1, paymentStatus: 1 });
appointmentSchema.index({ scheduledAt: 1, status: 1 });
appointmentSchema.index({ 'paymentResult.transactionId': 1 });

appointmentSchema.pre('save', function (next) {
  if (typeof this.consultationFee === 'number') {
    this.consultationFee = Math.round(this.consultationFee * 100) / 100;
  }
  next();
});

appointmentSchema.pre('find', function () {
  monitorQuery('Appointment', 'find', this.getQuery());
});

appointmentSchema.pre('findOne', function () {
  monitorQuery('Appointment', 'findOne', this.getQuery());
});

module.exports = mongoose.model('Appointment', appointmentSchema);
