const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * One row per user/leaveType/year. `balance` is derived rather than stored so it
 * can never drift from allocated/used/carriedForward.
 */
const leaveBalanceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true, index: true },
    year: { type: Number, required: true, index: true },
    allocated: { type: Number, default: 0, min: 0 },
    used: { type: Number, default: 0, min: 0 },
    carriedForward: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveBalanceSchema.virtual('balance').get(function getBalance() {
  return this.allocated + this.carriedForward - this.used;
});

leaveBalanceSchema.index({ user: 1, leaveType: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
