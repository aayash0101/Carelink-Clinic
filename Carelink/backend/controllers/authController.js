// backend/controllers/authController.js — FULL FIXED VERSION (drop-in)

const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const generateToken = require('../utils/generateToken');

const { validatePassword, isCommonPassword } = require('../utils/passwordValidator');
const { verifyToken: verifyTOTP } = require('../utils/totp');
const { logSecurityEvent } = require('../utils/logger');
const { sendVerificationEmail, sendOTPEmail } = require('../utils/email');
const { verifyRecaptcha } = require('../utils/googleRecaptcha');
const { JWTBlacklist } = require('../middleware/advancedSecurity');
const { generateOTP, storeOTP, verifyOTP: verifyOTPUtils } = require('../utils/otp');

// ---------------- constants
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;

const COOKIE_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_EXPIRES = '7d';

const isProd = process.env.NODE_ENV === 'production';

// ---------------- helpers (sanitize)
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const cleaned = email.trim().toLowerCase().substring(0, MAX_EMAIL_LENGTH);
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(cleaned) ? cleaned : null;
};

const sanitizeString = (str, maxLength) => {
  if (!str || typeof str !== 'string') return null;
  return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
};

const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^\d+\-() ]/g, '').substring(0, MAX_PHONE_LENGTH);
  // require at least 10 digits overall
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 10 ? cleaned : null;
};

// ---------------- simple in-memory limiter (dev-friendly)
const rateLimitMap = new Map();
/**
 * @returns {boolean} true if allowed
 */
const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const now = Date.now();
  const attempts = rateLimitMap.get(identifier) || [];
  const recent = attempts.filter((t) => now - t < windowMs);
  if (recent.length >= maxAttempts) return false;
  recent.push(now);
  rateLimitMap.set(identifier, recent);
  return true;
};

// ---------------- cookies
const cookieOptions = (req) => {
  // In dev with Vite proxy, it’s same-site → lax is correct.
  // In prod with cross-site frontend/backend, you need https + SameSite=None.
  const origin = req.get('origin') || '';
  const host = req.get('host') || '';
  const crossSite = origin && host && !origin.includes(host);

  const sameSite = isProd && crossSite ? 'none' : 'lax';
  const secure = isProd && sameSite === 'none' ? true : isProd; // safe default

  return {
    expires: new Date(Date.now() + COOKIE_EXPIRES_MS),
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: COOKIE_EXPIRES_MS
  };
};

const clearCookieOptions = (req) => {
  const opts = cookieOptions(req);
  return { path: opts.path, sameSite: opts.sameSite, secure: opts.secure };
};

const sendTokenResponse = async (user, token, req, res) => {
  res.cookie('token', token, cookieOptions(req));

  return res.status(200).json({
    success: true,
    // keep token in response for dev/testing; remove later if you want cookie-only
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: !!user.twoFactorEnabled,
        isEmailVerified: !!user.isEmailVerified
      }
    }
  });
};

const safeDelay = async () => new Promise((r) => setTimeout(r, Math.random() * 350 + 150));

// ======================================================
// REGISTER
// ======================================================
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, recaptchaToken } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress;

    // rate limit registrations (3/hour per IP)
    if (!checkRateLimit(`register_${clientIp}`, 3, 60 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: 'Too many registration attempts. Try again later.' });
    }

    // recaptcha only in prod
    if (isProd) {
      if (!recaptchaToken) {
        return res.status(400).json({ success: false, message: 'Security verification required' });
      }
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);
      if (!recaptchaResult?.success) {
        logSecurityEvent?.('RECAPTCHA_FAILED', { ip: clientIp });
        return res.status(400).json({ success: false, message: 'Security check failed' });
      }
    }

    // sanitize + validate
    const cleanEmail = sanitizeEmail(email);
    const cleanName = sanitizeString(name, MAX_NAME_LENGTH);
    const cleanPhone = sanitizePhone(phone);

    if (!cleanEmail) return res.status(400).json({ success: false, message: 'Invalid email format' });
    if (!cleanName || cleanName.length < 2) return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    if (!cleanPhone) return res.status(400).json({ success: false, message: 'Invalid phone number' });

    // password policy
    const pwdCheck = validatePassword(password);
    if (!pwdCheck?.isValid) {
      return res.status(400).json({ success: false, message: 'Password does not meet requirements', errors: pwdCheck?.errors || [] });
    }
    if (isCommonPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password is too common' });
    }

    // duplicate check
    const exists = await User.findOne({ email: cleanEmail }).select('_id');
    if (exists) {
      logSecurityEvent?.('DUPLICATE_REGISTRATION', { email: cleanEmail, ip: clientIp });
      await safeDelay();
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // email verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(emailToken).digest('hex');

    // create user
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      phone: cleanPhone,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
      registrationIp: clientIp
    });

    // send verification email
    const baseFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${baseFrontend}/verify-email?token=${emailToken}`;

    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (e) {
      // don't block registration if mail fails in dev
      console.warn('⚠️ sendVerificationEmail failed:', e.message);
    }

    // create JWT
    const jti = crypto.randomUUID();
    const token = generateToken(user._id, jti, TOKEN_EXPIRES);

    logSecurityEvent?.('USER_REGISTERED', { userId: user._id, email: user.email, ip: clientIp });

    return sendTokenResponse(user, token, req, res);
  } catch (error) {
    // ✅ show real cause in dev
    console.error('REGISTER_ERROR:', error?.message);
    return res.status(400).json({
      success: false,
      message: error?.message || 'Registration failed'
    });
  }
};

// ======================================================
// LOGIN
// ======================================================
exports.login = async (req, res) => {
  try {
    const { email, password, totpCode, recaptchaToken } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // rate limit: 10/min per IP
    if (!checkRateLimit(`login_${clientIp}`, 10, 60 * 1000)) {
      logSecurityEvent?.('LOGIN_RATE_LIMIT', { ip: clientIp });
      return res.status(429).json({ success: false, message: 'Too many login attempts. Try again in 1 minute.' });
    }

    const user = await User.findOne({ email: cleanEmail })
      .select('+password +twoFactorSecret +twoFactorEnabled +loginAttempts +lockUntil +isEmailVerified +maxSessions');

    if (!user) {
      await safeDelay();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // optional lock logic (if your model has isLocked())
    if (typeof user.isLocked === 'function' && user.isLocked()) {
      const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }

    // reCAPTCHA only in prod and only after attempts >= 3
    if ((user.loginAttempts || 0) >= 3 && !totpCode && isProd) {
      if (!recaptchaToken) {
        return res.status(400).json({ success: false, message: 'Security verification required', requiresRecaptcha: true });
      }
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, clientIp);
      if (!recaptchaResult?.success) {
        return res.status(400).json({ success: false, message: 'Security check failed', requiresRecaptcha: true });
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (typeof user.incLoginAttempts === 'function') await user.incLoginAttempts();
      const attempts = (user.loginAttempts || 0) + 1;
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts)
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // 2FA
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(200).json({ success: false, requires2FA: true, message: 'Enter your 2FA code' });
      }
      const validTotp = verifyTOTP(totpCode, user.twoFactorSecret);
      if (!validTotp) {
        if (typeof user.incLoginAttempts === 'function') await user.incLoginAttempts();
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
      }
    }

    if (typeof user.resetLoginAttempts === 'function') await user.resetLoginAttempts();

    // session + JWT
    const jti = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const token = generateToken(user._id, jti, TOKEN_EXPIRES);
    const expiresAt = new Date(Date.now() + COOKIE_EXPIRES_MS);

    await Session.create({
      sessionId,
      userId: user._id,
      token: jti,
      deviceInfo: req.get('user-agent') || 'Unknown Device',
      ipAddress: clientIp,
      userAgent: req.get('user-agent') || 'Unknown',
      lastActivity: new Date(),
      expiresAt
    });

    // enforce max sessions
    const maxSessions = user.maxSessions || 3;
    const sessions = await Session.find({ userId: user._id }).sort({ lastActivity: -1 });
    if (sessions.length > maxSessions) {
      const toDelete = sessions.slice(maxSessions);
      await Session.deleteMany({ _id: { $in: toDelete.map((s) => s._id) } });
      logSecurityEvent?.('MAX_SESSIONS_EXCEEDED', { userId: user._id, deletedCount: toDelete.length });
    }

    logSecurityEvent?.('LOGIN_SUCCESS', { userId: user._id, ip: clientIp, sessionId });

    return sendTokenResponse(user, token, req, res);
  } catch (error) {
    console.error('LOGIN_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ======================================================
// LOGOUT
// ======================================================
exports.logout = async (req, res) => {
  try {
    if (req.user && req.jti) {
      // blacklist current token id + delete session
      await JWTBlacklist.add(req.jti, Math.floor(COOKIE_EXPIRES_MS / 1000));
      await Session.findOneAndDelete({ token: req.jti });
    }

    res.clearCookie('token', clearCookieOptions(req));

    logSecurityEvent?.('USER_LOGOUT', { userId: req.user?._id, ip: req.ip });

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('LOGOUT_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ======================================================
// LOGOUT ALL SESSIONS
// ======================================================
exports.logoutAllSessions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (req.jti) {
      await JWTBlacklist.add(req.jti, Math.floor(COOKIE_EXPIRES_MS / 1000));
    }

    const result = await Session.deleteMany({ userId: req.user._id });

    res.clearCookie('token', clearCookieOptions(req));

    logSecurityEvent?.('LOGOUT_ALL_SESSIONS', { userId: req.user._id, deletedCount: result.deletedCount, ip: req.ip });

    return res.status(200).json({
      success: true,
      message: `Logged out from ${result.deletedCount} device(s)`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error('LOGOUT_ALL_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Failed to logout all sessions' });
  }
};

// ======================================================
// GET ME
// ======================================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -passwordHistory');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('GET_ME_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

// ======================================================
// GET ACTIVE SESSIONS
// ======================================================
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .select('sessionId deviceInfo ipAddress lastActivity createdAt expiresAt token')
      .sort({ lastActivity: -1 })
      .lean();

    const mapped = sessions.map((s) => ({
      sessionId: s.sessionId,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      lastActivity: s.lastActivity,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: req.jti ? s.token === req.jti : false
    }));

    return res.status(200).json({ success: true, data: { sessions: mapped, count: mapped.length } });
  } catch (error) {
    console.error('GET_SESSIONS_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// ======================================================
// FORGOT PASSWORD (OTP)
// ======================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress;

    if (!checkRateLimit(`forgot_${clientIp}`, 3, 60 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: 'Too many requests. Try again later.' });
    }

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) return res.status(400).json({ success: false, message: 'Valid email required' });

    const user = await User.findOne({ email: cleanEmail });

    // prevent enumeration
    const genericResponse = { success: true, message: 'If an account exists, a reset code has been sent.' };
    if (!user) {
      await safeDelay();
      return res.status(200).json(genericResponse);
    }

    const otp = generateOTP();
    storeOTP(cleanEmail, otp);

    try {
      await sendOTPEmail(cleanEmail, otp);
    } catch (e) {
      console.warn('⚠️ sendOTPEmail failed:', e.message);
    }

    logSecurityEvent?.('PASSWORD_RESET_REQUESTED', { userId: user._id, ip: clientIp });

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('FORGOT_PASSWORD_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Request failed. Try again.' });
  }
};

// ======================================================
// VERIFY OTP → issue resetToken
// ======================================================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    if (!checkRateLimit(`otp_${cleanEmail}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    }

    const otpResult = verifyOTPUtils(cleanEmail, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.message });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    return res.status(200).json({ success: true, data: { resetToken } });
  } catch (error) {
    console.error('VERIFY_OTP_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) return res.status(400).json({ success: false, message: 'Token and password required' });

    const pwdCheck = validatePassword(password);
    if (!pwdCheck?.isValid) return res.status(400).json({ success: false, message: 'Password does not meet requirements', errors: pwdCheck?.errors || [] });
    if (isCommonPassword(password)) return res.status(400).json({ success: false, message: 'Password is too common' });

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await Session.deleteMany({ userId: user._id });

    logSecurityEvent?.('PASSWORD_RESET_SUCCESS', { userId: user._id, ip: req.ip });

    return res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    console.error('RESET_PASSWORD_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};

// ======================================================
// VERIFY EMAIL
// ======================================================
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Verification token required' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    logSecurityEvent?.('EMAIL_VERIFIED', { userId: user._id, email: user.email });

    return res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('VERIFY_EMAIL_ERROR:', error?.message);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// ======================================================
// VALIDATE PASSWORD (strength endpoint)
// ======================================================
exports.validatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const validation = validatePassword(password);

    if (isCommonPassword(password)) {
      validation.isValid = false;
      validation.errors.push('Password is too common');
    }

    return res.json({ success: true, data: validation });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Validation failed' });
  }
};
