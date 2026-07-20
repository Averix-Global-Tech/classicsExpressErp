import api from './api';

/**
 * Settings API service — thin wrappers following the authService pattern.
 */
export const settingsService = {
  /** GET /api/settings — load current user profile + settings */
  async getSettings() {
    const { data } = await api.get('/settings');
    return data.data;
  },

  /** PATCH /api/settings/profile — update name, phone */
  async updateProfile(payload) {
    const { data } = await api.patch('/settings/profile', payload);
    return data.data;
  },

  /** POST /api/settings/email/request — verify password + send OTP to new email */
  async requestEmailChange(newEmail, password) {
    const { data } = await api.post('/settings/email/request', { newEmail, password });
    return data;
  },

  /** POST /api/settings/email/verify — verify OTP and commit the email change */
  async verifyEmailChange(otp) {
    const { data } = await api.post('/settings/email/verify', { otp });
    return data.data;
  },

  /** PATCH /api/settings/notifications — toggle notification prefs */
  async updateNotifications(prefs) {
    const { data } = await api.patch('/settings/notifications', prefs);
    return data.data;
  },

  /** PATCH /api/settings/preferences — theme/language/timezone stubs */
  async updatePreferences(prefs) {
    const { data } = await api.patch('/settings/preferences', prefs);
    return data.data;
  },

  /** POST /api/settings/2fa/request — generate & send OTP */
  async request2faOtp() {
    const { data } = await api.post('/settings/2fa/request');
    return data;
  },

  /** POST /api/settings/2fa/verify — verify OTP and enable 2FA */
  async verify2faOtp(otp) {
    const { data } = await api.post('/settings/2fa/verify', { otp });
    return data;
  },

  /** DELETE /api/settings/2fa — disable 2FA (requires password) */
  async disable2fa(password) {
    const { data } = await api.delete('/settings/2fa', { data: { password } });
    return data;
  },

  /** POST /api/settings/avatar — upload profile photo (Phase 4) */
  async uploadAvatar(formData) {
    const { data } = await api.post('/settings/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};

export default settingsService;
