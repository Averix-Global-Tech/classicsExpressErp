const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Admin-configurable leave category (e.g. "Casual Leave", "Sick Leave") with the
 * default yearly quota new balances are seeded from.
 */
const leaveTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    description: { type: String, default: '', trim: true },
    defaultDaysPerYear: { type: Number, required: true, min: 0, default: 0 },
    isPaid: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
