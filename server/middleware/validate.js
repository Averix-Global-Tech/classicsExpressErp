const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs AFTER an express-validator chain. Collects every field error into a
 * friendly 422 so the frontend gets all messages at once.
 */
const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return next(new ApiError(422, 'Validation failed', errors));
};

module.exports = { validate };
