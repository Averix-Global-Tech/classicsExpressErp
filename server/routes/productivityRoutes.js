const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/constants/roles');

const {
  getMyAwbEntries,
  createAwbEntry,
  updateAwbEntry,
  deleteAwbEntry,
  getMyEmailResolutions,
  createEmailResolution,
  updateEmailResolution,
  deleteEmailResolution,
  getMyStats,
  getAdminProductivityList,
  getAdminEmployeeProductivityDetail
} = require('../controllers/productivityController');

const router = express.Router();

// All productivity routes require authentication
router.use(authenticate);

// --- Employee Routes (My Productivity) ---
router.get('/my/awb', getMyAwbEntries);
router.post('/my/awb', createAwbEntry);
router.patch('/my/awb/:id', updateAwbEntry);
router.delete('/my/awb/:id', deleteAwbEntry);

router.get('/my/email', getMyEmailResolutions);
router.post('/my/email', createEmailResolution);
router.patch('/my/email/:id', updateEmailResolution);
router.delete('/my/email/:id', deleteEmailResolution);

router.get('/my/stats', getMyStats);

// --- Admin Routes (Employee Productivity) ---
const adminRoles = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN];

router.get('/admin', requireRole(...adminRoles), getAdminProductivityList);
router.get('/admin/:id', requireRole(...adminRoles), getAdminEmployeeProductivityDetail);

module.exports = router;
