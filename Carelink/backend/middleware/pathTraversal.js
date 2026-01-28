const path = require('path');

/**
 * Prevent path traversal attacks
 */
exports.preventPathTraversal = (req, res, next) => {
  // Check file paths in body
  if (req.body && req.body.path) {
    const normalizedPath = path.normalize(req.body.path);
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    req.body.path = normalizedPath;
  }

  // Check file paths in query
  if (req.query && req.query.path) {
    const normalizedPath = path.normalize(req.query.path);
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }
    req.query.path = normalizedPath;
  }

  next();
};



