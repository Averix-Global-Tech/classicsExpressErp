const express = require('express');
const { authValidator } = require('../validators/authValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Auth controllers handle their own audit logging; no audit middleware needed here.
router.post('/login', authValidator.login, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post(
  '/forgot-password',
  authValidator.forgotPassword,
  validate,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authValidator.resetPassword,
  validate,
  authController.resetPassword
);

// Authenticated
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post(
  '/change-password',
  authenticate,
  authValidator.changePassword,
  validate,
  authController.changePassword
);

module.exports = router;
