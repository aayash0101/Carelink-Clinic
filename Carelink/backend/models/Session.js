const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: String,
  ipAddress: String,
  userAgent: String,
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0 
});

// Update last activity on access
sessionSchema.methods.updateActivity = async function() {
  this.lastActivity = new Date();
  await this.save();
};

module.exports = mongoose.model('Session', sessionSchema);