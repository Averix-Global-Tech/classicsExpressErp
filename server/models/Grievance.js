const mongoose = require('mongoose');
const { Schema } = mongoose;

const grievanceSchema = new Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    department: {
      type: String, // Copied from user at creation to preserve historical dept
      default: '',
    },
    branch: {
      type: String, // Copied from user at creation
      default: '',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Pending Review',
        'Assigned',
        'In Progress',
        'Waiting for Employee',
        'Resolved',
        'Closed',
        'Rejected',
        'Reopened',
        'Escalated',
      ],
      default: 'Submitted',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: true, // Rich Text HTML
    },
    attachments: [
      {
        url: String, // Path to local file /uploads/...
        filename: String,
        mimetype: String,
        size: Number,
      }
    ],
    // SLA Tracking
    expectedResolutionDate: {
      type: Date,
      default: null,
    },
    isSlaBreached: {
      type: Boolean,
      default: false,
    },
    // Resolution Details
    resolutionFeedback: {
      type: String,
      default: '',
    },
    resolutionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    // Audit Log
    auditLog: [
      {
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true }, // e.g., 'STATUS_CHANGED', 'ASSIGNED'
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      }
    ],
  },
  { timestamps: true }
);

// Auto-generate ticket number pre-save if new
grievanceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      const dateStr = new Date().toISOString().substring(0, 4); // YYYY
      const count = await this.constructor.countDocuments({
        ticketNumber: new RegExp(`^GRV-${dateStr}-`),
      });
      const seq = (count + 1).toString().padStart(6, '0');
      this.ticketNumber = `GRV-${dateStr}-${seq}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Grievance', grievanceSchema);
