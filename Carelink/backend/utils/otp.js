const crypto = require('crypto');

// Store OTPs (in production, use Redis)
const otps = new Map();

/**
 * Generate 6-digit OTP
 */
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP with expiry
 */
exports.storeOTP = (email, otp) => {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  otps.set(email, {
    hashedOTP,
    expiresAt,
    attempts: 0
  });
  
  // Clean expired OTPs
  cleanExpiredOTPs();
};

/**
 * Verify OTP
 */
exports.verifyOTP = (email, otp) => {
  const stored = otps.get(email);
  
  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }
  
  if (stored.expiresAt < Date.now()) {
    otps.delete(email);
    return { valid: false, message: 'OTP expired' };
  }
  
  // Check attempts (max 5)
  if (stored.attempts >= 5) {
    otps.delete(email);
    return { valid: false, message: 'Too many failed attempts' };
  }
  
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
  const isValid = hashedOTP === stored.hashedOTP;
  
  if (!isValid) {
    stored.attempts++;
    return { valid: false, message: 'Invalid OTP', attemptsLeft: 5 - stored.attempts };
  }
  
  // Delete OTP after successful verification
  otps.delete(email);
  
  return { valid: true, message: 'OTP verified' };
};

/**
 * Clean expired OTPs
 */
function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [email, data] of otps.entries()) {
    if (data.expiresAt < now) {
      otps.delete(email);
    }
  }
}

// Clean expired OTPs every 5 minutes
setInterval(cleanExpiredOTPs, 5 * 60 * 1000);



