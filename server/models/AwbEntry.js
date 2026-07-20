const mongoose = require('mongoose');

const awbEntrySchema = new mongoose.Schema(
  {
    awbNumber: {
      type: String,
      required: [true, 'AWB Number is required'],
      trim: true,
      uppercase: true,
    },
    partyName: {
      type: String,
      trim: true,
    },
    destinationCountry: {
      type: String,
      trim: true,
    },
    processingDate: {
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

// Prevent duplicate AWB numbers for the same employee
awbEntrySchema.index({ employee: 1, awbNumber: 1 }, { unique: true });

module.exports = mongoose.model('AwbEntry', awbEntrySchema);
