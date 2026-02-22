const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require("../models/Department");
const Section = require("../models/Section");

// ========== USER MANAGEMENT ==========

// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = role
      ? { role }
      : { role: { $ne: 'admin' } };

    const users = await User.find(filter)
      .populate('department', 'name code')
      .populate('section', 'sectionName year semester')
      .select('-password');

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId, sectionId, rollNumber } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: role === "student" ? departmentId : undefined,
      section: role === "student" ? sectionId : undefined,
      rollNumber: role === "student" ? rollNumber : undefined
    });

    res.status(201).json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, departmentId, sectionId, rollNumber } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      user.password = password; // Password will be hashed by pre-save hook
    }
    if (departmentId !== undefined) user.department = departmentId || undefined;
    if (sectionId !== undefined) user.section = sectionId || undefined;
    if (rollNumber !== undefined) user.rollNumber = rollNumber || undefined;

    await user.save();
    const updated = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('section', 'sectionName year semester')
      .select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/reset-user-password
const resetUserPasswordByEmail = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    user.password = newPassword;
    await user.save();

    res.json({ message: `Password reset successfully for ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== SUBJECT MANAGEMENT ==========

// @route GET /api/admin/subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .populate('assignedFaculty', 'name email')
      .populate('department', 'name code')
      .populate('section', 'sectionName year semester');
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/subjects
const createSubject = async (req, res) => {
  try {
    const { name, code, departmentId, year, semester, sectionId, facultyId } = req.body;

    if (!departmentId || !year || !semester || !sectionId) {
      return res.status(400).json({
        message: "Department, year, semester and section are required"
      });
    }

    const subject = await Subject.create({
      name,
      code,
      department: departmentId,
      year,
      semester,
      section: sectionId,
      assignedFaculty: facultyId || null
    });

    res.status(201).json(subject);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @route PUT /api/admin/subjects/:id
const updateSubject = async (req, res) => {
  try {
    const { name, code, departmentId, year, semester, sectionId, facultyId } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (departmentId) updateData.department = departmentId;
    if (year) updateData.year = year;
    if (semester) updateData.semester = semester;
    if (sectionId) updateData.section = sectionId;
    if (facultyId !== undefined) updateData.assignedFaculty = facultyId || null;

    const subject = await Subject.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedFaculty', 'name email')
      .populate('department', 'name code')
      .populate('section', 'sectionName year semester');
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/admin/subjects/:id
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/subjects/:id/assign
const assignFaculty = async (req, res) => {
  try {
    const { facultyId } = req.body;
    const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { assignedFaculty: facultyId },
      { new: true }
    ).populate('assignedFaculty', 'name email');

    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;

    const dept = await Department.create({ name, code });

    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSection = async (req, res) => {
  try {
    const { departmentId, year, semester, sectionName } = req.body;

    const section = await Section.create({
      department: departmentId,
      year,
      semester,
      sectionName
    });

    res.status(201).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSections = async (req, res) => {
  try {
    const sections = await Section.find().populate("department");
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const faculty = await User.countDocuments({ role: "faculty" });
    const departments = await Department.countDocuments();
    const subjects = await Subject.countDocuments();

    res.json({ students, faculty, departments, subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const { departmentId, year, semester, sectionName } = req.body;
    const section = await Section.findByIdAndUpdate(
      req.params.id,
      { 
        department: departmentId, 
        year, 
        semester, 
        sectionName 
      },
      { new: true, runValidators: true }
    ).populate('department');
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSection = async (req, res) => {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers, createUser, updateUser, deleteUser, resetUserPassword, resetUserPasswordByEmail,
  getSubjects, createSubject, updateSubject, deleteSubject,getDashboardStats,assignFaculty,
  createDepartment,getDepartments,updateDepartment,deleteDepartment,
  createSection, getSections,updateSection,deleteSection
};