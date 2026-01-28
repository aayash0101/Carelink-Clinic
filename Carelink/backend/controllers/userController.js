const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');
const { logSecurityEvent } = require('../utils/logger');
const { generateSecret, verifyToken, generateBackupCodes } = require('../utils/totp');

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone; // Encryption handled by model setter
    if (addresses) user.addresses = addresses;

    await user.save();
    
    logSecurityEvent('PROFILE_UPDATED', { userId: user._id, ip: req.ip });
    
    res.status(200).json({ 
      success: true, 
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update Password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current and new password required' 
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password +passwordHistory');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password does not meet requirements',
        errors: validation.errors
      });
    }

    // Check password history
    const isInHistory = await user.isPasswordInHistory(newPassword);
    if (isInHistory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reuse recent passwords' 
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    logSecurityEvent('PASSWORD_CHANGED', { userId: user._id, ip: req.ip });
    
    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Setup 2FA (Generate Secret & QR Code)
// @route   POST /api/users/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate TOTP secret
    const { secret, qrCodeUrl } = generateSecret(user.email);
    
    // Save secret temporarily (not activated yet)
    user.twoFactorSecret = secret;
    await user.save();

    logSecurityEvent('2FA_SETUP_INITIATED', { userId: user._id, ip: req.ip });

    res.status(200).json({ 
      success: true, 
      secret, 
      qrCodeUrl 
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Enable 2FA (Verify TOTP Token)
// @route   POST /api/users/2fa/enable
// @access  Private
exports.enable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Setup 2FA first' 
      });
    }

    // Verify the TOTP token
    const isValid = verifyToken(token, user.twoFactorSecret);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    // Enable 2FA and generate backup codes
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = generateBackupCodes();
    await user.save();
    
    logSecurityEvent('2FA_ENABLED', { userId: user._id, ip: req.ip });
    
    res.status(200).json({ 
      success: true, 
      message: '2FA enabled successfully',
      backupCodes: user.twoFactorBackupCodes 
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Disable 2FA
// @route   POST /api/users/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password required to disable 2FA' 
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Incorrect password' 
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = [];
    await user.save();
    
    logSecurityEvent('2FA_DISABLED', { userId: user._id, ip: req.ip });
    
    res.status(200).json({ 
      success: true, 
      message: '2FA disabled successfully' 
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};