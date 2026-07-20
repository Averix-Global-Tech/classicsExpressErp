const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const leaveService = require('../services/leaveService');
const { ROLES } = require('../config/constants/roles');
const { LEAVE_STATUS } = require('../config/constants/leave');

const isSystemAdmin = (user) => user.role === ROLES.SYSTEM_ADMIN;

/** GET /api/leave/types */
const listLeaveTypes = asyncHandler(async (req, res) => {
  const q = req.query.activeOnly === 'true' ? { isActive: true } : {};
  const types = await LeaveType.find(q).sort({ name: 1 });
  return ApiResponse.ok(res, 'Leave types fetched', { items: types });
});

/** POST /api/leave/types — system admin defines a new leave category. */
const createLeaveType = asyncHandler(async (req, res) => {
  const { name, code, description, defaultDaysPerYear, isPaid = true } = req.body;
  const exists = await LeaveType.findOne({
    $or: [{ name }, { code: code.toUpperCase() }],
  });
  if (exists) throw new ApiError(409, 'A leave type with that name or code already exists.');

  const leaveType = await LeaveType.create({ name, code, description, defaultDaysPerYear, isPaid });
  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'LEAVE_TYPE_CREATED',
    module: 'leave',
    entity: 'LeaveType',
    entityId: leaveType._id,
    summary: `Created leave type ${leaveType.name}`,
    ip: req.ip,
  });
  return ApiResponse.created(res, 'Leave type created', { leaveType });
});

/** PATCH /api/leave/types/:id */
const updateLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await LeaveType.findById(req.params.id);
  if (!leaveType) throw new ApiError(404, 'Leave type not found.');

  const { name, code, description, defaultDaysPerYear, isPaid, isActive } = req.body;
  if (name !== undefined) leaveType.name = name;
  if (code !== undefined) leaveType.code = code;
  if (description !== undefined) leaveType.description = description;
  if (defaultDaysPerYear !== undefined) leaveType.defaultDaysPerYear = defaultDaysPerYear;
  if (isPaid !== undefined) leaveType.isPaid = isPaid;
  if (isActive !== undefined) leaveType.isActive = isActive;
  await leaveType.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'LEAVE_TYPE_UPDATED',
    module: 'leave',
    entity: 'LeaveType',
    entityId: leaveType._id,
    summary: `Updated leave type ${leaveType.name}`,
    ip: req.ip,
  });
  return ApiResponse.ok(res, 'Leave type updated', { leaveType });
});

/** DELETE /api/leave/types/:id — soft-deactivate so historical applications stay valid. */
const deleteLeaveType = asyncHandler(async (req, res) => {
  const leaveType = await LeaveType.findById(req.params.id);
  if (!leaveType) throw new ApiError(404, 'Leave type not found.');
  leaveType.isActive = false;
  await leaveType.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'LEAVE_TYPE_DEACTIVATED',
    module: 'leave',
    entity: 'LeaveType',
    entityId: leaveType._id,
    summary: `Deactivated leave type ${leaveType.name}`,
    ip: req.ip,
  });
  return ApiResponse.ok(res, 'Leave type deactivated');
});

/** POST /api/leave/applications — employee applies for leave. */
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType: leaveTypeId, startDate, endDate, halfDay = false, reason, attachment } = req.body;

  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType || !leaveType.isActive) throw new ApiError(400, 'Invalid or inactive leave type.');

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) throw new ApiError(400, 'Start date cannot be after end date.');
  if (halfDay && start.toDateString() !== end.toDateString()) {
    throw new ApiError(400, 'Half-day leave must have the same start and end date.');
  }

  const overlaps = await leaveService.hasOverlap(req.user._id, start, end);
  if (overlaps) throw new ApiError(409, 'You already have a leave application overlapping these dates.');

  const days = leaveService.calculateDays(start, end, halfDay);
  const balance = await leaveService.getOrCreateBalance(req.user._id, leaveType, start.getFullYear());
  if (balance.balance < days) {
    throw new ApiError(400, `Insufficient leave balance. Available: ${balance.balance} day(s).`);
  }

  const application = await LeaveApplication.create({
    user: req.user._id,
    leaveType: leaveType._id,
    startDate: start,
    endDate: end,
    halfDay,
    days,
    reason,
    attachment,
  });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'LEAVE_APPLIED',
    module: 'leave',
    entity: 'LeaveApplication',
    entityId: application._id,
    summary: `Applied for ${days} day(s) of ${leaveType.name}`,
    ip: req.ip,
  });

  const admins = await User.find({ role: ROLES.SYSTEM_ADMIN, isActive: true }).select('_id');
  admins.forEach((admin) =>
    notificationService.push({
      user: admin._id,
      type: 'leave_application',
      title: 'New leave application',
      body: `${req.user.name} applied for ${days} day(s) of ${leaveType.name}.`,
    })
  );

  return ApiResponse.created(res, 'Leave application submitted', { application });
});

/** GET /api/leave/applications/mine */
const listMyLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const q = { user: req.user._id };
  if (status) q.status = status;

  const items = await LeaveApplication.find(q)
    .sort({ createdAt: -1 })
    .populate('leaveType', 'name code isPaid')
    .populate('reviewedBy', 'name email');
  return ApiResponse.ok(res, 'Your leave applications fetched', { items });
});

/** GET /api/leave/applications — system admin view of every application. */
const listLeaveApplications = asyncHandler(async (req, res) => {
  const { status, user, leaveType } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (status) q.status = status;
  if (user) q.user = user;
  if (leaveType) q.leaveType = leaveType;

  const [items, total] = await Promise.all([
    LeaveApplication.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .populate('leaveType', 'name code')
      .populate('reviewedBy', 'name email'),
    LeaveApplication.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Leave applications fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/leave/applications/:id */
const getLeaveApplication = asyncHandler(async (req, res) => {
  const application = await LeaveApplication.findById(req.params.id)
    .populate('user', 'name email')
    .populate('leaveType', 'name code')
    .populate('reviewedBy', 'name email');
  if (!application) throw new ApiError(404, 'Leave application not found.');
  if (String(application.user._id) !== String(req.user._id) && !isSystemAdmin(req.user)) {
    throw new ApiError(403, 'You do not have permission to view this application.');
  }
  return ApiResponse.ok(res, 'Leave application fetched', { application });
});

/** PATCH /api/leave/applications/:id/review — system admin approves/rejects. */
const reviewLeave = asyncHandler(async (req, res) => {
  const { decision, reviewComment = '' } = req.body;
  const application = await LeaveApplication.findById(req.params.id).populate('leaveType', 'name');
  if (!application) throw new ApiError(404, 'Leave application not found.');
  if (application.status !== LEAVE_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending applications can be reviewed.');
  }

  if (decision === 'approve') {
    const balance = await LeaveBalance.findOne({
      user: application.user,
      leaveType: application.leaveType._id,
      year: application.startDate.getFullYear(),
    });
    if (!balance || balance.balance < application.days) {
      throw new ApiError(400, 'Employee no longer has sufficient leave balance.');
    }
    await leaveService.adjustUsed(balance._id, application.days);
    application.status = LEAVE_STATUS.APPROVED;
  } else {
    application.status = LEAVE_STATUS.REJECTED;
  }

  application.reviewedBy = req.user._id;
  application.reviewedAt = new Date();
  application.reviewComment = reviewComment;
  await application.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: decision === 'approve' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    module: 'leave',
    entity: 'LeaveApplication',
    entityId: application._id,
    summary: `${decision === 'approve' ? 'Approved' : 'Rejected'} ${application.leaveType.name} application`,
    ip: req.ip,
  });

  notificationService.push({
    user: application.user,
    type: 'leave_review',
    title: `Leave ${application.status}`,
    body: `Your ${application.leaveType.name} application was ${application.status}.`,
  });

  return ApiResponse.ok(res, `Leave application ${application.status}`, { application });
});

/** PATCH /api/leave/applications/:id/cancel */
const cancelLeave = asyncHandler(async (req, res) => {
  const application = await LeaveApplication.findById(req.params.id).populate('leaveType', 'name');
  if (!application) throw new ApiError(404, 'Leave application not found.');
  if (String(application.user) !== String(req.user._id) && !isSystemAdmin(req.user)) {
    throw new ApiError(403, 'You do not have permission to cancel this application.');
  }
  if (![LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED].includes(application.status)) {
    throw new ApiError(400, 'Only pending or approved applications can be cancelled.');
  }

  if (application.status === LEAVE_STATUS.APPROVED) {
    const balance = await LeaveBalance.findOne({
      user: application.user,
      leaveType: application.leaveType._id,
      year: application.startDate.getFullYear(),
    });
    if (balance) await leaveService.adjustUsed(balance._id, -application.days);
  }

  application.status = LEAVE_STATUS.CANCELLED;
  application.cancelledAt = new Date();
  await application.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'LEAVE_CANCELLED',
    module: 'leave',
    entity: 'LeaveApplication',
    entityId: application._id,
    summary: `Cancelled ${application.leaveType.name} application`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Leave application cancelled', { application });
});

/** GET /api/leave/balance — own balance, or ?userId= for a system admin. */
const myBalance = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const targetUser = req.query.userId && isSystemAdmin(req.user) ? req.query.userId : req.user._id;

  const leaveTypes = await LeaveType.find({ isActive: true }).sort({ name: 1 });
  const balances = await Promise.all(
    leaveTypes.map((leaveType) => leaveService.getOrCreateBalance(targetUser, leaveType, year))
  );

  const items = leaveTypes.map((leaveType, i) => ({
    leaveType: { _id: leaveType._id, name: leaveType.name, code: leaveType.code, isPaid: leaveType.isPaid },
    allocated: balances[i].allocated,
    used: balances[i].used,
    carriedForward: balances[i].carriedForward,
    balance: balances[i].balance,
  }));

  return ApiResponse.ok(res, 'Leave balance fetched', { year, items });
});

/** GET /api/leave/calendar — approved leaves in a date range (default: current month). */
const leaveCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = req.query.to
    ? new Date(req.query.to)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const items = await LeaveApplication.find({
    status: LEAVE_STATUS.APPROVED,
    startDate: { $lte: to },
    endDate: { $gte: from },
  })
    .populate('user', 'name email')
    .populate('leaveType', 'name code')
    .sort({ startDate: 1 });

  return ApiResponse.ok(res, 'Leave calendar fetched', { from, to, items });
});

/** GET /api/leave/reports — system admin summary of applications in a date range. */
const leaveReport = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.startDate = {};
    if (req.query.from) match.startDate.$gte = new Date(req.query.from);
    if (req.query.to) match.startDate.$lte = new Date(req.query.to);
  }

  const [byStatus, byLeaveType, leaveTypes] = await Promise.all([
    LeaveApplication.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDays: { $sum: '$days' } } },
    ]),
    LeaveApplication.aggregate([
      { $match: match },
      { $group: { _id: '$leaveType', count: { $sum: 1 }, totalDays: { $sum: '$days' } } },
    ]),
    LeaveType.find().select('name code'),
  ]);

  const typeById = new Map(leaveTypes.map((t) => [String(t._id), t]));
  const byLeaveTypeNamed = byLeaveType.map((row) => ({
    leaveType: typeById.get(String(row._id)) || null,
    count: row.count,
    totalDays: row.totalDays,
  }));

  return ApiResponse.ok(res, 'Leave report generated', {
    byStatus,
    byLeaveType: byLeaveTypeNamed,
  });
});

module.exports = {
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  applyLeave,
  listMyLeaves,
  listLeaveApplications,
  getLeaveApplication,
  reviewLeave,
  cancelLeave,
  myBalance,
  leaveCalendar,
  leaveReport,
};
