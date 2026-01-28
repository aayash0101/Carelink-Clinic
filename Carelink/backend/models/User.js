const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('../utils/encryption');
const { monitorQuery } = require('../utils/queryMonitor');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: 2,
    maxlength: 50,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s]+$/.test(v);
      },
      message: 'Name contains invalid characters'
    }
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  // 🔧 FIX: Store encrypted phone, decrypt on query
phone: {
  type: String,
  set: function(val) {
    if (!val) return val;
    
    // ✅ BETTER: Check for exact encryption format (16-char hex IV : 16-char hex tag : encrypted data)
    const encryptionPattern = /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i;
    
    if (encryptionPattern.test(val)) {
      // Already encrypted
      return val;
    }
    
    return encrypt(val);
  }
},
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Security fields
  loginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: Date,
  
  // Password management
  passwordHistory: [{
    password: { type: String },
    changedAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: Date,
  passwordExpiresAt: Date,
  
  // Email verification
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // 2FA
  twoFactorEnabled: { 
    type: Boolean, 
    default: false 
  },
  twoFactorSecret: { 
    type: String, 
    select: false 
  },
  twoFactorBackupCodes: { 
    type: [String], 
    select: false 
  },
  
  // 🔧 FIX: Session management with proper structure
  activeSessions: [{
    sessionId: String,
    token: String,
    deviceInfo: String,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  maxSessions: { 
    type: Number, 
    default: 3 
  },
  lastLogin: Date,
  lastLoginIP: String
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      // 🔧 FIX: Decrypt phone when converting to JSON
      if (ret.phone) {
        try {
          ret.phone = decrypt(ret.phone);
        } catch (e) {
          ret.phone = null;
        }
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    transform: function(doc, ret) {
      // 🔧 FIX: Decrypt phone when converting to object
      if (ret.phone) {
        try {
          ret.phone = decrypt(ret.phone);
        } catch (e) {
          ret.phone = null;
        }
      }
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook: Hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    // Save old password to history
    if (!this.isNew) {
      const oldUser = await this.constructor.findById(this._id).select('+password');
      if (oldUser && oldUser.password) {
        this.passwordHistory.push({
          password: oldUser.password,
          changedAt: Date.now()
        });

        // Keep only last 10
        if (this.passwordHistory.length > 10) {
          this.passwordHistory.shift();
        }
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // Set expiry (60 days)
    this.passwordChangedAt = Date.now();
    this.passwordExpiresAt = Date.now() + 60 * 24 * 60 * 60 * 1000;

    next();
  } catch (error) {
    next(error);
  }
});

// Method: Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method: Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const newAttempts = this.loginAttempts + 1;
  
  if (newAttempts >= 5 && newAttempts < 10) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 };
  } else if (newAttempts >= 10 && newAttempts < 15) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 };
  } else if (newAttempts >= 15) {
    updates.$set = { lockUntil: Date.now() + 24 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Method: Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

userSchema.pre('find', function() {
  monitorQuery('User', 'find', this.getQuery());
});

userSchema.pre('findOne', function() {
  monitorQuery('User', 'findOne', this.getQuery());
});

// Method: Check if password is in history
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  for (const historyItem of this.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, historyItem.password);
    if (isMatch) return true;
  }
  return false;
};

// 🔧 FIX: Add method to decrypt phone manually
userSchema.methods.getDecryptedPhone = function() {
  if (!this.phone) return null;
  try {
    return decrypt(this.phone);
  } catch (e) {
    return null;
  }
};

module.exports = mongoose.model('User', userSchema);