const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The calendar date this record belongs to (normalized to 00:00:00 of the day).
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workingMinutes: {
      type: Number,
      default: 0,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    // Attendance Status
    status: {
      type: String,
      enum: [
        'Present',
        'Absent',
        'Half Day',
        'Late',
        'Leave',
        'Holiday',
        'Weekend',
        'Work From Home',
        'On Duty',
      ],
      default: 'Absent',
    },
    // Workflow approval state
    approvalStatus: {
      type: String,
      enum: [
        'Pending Check-In',
        'Checked In',
        'Pending Check-Out',
        'Approved',
        'Rejected',
      ],
      default: 'Pending Check-In',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    auditLog: [
      {
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to ensure an employee has only one record per calendar date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
