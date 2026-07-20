/**
 * Operational error with an attached HTTP status. Throw these from controllers /
 * services; the global error handler turns them into consistent JSON responses.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Resource already exists') {
    return new ApiError(409, msg);
  }
}

module.exports = ApiError;
