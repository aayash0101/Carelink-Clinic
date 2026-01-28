/**
 * HTTP Parameter Pollution Prevention
 * Prevents array-based attacks in URLs
 */
exports.preventHPP = (req, res, next) => {
  // Convert array parameters to single values (take first)
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  }

  for (const key in req.body) {
    if (Array.isArray(req.body[key]) && key !== 'items' && key !== 'images') {
      // Allow arrays for specific fields (items, images)
      req.body[key] = req.body[key][0];
    }
  }

  next();
};
