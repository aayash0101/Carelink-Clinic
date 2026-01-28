// frontend/src/utils/sanitize.js - NEW FILE
export const sanitizeString = (str, maxLength = 200) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .substring(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};

export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const cleaned = email.trim().toLowerCase().substring(0, 255);
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(cleaned) ? cleaned : '';
};

export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  return phone.replace(/[^\d+\-() ]/g, '').substring(0, 20);
};

export const sanitizeNumber = (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
};