const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ATTENDANCE_MARKED', 'EXPORT']
    },
    entity: {
      type: String,
      required: true,
      enum: ['USER', 'SUBJECT', 'ATTENDANCE', 'DEPARTMENT', 'SECTION', 'AUTH', 'REPORT']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'entity'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changes: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// Index for faster queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
