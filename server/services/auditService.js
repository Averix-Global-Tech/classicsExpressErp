const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Fire-and-forget audit writer. Never throws into the request path — a logging
 * failure must not break the user action being audited.
 */
async function record(entry) {
  try {
    await AuditLog.create({
      user: entry.user ?? null,
      userEmail: entry.userEmail ?? '',
      action: entry.action,
      module: entry.module,
      entity: entry.entity || '',
      entityId: entry.entityId || null,
      summary: entry.summary || '',
      ip: entry.ip || '',
      userAgent: entry.userAgent || '',
      meta: entry.meta || {},
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err.message);
  }
}

/** Pull the most recent N activities for the dashboard feed. */
async function recentActivity(limit = 8) {
  return AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('action module summary userEmail createdAt')
    .lean();
}

module.exports = { record, recentActivity };
