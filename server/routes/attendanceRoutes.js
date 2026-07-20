const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const attendanceController = require('../controllers/attendanceController');
const { ROLES } = require('../config/constants/roles');

const router = express.Router();

// Require authentication for all attendance routes
router.use(authenticate);

// ─── Employee Routes ────────────────────────────────────────────────────────
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/my-attendance', attendanceController.getMyAttendance);

// ─── Admin Routes ───────────────────────────────────────────────────────────
// These require at least system admin access for now. (Future: manager support)
router.use(requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN));

router.get('/pending', attendanceController.getPendingApprovals);
router.get('/dashboard', attendanceController.getAdminDashboard);
router.get('/', attendanceController.listAllAttendance);

router.patch('/:id/approve-check-in', attendanceController.approveCheckIn);
router.patch('/:id/approve-check-out', attendanceController.approveCheckOut);
router.patch('/:id/reject', attendanceController.rejectRequest);
router.put('/:id/manual', attendanceController.manualUpdate);

router.get('/settings', attendanceController.getSettings);
router.put('/settings', attendanceController.updateSettings);

module.exports = router;
