const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Append-only audit trail. Written by the audit middleware/service for important
 * actions across all modules. Use createdAt (descending) for "recent activity".
 */
const auditLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userEmail: { type: String, default: '' }, // denormalised in case the user is later deleted
    action: { type: String, required: true }, // e.g. 'EMPLOYEE_CREATED'
    module: { type: String, required: true }, // e.g. 'employee', 'auth'
    entity: { type: String, default: '' }, // e.g. 'Employee'
    entityId: { type: Schema.Types.ObjectId, default: null },
    summary: { type: String, default: '' }, // human-readable line
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
