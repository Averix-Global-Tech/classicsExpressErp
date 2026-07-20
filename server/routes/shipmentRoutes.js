const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const shipmentController = require('../controllers/shipmentController');
const { ROLES } = require('../config/constants/roles');

const router = express.Router();

router.use(authenticate);
router.use(shipmentController.logRequest);

// Operators — the roles that actually book shipments and update tracking status.
const requireOperator = requireRole(
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN,
  ROLES.BRANCH_MANAGER,
  ROLES.DISPATCHER,
  ROLES.CUSTOMER_SERVICE,
  ROLES.EMPLOYEE
);

// ─── Shared (read) routes — visible to any authenticated role ────────────────
router.get('/dashboard', shipmentController.getDashboardStats);
router.get('/reports', shipmentController.getReports);
router.get('/', shipmentController.getAllShipments);
router.get('/awb/:awbNumber', shipmentController.getShipmentByAwb);
router.get('/:id', shipmentController.getShipmentDetails);

// ─── Operator routes ──────────────────────────────────────────────────────────
router.post('/', requireOperator, shipmentController.createShipment);
router.put('/:id', requireOperator, shipmentController.updateShipment);
router.patch('/:id/status', requireOperator, shipmentController.updateStatus);
router.delete('/:id', requireRole(ROLES.SYSTEM_ADMIN, ROLES.ADMIN), shipmentController.deleteShipment);

module.exports = router;
