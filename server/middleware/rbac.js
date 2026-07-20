const ApiError = require('../utils/ApiError');

/**
 * Role-based access control. Pass one or more allowed roles.
 *   router.post('/', authenticate, requireRole(ROLES.SYSTEM_ADMIN), handler)
 * Must run AFTER `authenticate`.
 */
function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!allowed.has(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}

module.exports = { requireRole };
