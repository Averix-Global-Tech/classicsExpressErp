/**
 * emailService.js
 * Nodemailer-based email service for Classic Express ERP.
 *
 * - In development (SMTP_USER empty): auto-creates an Ethereal test account and
 *   prints a preview URL to the console so you can inspect emails without a
 *   real mail server.
 * - In production: reads SMTP credentials from environment via config/env.js.
 *
 * SECURITY: Never log plain-text passwords here.
 */
const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');
const { welcomeEmailHtml, welcomeEmailText, resetPasswordHtml, resetPasswordText } = require('./emailTemplates');

let _transporter = null;
let _etherealAccount = null; // cached for dev mode

/**
 * Build (and cache) the Nodemailer transporter.
 * Falls back to Ethereal auto-account when SMTP credentials are absent.
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  const { host, port, secure, user, pass, from } = config.smtp;

  if (!user || !pass) {
    if (config.isProd) {
      throw new Error(
        'SMTP not configured: set SMTP_HOST, SMTP_USER, SMTP_PASS (and SMTP_PORT/SMTP_SECURE) ' +
        'in the production environment. Refusing to fall back to the Ethereal test service in production.'
      );
    }
    // ── Development fallback: Ethereal fake SMTP ─────────────────────────────
    if (!_etherealAccount) {
      _etherealAccount = await nodemailer.createTestAccount();
      logger.warn(
        '[EmailService] No SMTP credentials configured — using Ethereal test account. ' +
        `User: ${_etherealAccount.user}`
      );
    }
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: _etherealAccount.user, pass: _etherealAccount.pass },
    });
    return _transporter;
  }

  // ── Production SMTP ─────────────────────────────────────────────────────────
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: config.isProd },
    // Bound the SMTP handshake so a slow/blocked connection fails fast
    // instead of hanging past the frontend's request timeout.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    // Force IPv4 — the hosting network has no IPv6 route, and Gmail's SMTP
    // host resolves to an IPv6 address by default, causing ENETUNREACH.
    family: 4,
  });

  return _transporter;
}

/**
 * Check whether real SMTP credentials are configured.
 * Used by the controller to decide how to phrase the response message.
 */
function isConfigured() {
  return !!(config.smtp.user && config.smtp.pass);
}

/**
 * Internal helper — sends a message and returns { messageId, previewUrl }.
 * @param {object} mailOptions  - nodemailer mail options
 * @returns {Promise<{ messageId: string, previewUrl: string|null }>}
 */
async function _send(mailOptions) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail(mailOptions);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info(`[EmailService] Preview URL: ${previewUrl}`);
  }

  return { messageId: info.messageId, previewUrl: previewUrl || null };
}

/**
 * Send the initial Welcome Email to a newly created employee.
 *
 * @param {object} employee - user document (mongoose object or plain obj)
 * @param {string} plainPassword - the un-hashed temporary password
 * @returns {Promise<{ messageId: string, previewUrl: string|null }>}
 */
async function sendWelcomeEmail(employee, plainPassword) {
  const loginUrl = `${config.appUrl}/login`;

  const html = welcomeEmailHtml({
    name: employee.name,
    employeeId: employee.employeeId || 'N/A',
    role: employee.role,
    department: employee.department,
    designation: employee.designation,
    email: employee.email,
    password: plainPassword,
    loginUrl,
  });

  const text = welcomeEmailText({
    name: employee.name,
    employeeId: employee.employeeId || 'N/A',
    role: employee.role,
    department: employee.department,
    email: employee.email,
    password: plainPassword,
    loginUrl,
  });

  return _send({
    from: config.smtp.from || '"Classic Express ERP" <noreply@classicexpress.com>',
    to: `"${employee.name}" <${employee.email}>`,
    subject: 'Welcome to Classic Express ERP — Your Login Credentials',
    text,
    html,
  });
}

/**
 * Send a 6-digit OTP to verify ownership of an email address (used by the
 * "change email" flow — the OTP goes to the NEW address, not the current one).
 *
 * @param {string} toEmail
 * @param {string} name
 * @param {string} otp
 */
async function sendOtpEmail(toEmail, name, otp) {
  const text = `Hi ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.\n\n— Classic Express ERP`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
      <p>Hi ${name},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#2563eb;">${otp}</p>
      <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  return _send({
    from: config.smtp.from || '"Classic Express ERP" <noreply@classicexpress.com>',
    to: `"${name}" <${toEmail}>`,
    subject: 'Your Classic Express ERP verification code',
    text,
    html,
  });
}

/**
 * Resend welcome email with a freshly generated temporary password.
 * Identical template; caller is responsible for updating the DB hash first.
 *
 * @param {object} employee
 * @param {string} newPlainPassword
 */
async function resendWelcomeEmail(employee, newPlainPassword) {
  return sendWelcomeEmail(employee, newPlainPassword);
}

/**
 * Send the Password Reset Email.
 *
 * @param {object} user - user document
 * @param {string} rawToken - the un-hashed token
 * @returns {Promise<{ messageId: string, previewUrl: string|null }>}
 */
async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${config.appUrl}/reset-password?token=${rawToken}`;

  const html = resetPasswordHtml({
    name: user.name,
    resetUrl,
  });

  const text = resetPasswordText({
    name: user.name,
    resetUrl,
  });

  return _send({
    from: config.smtp.from || '"Classic Express ERP" <noreply@classicexpress.com>',
    to: `"${user.name}" <${user.email}>`,
    subject: 'Reset Your Classic Express ERP Password',
    text,
    html,
  });
}

module.exports = { sendWelcomeEmail, resendWelcomeEmail, sendOtpEmail, sendPasswordResetEmail, isConfigured };
