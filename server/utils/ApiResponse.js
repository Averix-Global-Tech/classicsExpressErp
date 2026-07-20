/**
 * Uniform success envelope used by every controller.
 *   { success: true, message, data }
 */
class ApiResponse {
  constructor(res, { statusCode = 200, message = 'Success', data = null } = {}) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static ok(res, message, data = null) {
    return res.status(200).json({ success: true, message, data });
  }

  static created(res, message, data = null) {
    return res.status(201).json({ success: true, message, data });
  }
}

module.exports = ApiResponse;
