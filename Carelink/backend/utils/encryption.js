const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️  ENCRYPTION_KEY not set. Using default (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-key-change-in-production', 'salt', KEY_LENGTH);
  }
  return Buffer.from(key, 'hex');
};

/**
 * Check if data is already encrypted
 */
exports.isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false;
  
  const parts = data.split(':');
  if (parts.length !== 3) return false;
  
  const [ivHex, tagHex, encrypted] = parts;
  
  return (
    ivHex.match(/^[0-9a-f]+$/i) && 
    tagHex.match(/^[0-9a-f]+$/i) &&
    encrypted.match(/^[0-9a-f]+$/i) &&
    ivHex.length === IV_LENGTH * 2 &&
    tagHex.length === TAG_LENGTH * 2
  );
};

/**
 * Encrypt sensitive data
 */
exports.encrypt = (text) => {
  try {
    if (!text || text === '') return '';
    
    // ⭐ CRITICAL FIX: Don't encrypt if already encrypted
    if (exports.isEncrypted(text)) {
      console.log('⚠️ Data already encrypted, skipping...');
      return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    throw new Error('Encryption failed: ' + error.message);
  }
};

/**
 * Decrypt sensitive data
 */
exports.decrypt = (encryptedData) => {
  try {
    if (!encryptedData || encryptedData === '') return null;
    if (typeof encryptedData !== 'string') return encryptedData;

    // If not encrypted format, return as-is (plain text)
    if (!exports.isEncrypted(encryptedData)) {
      console.warn('⚠️ Data not in encrypted format, returning as-is');
      return encryptedData;
    }

    const [ivHex, tagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    console.error('Data preview:', encryptedData?.substring(0, 50));
    return null; // Don't crash, return null
  }
};

exports.maskData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return '****';
  return '*'.repeat(data.length - visibleChars) + data.slice(-visibleChars);
};

exports.maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***@***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return '**@' + domain;
  return local.slice(0, 2) + '***@' + domain;
};

