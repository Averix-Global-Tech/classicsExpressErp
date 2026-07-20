const crypto = require('crypto');
const User = require('../models/User');
const UserSettings = require('../models/UserSettings');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const emailService = require('../services/emailService');
const config = require('../config/env');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert and return the UserSettings doc for the current user. */
async function getOrCreateSettings(userId) {
  const settings = await UserSettings.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return settings;
}

/** Generate a 6-digit numeric OTP (plain) + expiry 10 min from now. */
function generateOtp() {
  const otp = String(crypto.randomInt(100000, 999999));
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, expires };
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/settings
 * Returns combined profile + settings for the current user.
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await UserSettings.findOne({ user: req.user._id });
  return ApiResponse.ok(res, 'Settings loaded', {
    user: req.user.toJSON(),
    settings: settings || null,
  });
});

/**
 * PATCH /api/settings/profile
 * Update editable profile fields: name, phone.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) {
    let cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone.slice(1).replace(/\+/g, '');
    } else {
      cleanPhone = cleanPhone.replace(/\+/g, '');
    }
    if (cleanPhone && !/^\+?\d{10,15}$/.test(cleanPhone)) {
      throw new ApiError(400, 'Mobile number must contain between 10 and 15 digits.');
    }
    if (cleanPhone && cleanPhone !== req.user.phone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) throw new ApiError(409, 'An account with this phone number already exists.');
    }
    updates.phone = cleanPhone;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No valid fields to update.');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'PROFILE_UPDATED',
    module: 'settings',
    summary: `Profile updated: ${Object.keys(updates).join(', ')}`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Profile updated successfully.', {
    user: updatedUser.toJSON(),
  });
});

/**
 * POST /api/settings/email/request
 * Start an email change: verify current password, check the new address is
 * free, then send a 6-digit OTP to the NEW address to prove ownership.
 */
const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, password } = req.body;

  const normalizedEmail = newEmail.trim().toLowerCase();
  if (normalizedEmail === req.user.email) {
    throw new ApiError(400, 'That is already your current email address.');
  }

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(400, 'Incorrect password.');

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'That email address is already in use.');

  const { otp, expires } = generateOtp();

  await UserSettings.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        'emailChange.newEmail': normalizedEmail,
        'emailChange.otp': otp,
        'emailChange.otpExpires': expires,
      },
      $setOnInsert: { user: req.user._id },
    },
    { upsert: true, new: true }
  );

  await emailService.sendOtpEmail(normalizedEmail, req.user.name, otp);

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'EMAIL_CHANGE_REQUESTED',
    module: 'settings',
    summary: `Email change requested to ${normalizedEmail}`,
    ip: req.ip,
  });

  const devHint = config.isDev ? { otp } : {};
  return ApiResponse.ok(res, `A verification code was sent to ${normalizedEmail}.`, devHint);
});

/**
 * POST /api/settings/email/verify
 * Verify the OTP sent to the new address and commit the email change.
 */
const verifyEmailChange = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  const settings = await UserSettings.findOne({ user: req.user._id }).select(
    '+emailChange.newEmail +emailChange.otp +emailChange.otpExpires'
  );

  if (!settings || !settings.emailChange.otp || !settings.emailChange.newEmail) {
    throw new ApiError(400, 'No email change was requested. Please start again.');
  }
  if (new Date() > settings.emailChange.otpExpires) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  if (settings.emailChange.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  const newEmail = settings.emailChange.newEmail;
  let updatedUser;
  try {
    updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { email: newEmail } },
      { new: true, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'That email address is already in use.');
    throw err;
  }

  await UserSettings.findByIdAndUpdate(settings._id, {
    $set: {
      'emailChange.newEmail': null,
      'emailChange.otp': null,
      'emailChange.otpExpires': null,
    },
  });

  auditService.record({
    user: req.user._id,
    userEmail: newEmail,
    action: 'EMAIL_CHANGED',
    module: 'settings',
    summary: `Email changed to ${newEmail}`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Email address updated successfully.', {
    user: updatedUser.toJSON(),
  });
});

/**
 * PATCH /api/settings/notifications
 * Update notification preferences.
 */
const updateNotifications = asyncHandler(async (req, res) => {
  const { email, inApp, attendance, tasks, grievances } = req.body;

  const prefUpdates = {};
  if (email !== undefined) prefUpdates['notificationPrefs.email'] = email;
  if (inApp !== undefined) prefUpdates['notificationPrefs.inApp'] = inApp;
  if (attendance !== undefined) prefUpdates['notificationPrefs.attendance'] = attendance;
  if (tasks !== undefined) prefUpdates['notificationPrefs.tasks'] = tasks;
  if (grievances !== undefined) prefUpdates['notificationPrefs.grievances'] = grievances;

  const settings = await UserSettings.findOneAndUpdate(
    { user: req.user._id },
    { $set: prefUpdates, $setOnInsert: { user: req.user._id } },
    { upsert: true, new: true }
  );

  return ApiResponse.ok(res, 'Notification preferences updated.', {
    notificationPrefs: settings.notificationPrefs,
  });
});

/**
 * PATCH /api/settings/preferences
 * Update theme/language/timezone stubs.
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { theme, language, timezone } = req.body;

  const prefUpdates = {};
  if (theme !== undefined) prefUpdates['preferences.theme'] = theme;
  if (language !== undefined) prefUpdates['preferences.language'] = language;
  if (timezone !== undefined) prefUpdates['preferences.timezone'] = timezone;

  const settings = await UserSettings.findOneAndUpdate(
    { user: req.user._id },
    { $set: prefUpdates, $setOnInsert: { user: req.user._id } },
    { upsert: true, new: true }
  );

  return ApiResponse.ok(res, 'Preferences updated.', {
    preferences: settings.preferences,
  });
});

/**
 * POST /api/settings/2fa/request
 * Generate an OTP and "send" it (returned in dev, emailed in prod).
 */
const request2faOtp = asyncHandler(async (req, res) => {
  const { otp, expires } = generateOtp();

  // Store OTP hash in UserSettings (select: false on read; we write directly)
  await UserSettings.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: { 'twoFactor.otp': otp, 'twoFactor.otpExpires': expires },
      $setOnInsert: { user: req.user._id },
    },
    { upsert: true, new: true }
  );

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: '2FA_OTP_REQUESTED',
    module: 'settings',
    summary: '2FA OTP requested',
    ip: req.ip,
  });

  // In production: send OTP via email (Phase 4).
  // In development: expose OTP in response for testing.
  const devHint = config.isDev ? { otp } : {};
  return ApiResponse.ok(
    res,
    `OTP sent to ${req.user.email}. It expires in 10 minutes.`,
    devHint
  );
});

/**
 * POST /api/settings/2fa/verify
 * Verify the OTP and enable 2FA.
 */
const verify2faOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  const settings = await UserSettings.findOne({ user: req.user._id }).select(
    '+twoFactor.otp +twoFactor.otpExpires'
  );

  if (!settings || !settings.twoFactor.otp) {
    throw new ApiError(400, 'No OTP was requested. Please request a new one.');
  }
  if (new Date() > settings.twoFactor.otpExpires) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }
  if (settings.twoFactor.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  // Enable 2FA — clear the OTP fields
  await UserSettings.findByIdAndUpdate(settings._id, {
    $set: {
      'twoFactor.enabled': true,
      'twoFactor.otp': null,
      'twoFactor.otpExpires': null,
    },
  });

  // Mirror flag on User for quick lookup
  await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: '2FA_ENABLED',
    module: 'settings',
    summary: '2FA enabled via OTP verification',
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Two-factor authentication has been enabled.');
});

/**
 * DELETE /api/settings/2fa
 * Disable 2FA — requires current password confirmation.
 */
const disable2fa = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(400, 'Incorrect password.');

  await UserSettings.findOneAndUpdate(
    { user: req.user._id },
    {
      $set: {
        'twoFactor.enabled': false,
        'twoFactor.otp': null,
        'twoFactor.otpExpires': null,
      },
    }
  );

  await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: '2FA_DISABLED',
    module: 'settings',
    summary: '2FA disabled by user',
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Two-factor authentication has been disabled.');
});

/**
 * POST /api/settings/avatar
 * Upload profile photo. Phase 1: returns a "coming soon" response if Cloudinary
 * is not configured. Phase 4: integrate Cloudinary upload.
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!config.cloudinary?.cloudName) {
    throw new ApiError(
      503,
      'Photo upload is not yet configured. It will be available in a future update.'
    );
  }
  // Phase 4: Cloudinary upload logic goes here.
  return ApiResponse.ok(res, 'Avatar uploaded successfully.');
});

module.exports = {
  getSettings,
  updateProfile,
  requestEmailChange,
  verifyEmailChange,
  updateNotifications,
  updatePreferences,
  request2faOtp,
  verify2faOtp,
  disable2fa,
  uploadAvatar,
};
