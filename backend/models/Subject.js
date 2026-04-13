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
    },
  },
  { timestamps: true }
);

subjectSchema.index({ code: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);