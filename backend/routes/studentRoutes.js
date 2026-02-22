const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyAttendance,
  getAttendancePercentage,
  getAttendanceTrends,
  getAttendanceCalendar,
  getAttendanceInsights,
  getSubjectAttendanceDetails,
  exportMyAttendance
} = require('../controllers/studentController');

router.use(protect, authorize('student'));

router.get('/attendance', getMyAttendance);
router.get('/attendance/percentage', getAttendancePercentage);
router.get('/attendance/trends', getAttendanceTrends);
router.get('/attendance/calendar', getAttendanceCalendar);
router.get('/attendance/insights', getAttendanceInsights);
router.get('/attendance/subject/:subjectId', getSubjectAttendanceDetails);
router.get('/attendance/export', exportMyAttendance);

module.exports = router;