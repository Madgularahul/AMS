const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    maxlength: [3, 'Department code must be at most 3 characters'],
    uppercase: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);