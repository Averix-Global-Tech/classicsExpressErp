const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Per-user settings — stored separately from User to keep the auth model lean.
 * Created on-demand (findOneAndUpdate upsert) the first time a user hits GET /settings.
 */
const userSettingsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ── Notification Preferences ─────────────────────────────────────────────
    notificationPrefs: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      grievances: { type: Boolean, default: true },
    },

    // ── Two-Factor Authentication ────────────────────────────────────────────
    twoFactor: {
      enabled: { type: Boolean, default: false },
      // Ephemeral OTP for the verify flow (cleared after use or expiry)
      otp: { type: String, default: null, select: false },
      otpExpires: { type: Date, default: null, select: false },
    },

    // ── Email Change (OTP-verified) ──────────────────────────────────────────
    emailChange: {
      newEmail: { type: String, default: null, select: false },
      otp: { type: String, default: null, select: false },
      otpExpires: { type: Date, default: null, select: false },
    },

    // ── Preferences (Future-ready stubs) ─────────────────────────────────────
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSettings', userSettingsSchema);
