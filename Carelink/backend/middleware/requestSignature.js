// middleware/requestSignature.js - NEW FILE
const crypto = require('crypto');

const SECRET_KEY = process.env.API_SIGNATURE_KEY || crypto.randomBytes(32).toString('hex');

exports.signRequest = (req, res, next) => {
  // Generate signature for outgoing requests (client-side)
  const timestamp = Date.now();
  const payload = JSON.stringify({
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp
  });
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  req.signature = signature;
  req.signatureTimestamp = timestamp;
  next();
};

exports.verifyRequestSignature = (req, res, next) => {
  // Skip for GET requests (no body)
  if (req.method === 'GET') return next();
  
  const clientSignature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  if (!clientSignature || !timestamp) {
    return res.status(400).json({ success: false, message: 'Missing signature' });
  }
  
  // ✅ Prevent replay attacks (5-minute window)
  if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
    return res.status(400).json({ success: false, message: 'Request expired' });
  }
  
  const payload = JSON.stringify({
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: parseInt(timestamp)
  });
  
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  if (clientSignature !== expectedSignature) {
    logSecurityEvent('INVALID_REQUEST_SIGNATURE', {
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({ success: false, message: 'Invalid signature' });
  }
  
  next();
};