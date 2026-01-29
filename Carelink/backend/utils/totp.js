const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate TOTP secret for 2FA
 * @param {String} email - User email
 * @returns {Object} - Secret and QR code data
 */
exports.generateSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `Carelink (${email})`,
    issuer: 'Carelink',
    length: 32
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url
  };
};

/**
 * Verify TOTP token
 * @param {String} token - 6-digit code from user
 * @param {String} secret - User's TOTP secret
 * @returns {Boolean} - Verification result
 */
exports.verifyToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) of tolerance
  });
};

/**
 * Generate backup codes
 * @param {Number} count - Number of codes to generate
 * @returns {Array} - Array of backup codes
 */
exports.generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

/**
 * Verify backup code
 * @param {String} code - Backup code to verify
 * @param {Array} backupCodes - User's backup codes
 * @returns {Boolean} - Verification result
 */
exports.verifyBackupCode = (code, backupCodes) => {
  const index = backupCodes.indexOf(code.toUpperCase());
  if (index > -1) {
    backupCodes.splice(index, 1); // Remove used code
    return true;
  }
  return false;
};



