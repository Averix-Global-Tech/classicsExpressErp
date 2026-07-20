const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { settingsValidator } = require('../validators/settingsValidator');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

// All settings routes require authentication
router.use(authenticate);

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/', settingsController.getSettings);
router.patch(
  '/profile',
  settingsValidator.updateProfile,
  validate,
  settingsController.updateProfile
);

// ── Email Change ───────────────────────────────────────────────────────────────
router.post(
  '/email/request',
  settingsValidator.requestEmailChange,
  validate,
  settingsController.requestEmailChange
);
router.post(
  '/email/verify',
  settingsValidator.verifyEmailChange,
  validate,
  settingsController.verifyEmailChange
);

// ── Notifications ─────────────────────────────────────────────────────────────
router.patch(
  '/notifications',
  settingsValidator.updateNotifications,
  validate,
  settingsController.updateNotifications
);

// ── Preferences ───────────────────────────────────────────────────────────────
router.patch(
  '/preferences',
  settingsValidator.updatePreferences,
  validate,
  settingsController.updatePreferences
);

// ── Two-Factor Authentication ─────────────────────────────────────────────────
router.post('/2fa/request', settingsController.request2faOtp);
router.post(
  '/2fa/verify',
  settingsValidator.verify2fa,
  validate,
  settingsController.verify2faOtp
);
router.delete(
  '/2fa',
  settingsValidator.disable2fa,
  validate,
  settingsController.disable2fa
);

// ── Avatar Upload ─────────────────────────────────────────────────────────────
router.post('/avatar', settingsController.uploadAvatar);

module.exports = router;
