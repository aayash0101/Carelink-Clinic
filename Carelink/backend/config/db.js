// backend/config/db.js
/**
 * DB connection policy:
 * - A single `connectDB()` export is the sole place that calls `mongoose.connect()`
 * - Selection policy:
 *   1. If `process.env.MONGODB_URI` is set, it is used.
 *   2. Else if `process.env.NODE_ENV !== 'production'`, default to
 *      `mongodb://localhost:27017/carelink`.
 *   3. Else (production and missing URI) the process will exit with an error.
 * - `connectDB()` returns the final chosen URI (for logging) and throws on failure.
 */

const mongoose = require('mongoose');

function _sanitizeUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  try {
    const idx = uri.indexOf('://');
    if (idx === -1) return uri;
    const after = uri.slice(idx + 3);
    const at = after.indexOf('@');
    if (at === -1) return uri; // no credentials present
    const cred = after.slice(0, at);
    const colon = cred.indexOf(':');
    if (colon === -1) return uri; // no password
    // replace password portion between ':' and '@'
    const start = uri.indexOf(':', idx + 3);
    const end = uri.indexOf('@', start);
    if (start === -1 || end === -1) return uri;
    return uri.slice(0, start + 1) + '*****' + uri.slice(end);
  } catch (e) {
    return uri;
  }
}

async function connectDB(overrideUri) {
  const envUri = process.env.MONGODB_URI;
  const nodeEnv = process.env.NODE_ENV;

  const chosen = overrideUri || envUri || (nodeEnv === 'production' ? null : 'mongodb://localhost:27017/carelink');

  if (!chosen) {
    throw new Error('MONGODB_URI is missing in production environment');
  }

  const sanitized = _sanitizeUri(chosen);
  console.log('🔎 NODE_ENV =', nodeEnv);
  console.log('🔎 Chosen MongoDB URI =', sanitized);

  // Connect once
  await mongoose.connect(chosen, {
    // useNewUrlParser/useUnifiedTopology are defaults in modern mongoose, but kept for clarity
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });

  console.log('✅ MongoDB Connected:', mongoose.connection.host);
  return chosen;
}

module.exports = connectDB;
