const mongoose = require('mongoose');
const { Schema } = mongoose;

const grievanceMessageSchema = new Schema(
  {
    grievance: {
      type: Schema.Types.ObjectId,
      ref: 'Grievance',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String, // Rich Text HTML or plain text
      required: true,
    },
    isInternalNote: {
      type: Boolean,
      default: false, // If true, only visible to Admins
    },
    attachments: [
      {
        url: String, // Path to local file /uploads/...
        filename: String,
        mimetype: String,
        size: Number,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('GrievanceMessage', grievanceMessageSchema);
