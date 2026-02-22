const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAuditLogs, getAuditLogById } = require('../controllers/auditController');

router.use(protect, authorize('admin'));

router.get('/', getAuditLogs);
router.get('/:id', getAuditLogById);

module.exports = router;
