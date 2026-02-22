const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    lockExpiry: {
      type: Date
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedAt: {
      type: Date
    },
    editCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Prevent duplicate attendance records for same student/subject/date
attendanceSchema.index(
  { student: 1, subject: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);