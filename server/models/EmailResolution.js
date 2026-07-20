const mongoose = require('mongoose');

const emailResolutionSchema = new mongoose.Schema(
  {
    emailReferenceNumber: {
      type: String,
      required: [true, 'Email Reference Number is required'],
      trim: true,
    },
    partyName: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    relatedAwbNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    resolutionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee reference is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent exact duplicate email reference for the same employee
emailResolutionSchema.index({ employee: 1, emailReferenceNumber: 1 });

module.exports = mongoose.model('EmailResolution', emailResolutionSchema);
