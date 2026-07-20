const express = require('express');
const { leaveValidator } = require('../validators/leaveValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/constants/roles');
const leaveController = require('../controllers/leaveController');

const router = express.Router();

router.use(authenticate);

// Leave types
router.get('/types', leaveController.listLeaveTypes);
router.post(
  '/types',
  requireRole(ROLES.SYSTEM_ADMIN),
  leaveValidator.createLeaveType,
  validate,
  leaveController.createLeaveType
);
router.patch(
  '/types/:id',
  requireRole(ROLES.SYSTEM_ADMIN),
  leaveValidator.updateLeaveType,
  validate,
  leaveController.updateLeaveType
);
router.delete('/types/:id', requireRole(ROLES.SYSTEM_ADMIN), leaveController.deleteLeaveType);

// Applications
router.post('/applications', leaveValidator.applyLeave, validate, leaveController.applyLeave);
router.get('/applications/mine', leaveController.listMyLeaves);
router.get(
  '/applications',
  requireRole(ROLES.SYSTEM_ADMIN),
  leaveValidator.listApplications,
  validate,
  leaveController.listLeaveApplications
);
router.get('/applications/:id', leaveController.getLeaveApplication);
router.patch(
  '/applications/:id/review',
  requireRole(ROLES.SYSTEM_ADMIN),
  leaveValidator.reviewLeave,
  validate,
  leaveController.reviewLeave
);
router.patch('/applications/:id/cancel', leaveController.cancelLeave);

// Balance, calendar, reports
router.get('/balance', leaveController.myBalance);
router.get('/calendar', leaveValidator.calendarRange, validate, leaveController.leaveCalendar);
router.get('/reports', requireRole(ROLES.SYSTEM_ADMIN), leaveController.leaveReport);

module.exports = router;
