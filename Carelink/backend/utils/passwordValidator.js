const fs = require('fs');
const path = require('path');

// Common password list (RockYou.txt style - top 1000 most common)
const commonPasswords = [
  '123456', 'password', '123456789', '12345678', '12345', '1234567',
  '1234567890', 'qwerty', 'abc123', '111111', '123123', 'admin',
  'letmein', 'welcome', 'monkey', '1234567890', 'qwerty123', 'password1',
  '123456789', 'sunshine', 'princess', 'football', 'iloveyou', '1234567',
  'welcome123', 'admin123', 'root', 'toor', 'pass', 'test', 'guest'
];

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} - Validation result
 */
exports.validatePassword = (password) => {
  const errors = [];
  const warnings = [];

  // Minimum length (12 characters)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords (RockYou style)
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    errors.push('Password contains common words or patterns');
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(password)) {
    warnings.push('Password contains repeated characters');
  }

  // Check for sequential characters
  if (/12345|abcde|qwerty/i.test(password)) {
    warnings.push('Password contains sequential characters');
  }

  // Calculate entropy
  const entropy = calculateEntropy(password);
  if (entropy < 50) {
    warnings.push('Password has low entropy (too predictable)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: calculateStrength(password, errors, warnings, entropy)
  };
};

/**
 * Calculate password entropy
 */
function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  return password.length * Math.log2(charsetSize);
}

/**
 * Calculate password strength
 */
function calculateStrength(password, errors, warnings, entropy) {
  if (errors.length > 0) return 'weak';
  if (warnings.length > 0) return 'medium';
  if (entropy >= 80 && password.length >= 16) return 'very-strong';
  if (entropy >= 60) return 'strong';
  return 'medium';
}

/**
 * Check if password is in common password list
 */
exports.isCommonPassword = (password) => {
  return commonPasswords.some(common => 
    password.toLowerCase() === common.toLowerCase() ||
    password.toLowerCase().includes(common.toLowerCase())
  );
};



