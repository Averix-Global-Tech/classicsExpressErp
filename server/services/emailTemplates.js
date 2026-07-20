/**
 * emailTemplates.js
 * Reusable HTML email templates for Classic Express ERP.
 * Returns full HTML strings — no template engine dependency needed.
 */

/**
 * Generate the professional Welcome Email HTML.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.employeeId
 * @param {string} params.role
 * @param {string} params.department
 * @param {string} params.designation
 * @param {string} params.email
 * @param {string} params.password  - plain-text temporary password
 * @param {string} params.loginUrl
 * @returns {string} full HTML email
 */
function welcomeEmailHtml({ name, employeeId, role, department, designation, email, password, loginUrl }) {
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Classic Express ERP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #334155; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    /* Header */
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 36px 40px 28px; text-align: center; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 14px; margin-bottom: 16px; }
    .logo-badge span { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -1px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
    .header p { font-size: 13px; color: rgba(255,255,255,0.75); }
    /* Body */
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 8px; }
    .greeting strong { color: #1d4ed8; }
    .intro { font-size: 14px; color: #64748b; line-height: 1.7; margin-bottom: 28px; }
    /* Credential Card */
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
    .card-header { background: #1e3a8a; padding: 12px 20px; }
    .card-header span { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: 0.5px; text-transform: uppercase; }
    .card-body { padding: 20px; }
    .credential-row { display: flex; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .credential-row:last-child { border-bottom: none; }
    .cred-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; width: 140px; min-width: 140px; padding-top: 2px; }
    .cred-value { font-size: 14px; color: #1e293b; font-weight: 500; flex: 1; word-break: break-all; }
    .cred-value.password-val { font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe; letter-spacing: 1px; }
    /* CTA Button */
    .cta-wrap { text-align: center; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #1d4ed8, #1e40af); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 32px; border-radius: 8px; }
    /* Security Notice */
    .security { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px; }
    .security-title { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .security ul { padding-left: 18px; }
    .security ul li { font-size: 13px; color: #78350f; line-height: 1.7; }
    /* Footer */
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.7; }
    .footer strong { color: #64748b; }
    .divider { height: 1px; background: #e2e8f0; margin: 0 40px; }
    @media (max-width: 480px) {
      .body, .header, .footer { padding-left: 20px; padding-right: 20px; }
      .credential-row { flex-direction: column; gap: 4px; }
      .cred-label { width: auto; }
      .divider { margin: 0 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="logo-badge"><span>CE</span></div>
      <h1>Welcome to Classic Express ERP</h1>
      <p>Your account has been successfully created</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Dear <strong>${name}</strong>,</p>
      <p class="intro">
        Welcome to <strong>Classic Express International Courier</strong>. We are delighted to have
        you as part of our team. Your ERP account has been successfully created and is ready to use.
        Please find your login credentials below.
      </p>

      <!-- Credential Card -->
      <div class="card">
        <div class="card-header"><span>&#128274;&nbsp; Your Login Credentials</span></div>
        <div class="card-body">
          <div class="credential-row">
            <span class="cred-label">Full Name</span>
            <span class="cred-value">${name}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Employee ID</span>
            <span class="cred-value">${employeeId}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Role</span>
            <span class="cred-value">${roleLabel}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Department</span>
            <span class="cred-value">${department || '—'}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Designation</span>
            <span class="cred-value">${designation || '—'}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Email (Login)</span>
            <span class="cred-value">${email}</span>
          </div>
          <div class="credential-row">
            <span class="cred-label">Temp Password</span>
            <span class="cred-value"><span class="password-val">${password}</span></span>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <a href="${loginUrl}" class="cta-btn">&#128279;&nbsp; Login to ERP System</a>
      </div>

      <!-- Security Notice -->
      <div class="security">
        <div class="security-title">&#9888;&#65039; Security Notice</div>
        <ul>
          <li>You <strong>must change your password</strong> immediately after your first login.</li>
          <li>Never share your password with anyone, including IT staff.</li>
          <li>This is a temporary password — it will be invalidated after you change it.</li>
          <li>If you experience any login issues, contact the IT Department.</li>
        </ul>
      </div>

      <p style="font-size:14px;color:#64748b;line-height:1.7;">
        We wish you a successful and rewarding journey with Classic Express International Courier.
        Should you have any questions, please reach out to your HR representative.
      </p>
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>Human Resources Department</strong><br />
        Classic Express International Courier<br />
        This is an automated message — please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Plain-text fallback for clients that don't render HTML.
 */
function welcomeEmailText({ name, employeeId, role, department, email, password, loginUrl }) {
  const roleLabel = role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `
Welcome to Classic Express ERP

Dear ${name},

Your ERP account has been successfully created.

---------------------------------------
Employee Name  : ${name}
Employee ID    : ${employeeId}
Role           : ${roleLabel}
Department     : ${department || 'N/A'}
Email          : ${email}
Temp Password  : ${password}
Login URL      : ${loginUrl}
---------------------------------------

IMPORTANT: Change your password immediately after your first login.
Never share your password with anyone.

Best Regards,
Human Resources
Classic Express International Courier
`.trim();
}

function resetPasswordHtml({ name, resetUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Classic Express ERP Password</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #334155; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 36px 40px 28px; text-align: center; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255,255,255,0.15); border-radius: 14px; margin-bottom: 16px; }
    .logo-badge span { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -1px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
    .header p { font-size: 13px; color: rgba(255,255,255,0.75); }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 8px; }
    .greeting strong { color: #1d4ed8; }
    .intro { font-size: 14px; color: #64748b; line-height: 1.7; margin-bottom: 28px; }
    .cta-wrap { text-align: center; margin-bottom: 28px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #1d4ed8, #1e40af); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 32px; border-radius: 8px; }
    .backup-link { font-size: 12px; color: #64748b; text-align: center; margin-bottom: 28px; line-height: 1.5; word-break: break-all; }
    .backup-link a { color: #1d4ed8; }
    .security { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin-bottom: 28px; }
    .security-title { font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .security ul { padding-left: 18px; }
    .security ul li { font-size: 13px; color: #78350f; line-height: 1.7; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.7; }
    .footer strong { color: #64748b; }
    .divider { height: 1px; background: #e2e8f0; margin: 0 40px; }
    @media (max-width: 480px) {
      .body, .header, .footer { padding-left: 20px; padding-right: 20px; }
      .divider { margin: 0 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge"><span>CE</span></div>
      <h1>Password Reset Request</h1>
      <p>Classic Express ERP</p>
    </div>
    <div class="body">
      <p class="greeting">Hello <strong>${name}</strong>,</p>
      <p class="intro">
        We received a request to reset your password for your Classic Express ERP account.
        Click the button below to set a new password. This link will expire in 30 minutes.
      </p>
      
      <div class="cta-wrap">
        <a href="${resetUrl}" class="cta-btn">&#128279;&nbsp; Reset My Password</a>
      </div>

      <div class="backup-link">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>

      <div class="security">
        <div class="security-title">&#9888;&#65039; Security Notice</div>
        <ul>
          <li>If you did not request a password reset, please ignore this email.</li>
          <li>Your password will remain unchanged unless you create a new one.</li>
          <li>Never share your password or reset link with anyone, including IT staff.</li>
        </ul>
      </div>

      <p style="font-size:14px;color:#64748b;line-height:1.7;">
        Thank you,<br/>Classic Express IT Support
      </p>
    </div>
    <div class="divider"></div>
    <div class="footer">
      <p>
        <strong>IT Support Department</strong><br />
        Classic Express International Courier<br />
        This is an automated message — please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function resetPasswordText({ name, resetUrl }) {
  return `
Password Reset Request - Classic Express ERP

Hello ${name},

We received a request to reset your password for your Classic Express ERP account.
Please copy and paste the following link into your browser to set a new password:

${resetUrl}

This link will expire in 30 minutes.

IMPORTANT SECURITY NOTICE:
If you did not request a password reset, please ignore this email.
Your password will remain unchanged unless you create a new one.
Never share your password or this reset link with anyone.

Best Regards,
IT Support Department
Classic Express International Courier
`.trim();
}

module.exports = { welcomeEmailHtml, welcomeEmailText, resetPasswordHtml, resetPasswordText };
