const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  sectionName: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Section", sectionSchema);