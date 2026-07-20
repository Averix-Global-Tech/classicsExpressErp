const mongoose = require('mongoose');

const { Schema } = mongoose;

const attendanceSettingsSchema = new Schema(
  {
    // Global configuration for the organization
    officeStartTime: {
      type: String, // format: "HH:mm" (24-hour)
      default: '09:30',
      required: true,
    },
    officeEndTime: {
      type: String, // format: "HH:mm" (24-hour)
      default: '18:30',
      required: true,
    },
    halfDayThresholdHours: {
      type: Number,
      default: 4,
      required: true,
    },
    minimumWorkingHours: {
      type: Number,
      default: 8,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceSettings', attendanceSettingsSchema);
