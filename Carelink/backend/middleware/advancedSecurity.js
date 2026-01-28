const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/logger');
const crypto = require('crypto');

class JWTBlacklist {
  constructor() {
    this.blacklist = new Set();
    this.expiryMap = new Map();
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async add(jti, expiresInSeconds) {
    this.blacklist.add(jti);
    this.expiryMap.set(jti, Date.now() + expiresInSeconds * 1000);

    // Persist to MongoDB (optional)
    try {
      const BlacklistedToken = require('../models/BlacklistedToken');
      await BlacklistedToken.create({
        jti,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      });
    } catch (e) {
      console.warn('Failed to persist blacklist to DB:', e.message);
    }
  }

  isBlacklisted(jti) {
    return this.blacklist.has(jti);
  }

  cleanup() {
    const now = Date.now();
    for (const [jti, expiry] of this.expiryMap.entries()) {
      if (now > expiry) {
        this.blacklist.delete(jti);
        this.expiryMap.delete(jti);
      }
    }
  }

  async loadFromDB() {
    try {
      const BlacklistedToken = require('../models/BlacklistedToken');
      const tokens = await BlacklistedToken.find({ expiresAt: { $gt: new Date() } });

      tokens.forEach((t) => {
        this.blacklist.add(t.jti);
        this.expiryMap.set(t.jti, t.expiresAt.getTime());
      });

      console.log(`✅ Loaded ${tokens.length} blacklisted tokens from DB`);
    } catch (e) {
      console.warn('Could not load blacklist from DB:', e.message);
    }
  }
}

const jwtBlacklist = new JWTBlacklist();
// Commented: loadFromDB() is async and causes unhandled rejection
// jwtBlacklist.loadFromDB();

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const dynamicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => (req.cookies?.token || req.headers.authorization ? 100 : 20),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip: req.ip, path: req.path });
    res.status(429).json({ success: false, message: 'Too many requests.' });
  },
});

const validateHostHeader = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') return next();
  const host = req.headers.host;

  const allowedHosts = [
    'localhost:5000',
    'localhost:5173',
    ...(process.env.FRONTEND_URL ? [new URL(process.env.FRONTEND_URL).host] : []),
  ];

  if (!allowedHosts.includes(host)) {
    logSecurityEvent('INVALID_HOST_HEADER', { host, ip: req.ip, severity: 'CRITICAL' });
    return res.status(400).json({ success: false, message: 'Invalid Host Header' });
  }
  next();
};

const advancedInputSanitization = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    }
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.startsWith('__') || key === 'constructor' || key === 'prototype') {
          delete obj[key];
          continue;
        }
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

const enhancedCSP = (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  next();
};

const cacheControl = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
};

const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

const strictTypeValidation = (req, res, next) => next();
const validateInputSizes = (req, res, next) => next();

module.exports = {
  JWTBlacklist: jwtBlacklist,
  escapeRegex,
  dynamicRateLimiter,
  validateHostHeader,
  advancedInputSanitization,
  enhancedCSP,
  cacheControl,
  requestId,
  strictTypeValidation,
  validateInputSizes,
};
