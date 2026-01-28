const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-delete expired tokens
blacklistedTokenSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0 
});

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);