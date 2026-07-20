const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Per-user in-app notification. Replaces the old in-memory stub so alerts
 * (leave applied/reviewed, task assigned/completed, login) survive a restart
 * and can be listed/marked-read via a real endpoint.
 */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, default: '', trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
