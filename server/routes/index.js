const express = require('express');
const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({ success: true, message: 'Classic Express ERP API is live' });
});

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/leave', require('./leaveRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/grievances', require('./grievanceRoutes'));
router.use('/shipments', require('./shipmentRoutes'));
router.use('/settings', require('./settingsRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/productivity', require('./productivityRoutes'));

module.exports = router;
