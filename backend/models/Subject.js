const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },

    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // NEW FIELD
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    section: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Section',
  required: true
},

    // NEW FIELD
    year: {
      type: Number,
      required: true,
    },

    // NEW FIELD
    semester: {
      type: Number,
      required: true,
    },

    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);