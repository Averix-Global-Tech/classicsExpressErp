/**
 * Centralised environment access. Import config from here everywhere — never read
 * process.env directly outside this file, so defaults/typing live in one place.
 */
require('dotenv').config();

const env = (key, fallback = '') => (process.env[key] ?? fallback);
const num = (key, fallback) => {
  const v = Number(process.env[key]);
  return Number.isFinite(v) ? v : fallback;
};
const bool = (key, fallback = false) => {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1' || v === 'yes';
};

const isProd = env('NODE_ENV', 'development') === 'production';

module.exports = {
  env: env('NODE_ENV', 'development'),
  isProd,
  isDev: !isProd,
  port: num('PORT', 5000),

  // CORS — allow comma-separated origins.
  clientUrls: env('CLIENT_URL', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Database — in development always use local MongoDB to avoid SRV/DNS
  // issues with cloud Atlas URIs on some networks. Only production reads
  // MONGODB_URI from the environment, and fails fast if it's missing rather
  // than silently trying an unreachable localhost URI.
  mongoUri: (() => {
    if (!isProd) return 'mongodb://127.0.0.1:27017/classic_express_erp';
    const uri = env('MONGODB_URI');
    if (!uri) {
      throw new Error('MONGODB_URI environment variable must be set when NODE_ENV=production');
    }
    return uri;
  })(),

  // JWT
  jwt: {
    accessSecret: env('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
    refreshSecret: env('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
    accessExpires: env('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: env('JWT_REFRESH_EXPIRES', '7d'),
  },

  // Cookies
  secureCookies: bool('SECURE_COOKIES', !isProd ? false : true),

  // Seed admin
  seed: {
    name: env('SEED_ADMIN_NAME', 'System Administrator'),
    email: env('SEED_ADMIN_EMAIL', 'admin@classicexpress.com'),
    password: env('SEED_ADMIN_PASSWORD', 'Admin@Classic2025'),
    phone: env('SEED_ADMIN_PHONE', '+919000000000'),
  },

  // Cloudinary
  cloudinary: {
    cloudName: env('CLOUDINARY_CLOUD_NAME'),
    apiKey: env('CLOUDINARY_API_KEY'),
    apiSecret: env('CLOUDINARY_API_SECRET'),
  },

  // SMTP / Nodemailer — used by emailService
  smtp: {
    host: env('SMTP_HOST', 'smtp.ethereal.email'),
    port: num('SMTP_PORT', 587),
    secure: bool('SMTP_SECURE', false), // true for port 465
    user: env('SMTP_USER', ''),
    pass: env('SMTP_PASS', ''),
    from: env('SMTP_FROM', '"Classic Express ERP" <noreply@classicexpress.com>'),
  },

  // Public-facing ERP URL (used in email links)
  appUrl: env('APP_URL', 'http://localhost:5173'),
};
