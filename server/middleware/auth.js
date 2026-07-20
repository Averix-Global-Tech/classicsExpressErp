const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ACCESS_COOKIE } = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Require a valid access token (cookie). Attaches req.user. Throws 401 when
 * absent/invalid so the frontend interceptor can redirect to login on expiry.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new ApiError(401, 'Authentication required.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account is inactive or not found.');

  req.user = user;
  next();
});

/** Soft optional auth — sets req.user if a valid token is present, else continues. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    /* ignore — treated as anonymous */
  }
  next();
});

module.exports = { authenticate, optionalAuth };
