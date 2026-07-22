const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Attendance = require('../models/Attendance');
const AwbEntry = require('../models/AwbEntry');
const EmailResolution = require('../models/EmailResolution');
const Grievance = require('../models/Grievance');
const LeaveApplication = require('../models/LeaveApplication');
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

const OPEN_GRIEVANCE_STATUSES = [
  'Submitted',
  'Pending Review',
  'Assigned',
  'In Progress',
  'Waiting for Employee',
  'Reopened',
  'Escalated',
];

/**
 * GET /api/dashboard/summary
 *
 * Returns all data needed by the System Administrator dashboard in a single
 * request using parallel Promise.all queries. Sections:
 *   - Employee stats
 *   - Today's attendance breakdown
 *   - Today's shipment counts
 *   - Today's productivity (AWBs + emails)
 *   - 30-day shipment trend
 *   - Top 5 employees by productivity
 *   - Last 5 shipments today
 *   - Activity feed (audit log)
 *   - Pending counts (leave / grievances / attendance approvals)
 *   - Recent notifications
 */
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

  // ── All queries fire in parallel ──────────────────────────────────────────
  const [
    // Employee stats
    totalEmployees,
    activeEmployees,
    inactiveEmployees,

    // Today's attendance
    presentToday,
    absentToday,
    lateToday,
    leaveToday,

    // Today's shipments
    bookedToday,
    inTransitNow,
    deliveredToday,

    // Today's productivity totals
    awbsToday,
    emailsToday,

    // Pending counts
    pendingLeaveRequests,
    openGrievances,
    pendingAttendanceApprovals,

    // Employees online (proxy: lastLoginAt within 8 hours)
    employeesOnline,

    // Notifications
    notifications,
    unread,

    // Activity feed
    recentActivity,

    // Recent shipments today (last 5)
    recentShipments,

    // Top 5 employees by AWBs (aggregated)
    topByAwb,

    // Top 5 employees by emails (aggregated)
    topByEmail,

    // 30-day shipment trend
    shipmentTrend,
  ] = await Promise.all([
    // Employee stats
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),

    // Today's attendance by status
    Attendance.countDocuments({ date: { $gte: startOfToday }, status: 'Present' }),
    Attendance.countDocuments({ date: { $gte: startOfToday }, status: 'Absent' }),
    Attendance.countDocuments({ date: { $gte: startOfToday }, status: 'Late' }),
    Attendance.countDocuments({ date: { $gte: startOfToday }, status: 'Leave' }),

    // Today's shipments
    Shipment.countDocuments({ createdAt: { $gte: startOfToday } }),
    Shipment.countDocuments({ status: { $in: IN_TRANSIT_STATUSES } }),
    Shipment.countDocuments({ deliveredAt: { $gte: startOfToday } }),

    // Today's productivity
    AwbEntry.countDocuments({ processingDate: { $gte: startOfToday } }),
    EmailResolution.countDocuments({ resolutionDate: { $gte: startOfToday } }),

    // Pending counts
    LeaveApplication.countDocuments({ status: 'Pending' }),
    Grievance.countDocuments({ status: { $in: OPEN_GRIEVANCE_STATUSES } }),
    Attendance.countDocuments({ approvalStatus: 'Pending Check-Out' }),

    // Employees online
    User.countDocuments({ isActive: true, lastLoginAt: { $gte: eightHoursAgo } }),

    // Notifications
    notificationService.listFor(req.user._id, { limit: 10 }),
    notificationService.unreadCount(req.user._id),

    // Activity feed
    auditService.recentActivity(10),

    // Last 5 shipments today
    Shipment.find({ createdAt: { $gte: startOfToday } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('bookedBy', 'name department')
      .select('awbNumber sender receiver destinationCountry status createdAt bookedBy')
      .lean(),

    // Top 5 employees by AWBs processed today
    AwbEntry.aggregate([
      { $match: { processingDate: { $gte: startOfToday } } },
      { $group: { _id: '$employee', awbs: { $sum: 1 } } },
      { $sort: { awbs: -1 } },
      { $limit: 5 },
    ]),

    // Top 5 employees by emails resolved today
    EmailResolution.aggregate([
      { $match: { resolutionDate: { $gte: startOfToday } } },
      { $group: { _id: '$employee', emails: { $sum: 1 } } },
      { $sort: { emails: -1 } },
      { $limit: 10 },
    ]),

    // 30-day shipment trend (booked per day)
    Shipment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          booked: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // ── Build top employees list ───────────────────────────────────────────────
  // Merge AWB and email maps, then fetch user details for top 5
  const awbMap = new Map(topByAwb.map((e) => [String(e._id), e.awbs]));
  const emailMap = new Map(topByEmail.map((e) => [String(e._id), e.emails]));

  // Collect all unique employee IDs from both aggregations
  const allEmpIds = [...new Set([...awbMap.keys(), ...emailMap.keys()])];

  let topEmployees = [];
  if (allEmpIds.length > 0) {
    const empUsers = await User.find({ _id: { $in: allEmpIds } })
      .select('name department designation employeeId')
      .lean();

    topEmployees = empUsers
      .map((u) => {
        const id = String(u._id);
        const awbs = awbMap.get(id) || 0;
        const emails = emailMap.get(id) || 0;
        const total = awbs + emails;
        // Productivity score: normalised % (max 100 for display; actual is ratio)
        const score = total > 0 ? Math.min(100, Math.round((total / Math.max(total + 5, 10)) * 100)) : 0;
        return {
          _id: id,
          name: u.name,
          department: u.department || u.designation || '—',
          employeeId: u.employeeId || '—',
          awbs,
          emails,
          score,
          total,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  // ── Build 30-day trend (fill missing days with 0) ─────────────────────────
  const trendMap = new Map(shipmentTrend.map((d) => [d._id, { booked: d.booked, delivered: d.delivered }]));
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const entry = trendMap.get(key) || { booked: 0, delivered: 0 };
    trend.push({ date: label, key, booked: entry.booked, delivered: entry.delivered });
  }

  // ── Attendance % ──────────────────────────────────────────────────────────
  const totalMarked = presentToday + absentToday + lateToday + leaveToday;
  const attendancePct = totalMarked > 0
    ? Math.round(((presentToday + lateToday) / totalMarked) * 100)
    : 0;

  // ── Final response ────────────────────────────────────────────────────────
  const summary = {
    stats: {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
      },
      attendance: {
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        leave: leaveToday,
        total: totalMarked,
        pct: attendancePct,
      },
      shipments: {
        booked: bookedToday,
        inTransit: inTransitNow,
        delivered: deliveredToday,
      },
      productivity: {
        awbs: awbsToday,
        emails: emailsToday,
      },
    },
    trend,
    topEmployees,
    recentShipments,
    activityFeed: recentActivity,
    pendingCounts: {
      leaveRequests: pendingLeaveRequests,
      grievances: openGrievances,
      attendanceApprovals: pendingAttendanceApprovals,
      employeesOnline: employeesOnline,
    },
    notifications: { items: notifications, unreadCount: unread },
  };

  return ApiResponse.ok(res, 'Dashboard summary', summary);
});

module.exports = { getSummary };
