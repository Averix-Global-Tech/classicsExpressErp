const auditService = require('../services/auditService');

/**
 * Declarative audit capture for a route. Captures AFTER the handler runs, so it
 * only fires for successful (2xx) responses.
 *
 *   router.post('/', audit('EMPLOYEE_CREATED', 'employee', { entity: 'Employee' }), handler)
 *
 * `build` (optional) receives (req, res) and returns extra fields (entityId, summary).
 */
function audit(action, module, { entity = '', build } = {}) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return; // only successful actions
      const extra = typeof build === 'function' ? build(req, res) || {} : {};
      auditService.record({
        user: req.user?._id ?? null,
        userEmail: req.user?.email ?? '',
        action,
        module,
        entity,
        entityId: extra.entityId || null,
        summary: extra.summary || '',
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        meta: extra.meta || {},
      });
    });
    next();
  };
}

module.exports = { audit };
