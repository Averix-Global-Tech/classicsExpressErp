const { body, query } = require('express-validator');

const createLeaveType = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be 2–10 characters.'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('defaultDaysPerYear')
    .isFloat({ min: 0, max: 365 })
    .withMessage('Default days per year must be between 0 and 365.'),
  body('isPaid').optional().isBoolean(),
];

const updateLeaveType = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('code').optional().trim().isLength({ min: 2, max: 10 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('defaultDaysPerYear').optional().isFloat({ min: 0, max: 365 }),
  body('isPaid').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
];

const applyLeave = [
  body('leaveType').isMongoId().withMessage('A valid leave type is required.'),
  body('startDate').isISO8601().withMessage('A valid start date is required.'),
  body('endDate').isISO8601().withMessage('A valid end date is required.'),
  body('halfDay').optional().isBoolean(),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be 5–500 characters.'),
  body('attachment').optional().isString(),
];

const reviewLeave = [
  body('decision')
    .isIn(['approve', 'reject'])
    .withMessage('Decision must be "approve" or "reject".'),
  body('reviewComment').optional().trim().isLength({ max: 500 }),
];

const listApplications = [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'cancelled']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const calendarRange = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

module.exports = {
  leaveValidator: {
    createLeaveType,
    updateLeaveType,
    applyLeave,
    reviewLeave,
    listApplications,
    calendarRange,
  },
};
