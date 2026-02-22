const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  generateAttendanceReport,
  generateStudentReport,
  generateSubjectReport,
  generateSectionReport,
  exportToExcel,
  exportSectionReportExcel,
  exportToPDF,
  getAttendanceAnalytics,
  getAttendanceTrends
} = require('../controllers/reportController');

router.use(protect);

// Analytics and Reports
router.get('/analytics', authorize('admin'), getAttendanceAnalytics);
router.get('/trends', authorize('admin'), getAttendanceTrends);
router.get('/attendance', authorize('admin'), generateAttendanceReport);
router.get('/student/:studentId', authorize('admin'), generateStudentReport);
router.get('/subject/:subjectId', authorize('admin', 'faculty'), generateSubjectReport);

// More specific route MUST come before general route
router.get('/section/export', authorize('admin'), exportSectionReportExcel);

router.get('/section', authorize('admin'), generateSectionReport);

// Export functionality
router.get('/export/excel', authorize('admin'), exportToExcel);
router.get('/export/pdf/:reportId', authorize('admin'), exportToPDF);

module.exports = router;
