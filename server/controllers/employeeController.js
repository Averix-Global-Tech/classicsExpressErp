/**
 * employeeController.js
 * Handles the full Employee Creation workflow per MVC / service-layer pattern.
 *
 * POST   /api/employees              → createEmployee
 * GET    /api/employees              → listEmployees
 * GET    /api/employees/:id          → getEmployee
 * PATCH  /api/employees/:id          → updateEmployee
 * DELETE /api/employees/:id          → deactivateEmployee
 * POST   /api/employees/:id/resend-email → resendWelcomeEmail
 */
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const { generateSecurePassword, generateEmployeeId } = require('../services/passwordService');
const emailService = require('../services/emailService');
const { ROLES, EMPLOYEE_ROLES } = require('../config/constants/roles');
const logger = require('../utils/logger');
const config = require('../config/env');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate the next sequential employee ID (CX-YYYY-NNNN).
 * Count only users that already have an employeeId assigned.
 */
async function nextEmployeeId() {
  const count = await User.countDocuments({ employeeId: { $ne: null } });
  return generateEmployeeId(count + 1);
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/employees
 * Full workflow: validate → check duplicates → generate ID & password
 * → create user → send welcome email → respond.
 */
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    role = ROLES.EMPLOYEE,
    department,
    designation,
    branch,
    reportingManager,
    joiningDate,
    employmentType,
  } = req.body;

  // 1. Validate role is an employee role (not admin/system_admin)
  if (!EMPLOYEE_ROLES.includes(role)) {
    throw new ApiError(400, `Role "${role}" is not a valid employee role.`);
  }

  // 2. Check duplicate email
  const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
  if (emailExists) throw new ApiError(409, 'An account with this email already exists.');

  // 3. Clean and validate phone number
  let cleanPhone = '';
  if (phone && phone.trim()) {
    cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone.slice(1).replace(/\+/g, '');
    } else {
      cleanPhone = cleanPhone.replace(/\+/g, '');
    }
    
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      throw new ApiError(400, 'Mobile number must contain between 10 and 15 digits.');
    }

    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) throw new ApiError(409, 'An account with this phone number already exists.');
  }

  // 4. Generate Employee ID
  const employeeId = await nextEmployeeId();

  // 5. Generate secure plain-text password (NEVER logged)
  const plainPassword = generateSecurePassword();

  // 6. Create employee — password is hashed by the User pre-save hook
  const employee = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: plainPassword,      // hashed by pre-save hook
    phone: cleanPhone,
    role,
    employeeId,
    department: department?.trim() || '',
    designation: designation?.trim() || '',
    branch: branch || null,
    reportingManager: reportingManager || null,
    joiningDate: joiningDate ? new Date(joiningDate) : null,
    employmentType: employmentType || '',
    mustChangePassword: true,     // force password change on first login
    isActive: true,
  });

  // 7. Send welcome email (fire-and-forget — employee is still created on failure)
  let emailSent = false;
  let emailPreviewUrl = null;
  let emailError = null;
  try {
    const emailResult = await emailService.sendWelcomeEmail(employee, plainPassword);
    emailSent = true;
    emailPreviewUrl = emailResult?.previewUrl || null; // Ethereal URL — dev only
  } catch (err) {
    emailError = err.message || 'Unknown email error';
    logger.error(`[EmployeeCreate] Welcome email failed for ${employee.email}: ${emailError}`);
  }

  // 8. Audit log
  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'EMPLOYEE_CREATED',
    module: 'employee',
    entity: 'User',
    entityId: employee._id,
    summary: `Created employee ${employee.name} (${employee.employeeId}) — ${employee.role}`,
    ip: req.ip,
  });

  // 9. Respond — include emailSent flag so the frontend can surface a resend CTA
  const message = emailSent
    ? 'Employee created successfully. Welcome email has been sent.'
    : 'Employee created successfully, but the welcome email could not be delivered.';

  return ApiResponse.created(res, message, {
    employee: employee.toJSON(),
    employeeId: employee.employeeId,
    emailSent,
    // In dev mode, expose the Ethereal preview URL so admin can view the email & see the exact password.
    ...(config.isDev && emailPreviewUrl ? { emailPreviewUrl } : {}),
  });
});

/** GET /api/employees — paginated list with search + filters */
const listEmployees = asyncHandler(async (req, res) => {
  const { search = '', role, department, isActive } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = { employeeId: { $ne: null } }; // only actual employees

  if (role) q.role = role;
  if (department) q.department = { $regex: department, $options: 'i' };
  if (isActive !== undefined && isActive !== '') q.isActive = isActive === 'true';

  if (search.trim()) {
    q.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
      { employeeId: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reportingManager', 'name employeeId')
      .lean(),
    User.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Employees fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/employees/:id */
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id)
    .populate('reportingManager', 'name employeeId designation');
  if (!employee || !employee.employeeId) throw new ApiError(404, 'Employee not found.');
  return ApiResponse.ok(res, 'Employee fetched', { employee });
});

/** PATCH /api/employees/:id — update profile (not password) */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || !employee.employeeId) throw new ApiError(404, 'Employee not found.');

  const {
    name, phone, department, designation,
    branch, reportingManager, joiningDate, employmentType, isActive, role,
  } = req.body;

  if (name !== undefined) employee.name = name.trim();
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
    if (cleanPhone && cleanPhone !== employee.phone) {
      const phoneExists = await User.findOne({ phone: cleanPhone });
      if (phoneExists) throw new ApiError(409, 'An account with this phone number already exists.');
    }
    employee.phone = cleanPhone;
  }
  if (department !== undefined) employee.department = department.trim();
  if (designation !== undefined) employee.designation = designation.trim();
  if (branch !== undefined) employee.branch = branch || null;
  if (reportingManager !== undefined) employee.reportingManager = reportingManager || null;
  if (joiningDate !== undefined) employee.joiningDate = joiningDate ? new Date(joiningDate) : null;
  if (employmentType !== undefined) employee.employmentType = employmentType;
  if (isActive !== undefined) employee.isActive = isActive;
  if (role !== undefined && EMPLOYEE_ROLES.includes(role)) employee.role = role;

  await employee.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'EMPLOYEE_UPDATED',
    module: 'employee',
    entity: 'User',
    entityId: employee._id,
    summary: `Updated employee ${employee.name} (${employee.employeeId})`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Employee updated', { employee });
});

/** DELETE /api/employees/:id — soft deactivate */
const deactivateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || !employee.employeeId) throw new ApiError(404, 'Employee not found.');
  if (String(employee._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  employee.isActive = false;
  await employee.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'EMPLOYEE_DEACTIVATED',
    module: 'employee',
    entity: 'User',
    entityId: employee._id,
    summary: `Deactivated employee ${employee.name} (${employee.employeeId})`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Employee deactivated.');
});

/**
 * POST /api/employees/:id/resend-email
 * Generates a NEW temporary password, updates the hash, resets mustChangePassword,
 * and resends the welcome email.
 */
const resendWelcomeEmail = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id).select('+password');
  if (!employee || !employee.employeeId) throw new ApiError(404, 'Employee not found.');

  // Generate fresh password
  const newPlainPassword = generateSecurePassword();

  // Update — pre-save hook hashes it
  employee.password = newPlainPassword;
  employee.mustChangePassword = true;
  employee.refreshTokens = []; // invalidate existing sessions
  await employee.save();

  // Send email
  let emailSent = false;
  let emailPreviewUrl = null;
  try {
    const emailResult = await emailService.resendWelcomeEmail(employee, newPlainPassword);
    emailSent = true;
    emailPreviewUrl = emailResult?.previewUrl || null;
  } catch (err) {
    logger.error(`[ResendEmail] Failed for ${employee.email}: ${err.message}`);
  }

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'WELCOME_EMAIL_RESENT',
    module: 'employee',
    entity: 'User',
    entityId: employee._id,
    summary: `Resent welcome email to ${employee.name} (${employee.employeeId})`,
    ip: req.ip,
  });

  const message = emailSent
    ? 'Welcome email resent successfully.'
    : 'Password reset but email delivery failed. Please try again.';

  return ApiResponse.ok(res, message, {
    emailSent,
    ...(config.isDev && emailPreviewUrl ? { emailPreviewUrl } : {}),
  });
});

module.exports = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  resendWelcomeEmail,
};
