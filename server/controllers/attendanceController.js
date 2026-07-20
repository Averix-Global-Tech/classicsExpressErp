const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const AttendanceSettings = require('../models/AttendanceSettings');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');

// ─── Utility Functions ───────────────────────────────────────────────────────

/** Get start of day in UTC */
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Calculate minutes between two dates */
const getMinutesBetween = (start, end) => {
  return Math.max(0, Math.floor((end - start) / 60000));
};

/** Parse HH:mm to minutes from midnight */
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Get the global settings (or create default if missing) */
const getGlobalSettings = async () => {
  let settings = await AttendanceSettings.findOne();
  if (!settings) {
    settings = await AttendanceSettings.create({
      officeStartTime: '09:30',
      officeEndTime: '18:30',
      halfDayThresholdHours: 4,
      minimumWorkingHours: 8,
    });
  }
  return settings;
};

// ─── Employee Controllers ────────────────────────────────────────────────────

/** POST /api/attendance/check-in */
const checkIn = asyncHandler(async (req, res) => {
  const today = getStartOfDay();
  const existing = await Attendance.findOne({ employee: req.user._id, date: today });

  if (existing) {
    throw new ApiError(400, 'You have already initiated attendance for today.');
  }

  const attendance = await Attendance.create({
    employee: req.user._id,
    date: today,
    checkIn: new Date(),
    approvalStatus: 'Pending Check-In',
    auditLog: [{
      modifiedBy: req.user._id,
      action: 'CHECK_IN_REQUESTED',
      details: 'Employee requested check-in.',
    }],
  });

  return ApiResponse.created(res, 'Check-In submitted successfully. Waiting for administrator approval.', { attendance });
});

/** POST /api/attendance/check-out */
const checkOut = asyncHandler(async (req, res) => {
  const today = getStartOfDay();
  const attendance = await Attendance.findOne({ employee: req.user._id, date: today });

  if (!attendance) {
    throw new ApiError(404, 'No attendance record found for today. Please check in first.');
  }
  if (attendance.approvalStatus !== 'Checked In') {
    throw new ApiError(400, `Cannot check out. Current status is ${attendance.approvalStatus}.`);
  }

  attendance.checkOut = new Date();
  attendance.approvalStatus = 'Pending Check-Out';
  attendance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'CHECK_OUT_REQUESTED',
    details: 'Employee requested check-out.',
  });

  await attendance.save();

  return ApiResponse.ok(res, 'Check-Out submitted successfully. Waiting for administrator approval.', { attendance });
});

/** GET /api/attendance/my-attendance */
const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const targetDate = new Date();
  const m = month ? parseInt(month, 10) - 1 : targetDate.getUTCMonth();
  const y = year ? parseInt(year, 10) : targetDate.getUTCFullYear();

  const startDate = new Date(Date.UTC(y, m, 1));
  const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));

  const records = await Attendance.find({
    employee: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  const today = getStartOfDay();
  const todayRecord = await Attendance.findOne({ employee: req.user._id, date: today });

  // Compute summary stats
  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let totalWorkingMinutes = 0;
  let totalOvertimeMinutes = 0;

  records.forEach(r => {
    if (r.status === 'Present') presentCount++;
    if (r.status === 'Absent') absentCount++;
    if (r.status === 'Half Day') halfDayCount++;
    if (r.status === 'Leave') leaveCount++;
    if (r.isLate) lateCount++;
    totalWorkingMinutes += r.workingMinutes;
    totalOvertimeMinutes += r.overtimeMinutes;
  });

  return ApiResponse.ok(res, 'Attendance fetched', {
    today: todayRecord,
    records,
    summary: {
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      late: lateCount,
      leave: leaveCount,
      workingHours: (totalWorkingMinutes / 60).toFixed(1),
      overtimeHours: (totalOvertimeMinutes / 60).toFixed(1),
    }
  });
});

// ─── Admin Controllers ───────────────────────────────────────────────────────

/** GET /api/attendance/pending */
const getPendingApprovals = asyncHandler(async (req, res) => {
  const records = await Attendance.find({
    approvalStatus: { $in: ['Pending Check-In', 'Pending Check-Out'] }
  })
    .populate('employee', 'name employeeId department designation photo')
    .sort({ updatedAt: -1 });

  return ApiResponse.ok(res, 'Pending approvals fetched', { records });
});

/** PATCH /api/attendance/:id/approve-check-in */
const approveCheckIn = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate('employee', 'name email');
  if (!attendance) throw new ApiError(404, 'Attendance record not found.');
  if (attendance.approvalStatus !== 'Pending Check-In') {
    throw new ApiError(400, 'Record is not pending check-in.');
  }

  const settings = await getGlobalSettings();
  
  // Calculate if late
  const checkInTime = attendance.checkIn;
  const checkInMinutes = checkInTime.getUTCHours() * 60 + checkInTime.getUTCMinutes();
  const officeStartMinutes = parseTime(settings.officeStartTime);

  if (checkInMinutes > officeStartMinutes) {
    attendance.isLate = true;
    attendance.lateMinutes = checkInMinutes - officeStartMinutes;
  }

  attendance.approvalStatus = 'Checked In';
  attendance.approvedBy = req.user._id;
  attendance.approvalDate = new Date();
  
  attendance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'CHECK_IN_APPROVED',
    details: 'Admin approved check-in.',
  });

  await attendance.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'ATTENDANCE_CHECK_IN_APPROVED',
    module: 'attendance',
    entity: 'Attendance',
    entityId: attendance._id,
    summary: `Approved check-in for ${attendance.employee.name}`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Check-In approved.', { attendance });
});

/** PATCH /api/attendance/:id/approve-check-out */
const approveCheckOut = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id).populate('employee', 'name email');
  if (!attendance) throw new ApiError(404, 'Attendance record not found.');
  if (attendance.approvalStatus !== 'Pending Check-Out') {
    throw new ApiError(400, 'Record is not pending check-out.');
  }

  const settings = await getGlobalSettings();
  
  // Calculate total working minutes
  const workingMinutes = getMinutesBetween(attendance.checkIn, attendance.checkOut);
  attendance.workingMinutes = workingMinutes;

  // Calculate standard office hours
  const officeStartMinutes = parseTime(settings.officeStartTime);
  const officeEndMinutes = parseTime(settings.officeEndTime);
  const standardWorkMinutes = officeEndMinutes - officeStartMinutes; // e.g. 9 hours = 540 mins
  
  // Determine Overtime
  if (workingMinutes > standardWorkMinutes) {
    attendance.overtimeMinutes = workingMinutes - standardWorkMinutes;
  }

  // Determine Final Status
  if (workingMinutes < settings.halfDayThresholdHours * 60) {
    attendance.status = 'Half Day';
  } else {
    attendance.status = 'Present';
  }

  attendance.approvalStatus = 'Approved';
  attendance.approvedBy = req.user._id;
  attendance.approvalDate = new Date();
  
  attendance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'CHECK_OUT_APPROVED',
    details: `Admin approved check-out. Status: ${attendance.status}, Hrs: ${(workingMinutes/60).toFixed(1)}`,
  });

  await attendance.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'ATTENDANCE_CHECK_OUT_APPROVED',
    module: 'attendance',
    entity: 'Attendance',
    entityId: attendance._id,
    summary: `Approved check-out for ${attendance.employee.name}`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Check-Out approved and attendance finalized.', { attendance });
});

/** PATCH /api/attendance/:id/reject */
const rejectRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) throw new ApiError(400, 'Rejection reason is mandatory.');

  const attendance = await Attendance.findById(req.params.id).populate('employee', 'name email');
  if (!attendance) throw new ApiError(404, 'Attendance record not found.');
  if (!['Pending Check-In', 'Pending Check-Out'].includes(attendance.approvalStatus)) {
    throw new ApiError(400, 'Record is not pending approval.');
  }

  attendance.approvalStatus = 'Rejected';
  attendance.status = 'Rejected';
  attendance.rejectionReason = reason;
  attendance.approvedBy = req.user._id;
  attendance.approvalDate = new Date();
  
  attendance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'REQUEST_REJECTED',
    details: `Admin rejected request. Reason: ${reason}`,
  });

  await attendance.save();

  return ApiResponse.ok(res, 'Attendance request rejected.', { attendance });
});

/** GET /api/attendance/dashboard */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const today = getStartOfDay();
  const records = await Attendance.find({ date: today }).populate('employee', 'name department');

  const stats = {
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    pending: 0,
    leave: 0,
    wfh: 0,
  };

  records.forEach(r => {
    if (r.status === 'Present') stats.present++;
    if (r.status === 'Half Day') stats.halfDay++;
    if (r.isLate) stats.late++;
    if (r.status === 'Leave') stats.leave++;
    if (r.status === 'Work From Home') stats.wfh++;
    if (['Pending Check-In', 'Pending Check-Out'].includes(r.approvalStatus)) stats.pending++;
  });

  return ApiResponse.ok(res, 'Dashboard stats fetched', { stats, todayRecords: records });
});

/** GET /api/attendance */
const listAllAttendance = asyncHandler(async (req, res) => {
  const { employeeId, department, status, startDate, endDate, search = '' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (status) q.status = status;
  if (startDate && endDate) {
    q.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Handle cross-collection filtering via aggregation if search/employee/department are used.
  // For simplicity, we'll use mongoose populate filtering for department/search.
  // In a real enterprise app, we'd use aggregate. Let's do a simple find and populate.
  // To keep it performant for the MVP, we filter strictly on the Attendance model first.
  
  const [items, total] = await Promise.all([
    Attendance.find(q)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', 'name employeeId department designation')
      .populate('approvedBy', 'name')
      .lean(),
    Attendance.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Attendance fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** PUT /api/attendance/:id/manual */
const manualUpdate = asyncHandler(async (req, res) => {
  const { status, checkIn, checkOut, remarks } = req.body;
  if (!remarks) throw new ApiError(400, 'Remarks are mandatory for manual updates.');

  const attendance = await Attendance.findById(req.params.id).populate('employee', 'name email');
  if (!attendance) throw new ApiError(404, 'Attendance record not found.');

  if (checkIn) attendance.checkIn = new Date(checkIn);
  if (checkOut) attendance.checkOut = new Date(checkOut);
  if (status) attendance.status = status;
  
  // Recalculate working minutes
  if (attendance.checkIn && attendance.checkOut) {
    attendance.workingMinutes = getMinutesBetween(attendance.checkIn, attendance.checkOut);
  }

  attendance.remarks = remarks;
  attendance.approvalStatus = 'Approved';
  attendance.approvedBy = req.user._id;
  attendance.approvalDate = new Date();
  
  attendance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'MANUAL_UPDATE',
    details: `Admin manually updated record. Remarks: ${remarks}`,
  });

  await attendance.save();

  return ApiResponse.ok(res, 'Attendance manually updated.', { attendance });
});

/** GET /api/attendance/settings */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await getGlobalSettings();
  return ApiResponse.ok(res, 'Settings fetched', { settings });
});

/** PUT /api/attendance/settings */
const updateSettings = asyncHandler(async (req, res) => {
  const { officeStartTime, officeEndTime, halfDayThresholdHours, minimumWorkingHours } = req.body;
  
  let settings = await getGlobalSettings();
  if (officeStartTime) settings.officeStartTime = officeStartTime;
  if (officeEndTime) settings.officeEndTime = officeEndTime;
  if (halfDayThresholdHours) settings.halfDayThresholdHours = halfDayThresholdHours;
  if (minimumWorkingHours) settings.minimumWorkingHours = minimumWorkingHours;
  
  await settings.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'ATTENDANCE_SETTINGS_UPDATED',
    module: 'attendance',
    entity: 'AttendanceSettings',
    entityId: settings._id,
    summary: 'Updated global attendance settings.',
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Settings updated', { settings });
});

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getPendingApprovals,
  approveCheckIn,
  approveCheckOut,
  rejectRequest,
  getAdminDashboard,
  listAllAttendance,
  manualUpdate,
  getSettings,
  updateSettings,
};
