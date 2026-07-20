const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

/** Sign a short-lived access token (carries identity + role). */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpires }
  );
}

/** Sign a refresh token (opaque identity only — no authorisation claims). */
function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

/** Hash refresh tokens before storing so a DB leak can't be replayed. */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Short-lived random hex used for the password-reset email link. */
function generateResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(raw);
  const expires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return { raw, hashed, expires };
}

const cookieOptions = (maxAgeSeconds, rememberMe = true) => {
  const opts = {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: config.secureCookies ? 'none' : 'lax',
    path: '/',
  };
  if (rememberMe) {
    opts.maxAge = maxAgeSeconds * 1000;
  }
  return opts;
};

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateResetToken,
  cookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
};
