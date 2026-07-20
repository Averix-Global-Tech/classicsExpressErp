const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Persisted in-app notifications. Fire-and-forget like auditService — a
 * notification failing to write must never break the action that triggered it.
 */
async function push({ user, type, title, body = '' }) {
  try {
    return await Notification.create({ user, type, title, body });
  } catch (err) {
    logger.error('Failed to write notification:', err.message);
    return null;
  }
}

/** Most recent notifications for a user, newest first. */
async function listFor(user, { limit = 20 } = {}) {
  return Notification.find({ user }).sort({ createdAt: -1 }).limit(limit);
}

function unreadCount(user) {
  return Notification.countDocuments({ user, read: false });
}

/** Mark a single notification read (scoped to its owner). */
async function markRead(id, user) {
  return Notification.findOneAndUpdate(
    { _id: id, user },
    { read: true, readAt: new Date() },
    { new: true }
  );
}

async function markAllRead(user) {
  await Notification.updateMany({ user, read: false }, { read: true, readAt: new Date() });
  return listFor(user, { limit: 20 });
}

module.exports = { push, listFor, unreadCount, markRead, markAllRead };
