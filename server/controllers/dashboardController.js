const User = require('../models/User');
const Shipment = require('../models/Shipment');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');

const IN_TRANSIT_STATUSES = [
  'Picked Up',
  'At Origin Hub',
  'Export Customs',
  'In Transit',
  'Arrived Destination Country',
  'Out For Delivery',
];

/**
 * GET /api/dashboard/summary
 *
 * Returns real counts for modules that exist in Phase 1 (users/admins) and
 * zero-defaulted placeholders for modules landing in Phases 2–5. This keeps the
 * dashboard UI honest — tiles are present but show 0 until their data lands.
 */
const getSummary = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    systemAdmins,
    admins,
    recentActivity,
    notifications,
    unread,
    activeShipments,
    deliveredShipments,
    pendingDeliveries,
    todaysPickup,
    todaysDelivery,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'system_admin', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    auditService.recentActivity(8),
    notificationService.listFor(req.user._id, { limit: 8 }),
    notificationService.unreadCount(req.user._id),
    Shipment.countDocuments({ status: { $in: IN_TRANSIT_STATUSES } }),
    Shipment.countDocuments({ status: 'Delivered' }),
    Shipment.countDocuments({ status: { $nin: ['Delivered', 'Returned', 'Cancelled', 'Lost'] } }),
    Shipment.countDocuments({ status: 'Pickup Scheduled', createdAt: { $gte: startOfToday } }),
    Shipment.countDocuments({ deliveredAt: { $gte: startOfToday } }),
  ]);

  const summary = {
    stats: {
      totalEmployees: 0, // Phase 2 (Employee model)
      presentEmployees: 0, // Phase 2 (Attendance)
      totalCustomers: 0, // Phase 3
      activeShipments,
      deliveredShipments,
      pendingDeliveries,
      revenue: 0, // Phase 4 (Finance)
      expenses: 0, // Phase 4 (Finance)
      todaysPickup,
      todaysDelivery,
      // Phase-1 real metrics:
      totalUsers,
      activeUsers,
      systemAdmins,
      admins,
    },
    charts: {
      // 6-month placeholder series so the chart renders with structure.
      // Replaced by real revenue aggregations once Finance lands.
      monthly: buildMonthlySeries(),
    },
    recentActivity,
    notifications: { items: notifications, unreadCount: unread },
  };

  return ApiResponse.ok(res, 'Dashboard summary', summary);
});

function buildMonthlySeries() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      month: months[d.getMonth()],
      revenue: 0,
      expenses: 0,
      shipments: 0,
      delivered: 0,
    });
  }
  return out;
}

module.exports = { getSummary };
