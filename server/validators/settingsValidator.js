const { body } = require('express-validator');

/**
 * Validation rules for the Settings module endpoints.
 */
const settingsValidator = {
  updateProfile: [
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters.'),
    body('phone')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .matches(/^[+\d\s\-().]{7,20}$/)
      .withMessage('Enter a valid phone number.'),
  ],

  requestEmailChange: [
    body('newEmail').isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Current password is required.'),
  ],

  verifyEmailChange: [
    body('otp')
      .isString()
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('OTP must be exactly 6 digits.'),
  ],

  updateNotifications: [
    body('email').optional().isBoolean().withMessage('email must be a boolean.'),
    body('inApp').optional().isBoolean().withMessage('inApp must be a boolean.'),
    body('attendance').optional().isBoolean().withMessage('attendance must be a boolean.'),
    body('tasks').optional().isBoolean().withMessage('tasks must be a boolean.'),
    body('grievances').optional().isBoolean().withMessage('grievances must be a boolean.'),
  ],

  updatePreferences: [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Theme must be light, dark, or system.'),
    body('language')
      .optional()
      .isString()
      .isLength({ min: 2, max: 10 })
      .withMessage('Invalid language code.'),
    body('timezone').optional().isString().withMessage('Invalid timezone.'),
  ],

  verify2fa: [
    body('otp')
      .isString()
      .trim()
      .matches(/^\d{6}$/)
      .withMessage('OTP must be exactly 6 digits.'),
  ],

  disable2fa: [
    body('password').notEmpty().withMessage('Current password is required to disable 2FA.'),
  ],
};

module.exports = { settingsValidator };
