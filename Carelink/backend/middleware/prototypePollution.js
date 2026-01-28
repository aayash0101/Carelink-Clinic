/**
 * Prevent prototype pollution attacks
 * Freezes Object.prototype to prevent modification
 */
exports.preventPrototypePollution = (req, res, next) => {
  // Freeze Object.prototype if not already frozen
  if (!Object.isFrozen(Object.prototype)) {
    Object.freeze(Object.prototype);
  }

  // Remove __proto__ and constructor from request body
  if (req.body) {
    delete req.body.__proto__;
    delete req.body.constructor;
    delete req.body.prototype;
  }

  // Remove from query params
  if (req.query) {
    delete req.query.__proto__;
    delete req.query.constructor;
    delete req.query.prototype;
  }

  // Remove from params
  if (req.params) {
    delete req.params.__proto__;
    delete req.params.constructor;
    delete req.params.prototype;
  }

  next();
};
