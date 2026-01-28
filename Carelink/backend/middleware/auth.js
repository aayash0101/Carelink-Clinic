// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { JWTBlacklist } = require('./advancedSecurity');
const { logSecurityEvent } = require('../utils/logger');

const SHOULD_DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

const publicKeyPath = path.join(__dirname, '../keys/public.pem');
const publicKey = fs.existsSync(publicKeyPath) ? fs.readFileSync(publicKeyPath, 'utf8') : null;

const hsSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

function getTokenFromRequest(req) {
  if (req.cookies?.token) return req.cookies.token;

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();

  return null;
}

async function isJtiBlacklisted(jti) {
  if (!jti) return false;

  try {
    const result = JWTBlacklist?.isBlacklisted?.(jti);
    if (result && typeof result.then === 'function') return await result;
    return Boolean(result);
  } catch {
    return false;
  }
}

exports.protect = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      if (SHOULD_DEBUG_AUTH) {
        console.log('❌ No token found in cookies or headers');
        console.log('Cookies:', req.cookies);
        console.log('Authorization:', req.headers.authorization);
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized (no token)',
        code: 'NO_TOKEN'
      });
    }

    // Decide algorithm safely from token header
    const decodedHeader = jwt.decode(token, { complete: true })?.header;
    const alg = decodedHeader?.alg;

    const allowedAlgs = ['HS256', 'RS256'];
    if (!allowedAlgs.includes(alg)) {
      logSecurityEvent?.('INVALID_JWT_ALG', { alg, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Invalid token algorithm',
        code: 'INVALID_ALG'
      });
    }

    const key = alg === 'RS256' ? publicKey : hsSecret;

    if (alg === 'RS256' && !publicKey) {
      return res.status(401).json({
        success: false,
        message: 'Public key missing for RS256 verification',
        code: 'MISSING_PUBLIC_KEY'
      });
    }

    const decoded = jwt.verify(token, key, { algorithms: [alg] });

    const jti = decoded.jti || null;
    const blacklisted = await isJtiBlacklisted(jti);

    if (blacklisted) {
      logSecurityEvent?.('BLACKLISTED_JWT_USED', { jti, ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    const userId = decoded.id || decoded.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        code: 'BAD_PAYLOAD'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = user;
    req.jti = jti;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    logSecurityEvent?.('INVALID_JWT', { error: error.message, ip: req.ip });
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logSecurityEvent?.('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: req.user?._id,
        role: req.user?.role,
        requiredRoles: roles,
        path: req.path,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    next();
  };
};

exports.requireEmailVerification = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email first',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};
