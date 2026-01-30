// backend/server.js

// Global error handlers (MUST be first)
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const compression = require('compression');
require('dotenv').config();

const {
  dynamicRateLimiter,
  advancedInputSanitization,
  strictTypeValidation,
  validateHostHeader,
  enhancedCSP,
  cacheControl,
  requestId,
  validateInputSizes
} = require('./middleware/advancedSecurity');

const { generateToken: generateCSRFToken, verifyToken: verifyCSRFToken } = require('./middleware/csrf');
const { preventHPP } = require('./middleware/hpp');
const logger = require('./utils/logger');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Trust proxy (important if behind proxy; safe locally too)
app.set('trust proxy', 1);

// Hide powered-by
app.disable('x-powered-by');

// Static files
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d',
    etag: false,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
  })
);

// Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: isProd
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
    crossOriginEmbedderPolicy: false, // keep dev-friendly
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// Custom security middleware
app.use(enhancedCSP);
app.use(cacheControl);
app.use(requestId);
app.use(validateHostHeader);

// Extra headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
});

// ✅ CORS (cookie auth compatible)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman/curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      logger.logSecurityEvent?.('CORS_BLOCK', { origin });
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID', 'X-Timestamp'],
    exposedHeaders: ['X-Request-ID']
  })
);


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb', parameterLimit: 50 }));

app.use(cookieParser());

app.use(
  mongoSanitize({
    replaceWith: '_'
  })
);
app.use(xss());
app.use(preventHPP);
app.use(advancedInputSanitization);
app.use(strictTypeValidation);

app.use(compression({ level: 6 }));


if (isProd) {
  app.use('/api/', dynamicRateLimiter);
}


app.use('/api/', validateInputSizes);


app.use('/api/', generateCSRFToken);

app.use('/api/', (req, res, next) => {
  const p = req.path || '';

  const isAuthExempt =
    p.startsWith('/auth/login') ||
    p.startsWith('/auth/register') ||
    p.startsWith('/auth/forgot-password') ||
    p.startsWith('/auth/verify-otp') ||
    p.startsWith('/auth/reset-password') ||
    p.startsWith('/auth/verify-email') ||
    p.startsWith('/auth/validate-password');

  if (isAuthExempt) return next();
  return verifyCSRFToken(req, res, next);
});

// Access logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logAccess?.(req, res, duration);
  });
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));

// Health
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404
app.use((req, res) => {
  logger.logSecurityEvent?.('404_NOT_FOUND', { path: req.path, method: req.method, ip: req.ip });
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.logError?.(err, { path: req.path, method: req.method, ip: req.ip });
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ success: false, message: isProd ? 'Server Error' : err.message });
});

// DB + server
const PORT = process.env.PORT || 5000;

const mongoUri = process.env.MONGODB_URI;

console.log("🔎 NODE_ENV =", process.env.NODE_ENV);
console.log("🔎 MONGODB_URI =", process.env.MONGODB_URI);

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
    
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });
    
    server.on('clientError', (err, socket) => {
      console.error('❌ Client error:', err.message);
      try {
        if (socket.writable) {
          socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        }
      } catch (e) {
        // ignore
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  });

module.exports = app;

// MongoDB connection handling
const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://localhost:27017/carelink';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`✅ Connected to MongoDB at ${uri.replace(/(mongodb:\/\/.*:)(.*)(@.*)/, '$1****$3')}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();
