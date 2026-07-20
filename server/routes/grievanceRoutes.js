const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const grievanceController = require('../controllers/grievanceController');
const { ROLES } = require('../config/constants/roles');

const router = express.Router();

// Configure multer for local file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Default 10MB limit
});

// Require Auth for all routes
router.use(authenticate);

// ─── Shared Routes ───────────────────────────────────────────────────────────
router.get('/config/settings', grievanceController.getGrievanceSettings);
router.get('/dashboard', grievanceController.getDashboardStats);
router.get('/my', grievanceController.getMyGrievances);
router.post('/', upload.array('attachments', 5), grievanceController.createGrievance);
router.get('/:id', grievanceController.getGrievanceDetails);
router.post('/:id/reply', upload.array('attachments', 5), grievanceController.addReply);
router.patch('/:id/feedback', grievanceController.submitFeedback);

// ─── Admin Routes ───────────────────────────────────────────────────────────
const requireAdmin = requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN);

router.get('/', requireAdmin, grievanceController.getAllGrievances);
router.patch('/:id/status', requireAdmin, grievanceController.updateStatus);
router.patch('/:id/assign', requireAdmin, grievanceController.assignGrievance);

router.put('/config/settings', requireAdmin, grievanceController.updateGrievanceSettings);

module.exports = router;
