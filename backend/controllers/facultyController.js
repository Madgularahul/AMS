const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Section = require('../models/Section');


// =============================
// GET Assigned Subjects
// =============================
const getAssignedSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({
      assignedFaculty: req.user._id
    })
      .populate('department', 'name code')
      .populate({
        path: 'section',
        select: 'sectionName year semester department',
        populate: {
          path: 'department',
          select: 'name code'
        }
      });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// GET Students by Subject
// =============================
const getStudentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId)
      return res.status(400).json({ message: "subjectId is required" });

    // Verify subject belongs to this faculty
    const subject = await Subject.findOne({
      _id: subjectId,
      assignedFaculty: req.user._id
    });

    if (!subject)
      return res.status(403).json({
        message: "Subject not assigned to you"
      });

    // Directly fetch students of that section
    const students = await User.find({
      role: "student",
      section: subject.section
    }).select("-password");

    res.json(students);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// MARK Attendance
// =============================
const markAttendance = async (req, res) => {
  try {
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !records || !Array.isArray(records))
      return res.status(400).json({
        message: 'subjectId, date, and records[] are required'
      });

    // Verify faculty owns subject
    const subject = await Subject.findOne({
      _id: subjectId,
      assignedFaculty: req.user._id
    });

    if (!subject)
      return res.status(403).json({
        message: 'Subject not assigned to you'
      });

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const ops = records.map(({ studentId, status }) => ({
      updateOne: {
        filter: {
          student: studentId,
          subject: subjectId,
          date: attendanceDate
        },
        update: {
          $set: {
            status,
            markedBy: req.user._id
          }
        },
        upsert: true
      }
    }));
    
    await Attendance.bulkWrite(ops);

    // Emit real-time updates via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Notify admin room
      io.to('admin-room').emit('attendance-updated', {
        subjectId,
        date,
        count: records.length,
        markedBy: req.user.name,
        timestamp: new Date()
      });

      // Notify each student individually
      records.forEach(({ studentId, status }) => {
        io.to(`user-${studentId}`).emit('my-attendance-updated', {
          subjectId,
          subjectName: subject.name,
          date,
          status,
          timestamp: new Date()
        });
      });
    }

    res.json({ message: 'Attendance marked successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =============================
// GET Attendance by Subject + Date
// =============================
const getAttendanceBySubjectAndDate = async (req, res) => {
  try {
    const { subjectId, date } = req.query;

    if (!subjectId)
      return res.status(400).json({
        message: 'subjectId is required'
      });

    const filter = { subject: subjectId };

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.date = { $gte: d, $lt: nextDay };
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    res.json(records);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getAssignedSubjects,
  getStudentsBySubject,
  markAttendance,
  getAttendanceBySubjectAndDate
};