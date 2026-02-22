const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const {
  getAssignedSubjects,
  getStudentsBySubject,
  markAttendance,
  getAttendanceBySubjectAndDate
} = require('../controllers/facultyController');

router.use(protect, authorize('faculty'));

router.get('/subjects', getAssignedSubjects);

router.get('/students', getStudentsBySubject);

router.post('/attendance', markAttendance);
router.get('/attendance', getAttendanceBySubjectAndDate);

module.exports = router;