const mongoose = require('mongoose');

const grievanceSettingsSchema = new mongoose.Schema(
  {
    categories: {
      type: [String],
      default: [
        'HR',
        'Payroll',
        'Attendance',
        'Leave',
        'Manager',
        'Workplace Behaviour',
        'Harassment',
        'IT Support',
        'Courier Operations',
        'Equipment',
        'Safety',
        'Administration',
        'Other'
      ],
    },
    slas: {
      type: Map,
      of: Number, // Hours
      default: {
        'Low': 120,       // 5 days
        'Medium': 72,     // 3 days
        'High': 48,       // 48 hours
        'Critical': 24,   // 24 hours
      },
    },
    maxAttachmentSizeMB: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrievanceSettings', grievanceSettingsSchema);
