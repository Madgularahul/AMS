const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function (data) {
      // Log the action
      if (req.user) {
        AuditLog.create({
          action,
          entity,
          entityId: req.params.id || data._id || null,
          performedBy: req.user._id,
          changes: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        }).catch(err => console.error('Audit log error:', err));
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

module.exports = { auditLog };
