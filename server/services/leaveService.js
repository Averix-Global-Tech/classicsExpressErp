const LeaveBalance = require('../models/LeaveBalance');
const LeaveApplication = require('../models/LeaveApplication');
const { LEAVE_STATUS } = require('../config/constants/leave');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Strip the time component so day-diff math is exact regardless of TZ offset. */
function toDateOnly(value) {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive calendar-day span between two dates; 0.5 for a same-day half-day leave. */
function calculateDays(startDate, endDate, halfDay = false) {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (halfDay) return 0.5;
  return Math.round((end - start) / MS_PER_DAY) + 1;
}

/** Fetch (or lazily create) a user's balance row for a leave type/year. */
async function getOrCreateBalance(userId, leaveType, year) {
  let balance = await LeaveBalance.findOne({ user: userId, leaveType: leaveType._id, year });
  if (!balance) {
    balance = await LeaveBalance.create({
      user: userId,
      leaveType: leaveType._id,
      year,
      allocated: leaveType.defaultDaysPerYear,
    });
  }
  return balance;
}

/** True when the user already has a pending/approved application overlapping the range. */
async function hasOverlap(userId, startDate, endDate, excludeId = null) {
  const query = {
    user: userId,
    status: { $in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (excludeId) query._id = { $ne: excludeId };
  const clash = await LeaveApplication.findOne(query);
  return Boolean(clash);
}

/** Adjust a balance's used days by `delta` (negative to revert on cancellation). */
async function adjustUsed(balanceId, delta) {
  return LeaveBalance.findByIdAndUpdate(balanceId, { $inc: { used: delta } }, { new: true });
}

module.exports = { calculateDays, getOrCreateBalance, hasOverlap, adjustUsed };
