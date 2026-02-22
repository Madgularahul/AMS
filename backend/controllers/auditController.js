const AuditLog = require('../models/AuditLog');

// @route GET /api/audit
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entity, userId } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (userId) filter.performedBy = userId;

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .populate('entityId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/audit/:id
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'name email role')
      .populate('entityId');

    if (!log) return res.status(404).json({ message: 'Audit log not found' });

    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs, getAuditLogById };
