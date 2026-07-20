const mongoose = require('mongoose');
const { LEAVE_STATUS } = require('../config/constants/leave');

const { Schema } = mongoose;

/**
 * A single leave request and its approval trail. `days` is computed at
 * application time (see leaveService.calculateDays) so history stays stable
 * even if calendar logic changes later.
 */
const leaveApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    halfDay: { type: Boolean, default: false },
    days: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
      index: true,
    },
    attachment: { type: String, default: '' }, // Cloudinary URL, optional supporting doc
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, default: '', trim: true, maxlength: 500 },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ user: 1, status: 1 });
leaveApplicationSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
