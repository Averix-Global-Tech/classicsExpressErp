/**
 * employeeRoutes.js
 * All routes are protected: authenticated + admin/HR roles only.
 */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { employeeCreateLimiter } = require('../middleware/rateLimit');
const { ROLES } = require('../config/constants/roles');
const {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deactivateEmployee,
  resendWelcomeEmail,
} = require('../controllers/employeeController');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// ── Validation chains ─────────────────────────────────────────────────────────
const VALID_ROLES = [
  ROLES.EMPLOYEE, ROLES.HR_MANAGER, ROLES.BRANCH_MANAGER,
  ROLES.ACCOUNTANT, ROLES.DISPATCHER, ROLES.CUSTOMER_SERVICE,
];
const VALID_EMPLOYMENT_TYPES = ['permanent', 'probation', 'contract', 'intern'];

const createEmployeeValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email address is required.'),
  body('phone')
    .trim()
    .matches(/^[+]?[\d\s()-]{6,20}$/)
    .withMessage('Phone must be 6–20 digits.'),
  body('role')
    .isIn(VALID_ROLES)
    .withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  body('department').trim().isLength({ min: 1, max: 80 }).withMessage('Department is required.'),
  body('designation').trim().isLength({ min: 1, max: 80 }).withMessage('Designation is required.'),
  body('employmentType')
    .isIn(VALID_EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`),
  body('joiningDate').isISO8601().withMessage('Joining date must be a valid date (YYYY-MM-DD).'),
  body('branch').optional({ nullable: true }).isMongoId().withMessage('Invalid branch ID.'),
  body('reportingManager')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Invalid reporting manager ID.'),
];

const updateEmployeeValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().trim().matches(/^[+]?[\d\s()-]{6,20}$/),
  body('department').optional().trim().isLength({ min: 1, max: 80 }),
  body('designation').optional().trim().isLength({ min: 1, max: 80 }),
  body('employmentType').optional().isIn(VALID_EMPLOYMENT_TYPES),
  body('joiningDate').optional().isISO8601(),
  body('role').optional().isIn(VALID_ROLES),
  body('isActive').optional().isBoolean(),
  body('branch').optional({ nullable: true }).isMongoId(),
  body('reportingManager').optional({ nullable: true }).isMongoId(),
];

// ── Routes ────────────────────────────────────────────────────────────────────

// List & create — only system_admin, admin, or hr_manager
router
  .route('/')
  .get(requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER), listEmployees)
  .post(
    requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER),
    employeeCreateLimiter,
    createEmployeeValidator,
    validate,
    createEmployee
  );

// Single employee operations
router
  .route('/:id')
  .get(requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER), getEmployee)
  .patch(
    requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER),
    updateEmployeeValidator,
    validate,
    updateEmployee
  )
  .delete(requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN), deactivateEmployee);

// Resend welcome email
router.post(
  '/:id/resend-email',
  requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER),
  resendWelcomeEmail
);

module.exports = router;
