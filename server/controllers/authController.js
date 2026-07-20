const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateResetToken,
  cookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} = require('../services/tokenService');
const config = require('../config/env');
const { DASHBOARD_ROLES } = require('../config/constants/roles');

/** Helper: issue token pair and persist hashed refresh token against the user. */
async function issueTokens(user, res, rememberMe = true) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokens = [...(user.refreshTokens || []), hashToken(refreshToken)];
  user.lastLoginAt = new Date();
  await user.save();

  const accessTtl = msToSeconds(parseExpiry(config.jwt.accessExpires));
  const refreshTtl = msToSeconds(parseExpiry(config.jwt.refreshExpires));

  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(accessTtl, rememberMe));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshTtl, rememberMe));

  return { accessToken, refreshToken };
}

function parseExpiry(exp) {
  if (typeof exp === 'number') return exp; // seconds already
  const m = String(exp).match(/^(\d+)([smhd])$/);
  if (!m) return 900; // default 15m
  const n = Number(m[1]);
  return { s: 1, m: 60, h: 3600, d: 86400 }[m[2]] * n;
}
const msToSeconds = (s) => s;

function clearCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
}

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = true } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid email or password.');

  const match = await user.comparePassword(password.trim());
  if (!match) throw new ApiError(401, 'Invalid email or password.');

  if (!DASHBOARD_ROLES.includes(user.role)) {
    throw new ApiError(403, 'You do not have access to this application.');
  }

  await issueTokens(user, res, rememberMe);

  auditService.record({
    user: user._id,
    userEmail: user.email,
    action: 'LOGIN',
    module: 'auth',
    summary: `${user.name} signed in`,
    ip: req.ip,
    userAgent: req.get('user-agent') || '',
  });

  notificationService.push({
    user: user._id,
    type: 'auth',
    title: 'Welcome back',
    body: `Signed in from ${req.ip}`,
  });

  // If this is a first-login employee, signal the frontend to redirect to /change-password.
  if (user.mustChangePassword) {
    return ApiResponse.ok(res, 'Login successful. Please change your password.', {
      user: user.toJSON(),
      mustChangePassword: true,
    });
  }

  return ApiResponse.ok(res, 'Login successful', { user: user.toJSON() });
});

/** POST /api/auth/logout */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken && req.user) {
    req.user.refreshTokens = (req.user.refreshTokens || []).filter(
      (t) => t !== hashToken(refreshToken)
    );
    await req.user.save();
  }
  if (req.user) {
    auditService.record({
      user: req.user._id,
      userEmail: req.user.email,
      action: 'LOGOUT',
      module: 'auth',
      summary: `${req.user.name} signed out`,
      ip: req.ip,
    });
  }
  clearCookies(res);
  return ApiResponse.ok(res, 'Logged out');
});

/** POST /api/auth/refresh — short-lived access token rotation using the refresh cookie. */
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) throw new ApiError(401, 'Refresh token missing.');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    clearCookies(res);
    throw new ApiError(401, 'Invalid refresh token. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || !user.isActive) throw new ApiError(401, 'Account unavailable.');

  const hashed = hashToken(refreshToken);
  if (!user.refreshTokens.includes(hashed)) {
    // Possible token reuse — invalidate all sessions for safety.
    user.refreshTokens = [];
    await user.save();
    clearCookies(res);
    throw new ApiError(401, 'Refresh token reuse detected. Please sign in again.');
  }

  // Rotate: drop the used token, issue a fresh pair.
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  await user.save();
  await issueTokens(user, res);

  return ApiResponse.ok(res, 'Token refreshed', { user: user.toJSON() });
});

/** GET /api/auth/me */
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, 'Current user', { user: req.user.toJSON() });
});

/** POST /api/auth/forgot-password — issues a reset token and sends email. */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Do not leak which emails exist.
    return ApiResponse.ok(res, 'If that account exists, a reset link has been sent.');
  }
  const { raw, hashed, expires } = generateResetToken();
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = new Date(expires);
  await user.save();

  let emailPreviewUrl = null;
  try {
    const emailResult = await emailService.sendPasswordResetEmail(user, raw);
    emailPreviewUrl = emailResult?.previewUrl || null;
  } catch (error) {
    // Revert token if email fails
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    auditService.record({
      user: user._id,
      userEmail: user.email,
      action: 'PASSWORD_RESET_FAILED',
      module: 'auth',
      summary: 'Password reset email failed to send',
      ip: req.ip,
    });
    
    throw new ApiError(500, 'Failed to send password reset email. Please try again later.');
  }

  auditService.record({
    user: user._id,
    userEmail: user.email,
    action: 'PASSWORD_RESET_REQUESTED',
    module: 'auth',
    summary: 'Password reset requested',
    ip: req.ip,
  });

  const devHint = config.isDev ? { resetToken: raw, ...(emailPreviewUrl && { emailPreviewUrl }) } : {};
  return ApiResponse.ok(res, 'If that account exists, a reset link has been sent.', devHint);
});

/** POST /api/auth/reset-password */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');
  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired.');

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshTokens = []; // force re-login everywhere
  await user.save();

  auditService.record({
    user: user._id,
    userEmail: user.email,
    action: 'PASSWORD_RESET',
    module: 'auth',
    summary: 'Password reset completed',
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Password reset successful. Please sign in.');
});

/** POST /api/auth/change-password — for an authenticated user. */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ApiError(400, 'Current password is incorrect.');

  user.password = password;
  user.refreshTokens = [];
  user.mustChangePassword = false; // clear the first-login flag
  await user.save();
  clearCookies(res);

  auditService.record({
    user: user._id,
    userEmail: user.email,
    action: 'PASSWORD_CHANGED',
    module: 'auth',
    summary: 'Password changed',
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Password changed. Please sign in again.');
});

module.exports = {
  login,
  logout,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
