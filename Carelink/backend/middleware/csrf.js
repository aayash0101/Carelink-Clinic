const crypto = require('crypto');

const tokens = new Map();
const CSRF_TTL = 15 * 60 * 1000;

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (data.expiresAt < now) tokens.delete(token);
  }
}
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

exports.generateToken = (req, res, next) => {
  // rotate on safe methods only
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { expiresAt: Date.now() + CSRF_TTL });

  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CSRF_TTL,
    path: '/'
  });

  req.csrfToken = token;
  next();
};

exports.verifyToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const token =
    req.headers['x-csrf-token'] ||
    req.cookies?.['csrf-token'] ||
    req.body?._csrf;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  const tokenData = tokens.get(token);
  if (!tokenData) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  if (tokenData.expiresAt < Date.now()) {
    tokens.delete(token);
    return res.status(403).json({
      success: false,
      message: 'CSRF token expired',
      code: 'CSRF_TOKEN_EXPIRED'
    });
  }

  next();
};
