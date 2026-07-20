const ApiError = require('../utils/ApiError');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Central error handler. Converts ApiError / Mongoose errors / validator errors
 * into a consistent JSON shape. Never leaks stack traces in production.
 */
function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Mongoose: bad ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  }
  // Mongoose: duplicate key
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists.`;
  }
  // Mongoose: validation
  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  // express-jwt / jsonwebtoken
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid or expired token.';
  }

  if (status >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`[${status}] ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    details,
    ...(config.isDev && status >= 500 ? { stack: err.stack } : {}),
  });
}

/** Catch sync/async errors that fell through route handlers. */
function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFound };
