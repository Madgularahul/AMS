const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require("../models/Department");
const Section = require("../models/Section");

// ========== USER MANAGEMENT ==========

// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { role, department, year, semester, section } = req.query;

    const filter = {};
    if (role) {
      filter.role = role;
    } else {
      filter.role = { $ne: 'admin' };
    }

    if (department) filter.department = department;

    if (year || semester || section) {
      if (section) {
        filter.section = section;
      } else {
        const secQuery = {};
        if (department) secQuery.department = department;
        if (year) secQuery.year = year;
        if (semester) secQuery.semester = semester;
        const matchingSections = await Section.find(secQuery).select('_id');
        const sectionIds = matchingSections.map(s => s._id);
        filter.section = { $in: sectionIds };
      }
    }

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
      department: (role === "student" || role === "faculty") ? departmentId : undefined,
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

// @route POST /api/admin/users/bulk
const createBulkUsers = async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: "Invalid payload format. Expected an array of users." });
    }

    let successCount = 0;
    const failedRows = [];

    // Process sequentially to prevent DB race conditions with Departments/Sections
    for (let i = 0; i < users.length; i++) {
      const row = users[i];
      try {
        const role = row.role?.toLowerCase()?.trim() || "student";
        const email = row.email?.toLowerCase()?.trim();
        const name = row.name?.trim();
        const password = row.password?.toString()?.trim() || email; // default: email itself
        const rollNumber = row.rollNumber?.toString()?.trim() || undefined;
        
        const deptStr = row.department?.toString()?.trim();
        const deptCodeRaw = row.departmentCode?.toString()?.trim()?.toUpperCase();
        // Validate dept code: use provided value (max 3 chars), or auto-derive
        const deptCodeProvided = deptCodeRaw ? deptCodeRaw.slice(0, 3) : null;
        const secStr = row.section?.toString()?.trim()?.toUpperCase();
        
        // Handle variations of year/sem in excel
        const year = parseInt(row.year);
        const semester = parseInt(row.semester || row.sem); 

        if (!email || !name) throw new Error("Missing name or email");

        // Resolving Department
        let deptId = null;
        if (deptStr) {
          // Escape regex special chars (e.g. parentheses in "AI&ML")
          const escapedDept = deptStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          let dept = await Department.findOne({
            $or: [
              { name: new RegExp(`^${escapedDept}$`, "i") },
              { code: new RegExp(`^${escapedDept}$`, "i") }
            ]
          });
          
          if (!dept) {
            if (!deptCodeProvided) {
              // Auto-derive 3-letter code if none provided
              const words = deptStr.trim().split(/\s+/);
              const autoCode = words.length >= 2
                ? words.slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3)
                : deptStr.slice(0, 3).toUpperCase();
              dept = await Department.create({ name: deptStr, code: autoCode });
            } else {
              dept = await Department.create({ name: deptStr, code: deptCodeProvided });
            }
          }
          deptId = dept._id;
        }

        if ((role === "student" || role === "faculty") && !deptId) {
          throw new Error("Department is strictly required for this role");
        }

        // Resolving Section
        let secId = null;
        if (role === "student") {
          if (!secStr || isNaN(year) || isNaN(semester)) {
            throw new Error("Section Name, Year, and Semester are all required for students");
          }

          let section = await Section.findOne({
            department: deptId,
            sectionName: secStr,
            year,
            semester
          });

          if (!section) {
            section = await Section.create({
              department: deptId,
              sectionName: secStr,
              year,
              semester
            });
          }
          secId = section._id;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) throw new Error(`Email ${email} already exists`);
        
        if (role === 'student' && rollNumber) {
          const existingRoll = await User.findOne({ rollNumber, role: 'student' });
          if (existingRoll) throw new Error(`Roll number ${rollNumber} already exists`);
        }

        try {
          await User.create({
            name,
            email,
            password,
            role,
            department: deptId,
            section: secId,
            rollNumber: role === "student" ? rollNumber : undefined
          });
        } catch (dbErr) {
          if (dbErr.code === 11000) {
            const field = Object.keys(dbErr.keyPattern || {})[0] || 'field';
            throw new Error(`Duplicate value for ${field} — already exists in database`);
          }
          throw dbErr;
        }

        successCount++;
      } catch (err) {
        row.ErrorReason = err.message;
        failedRows.push(row);
      }
    }

    res.json({ successCount, failedRows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If deleting a student, also delete their attendance records
    if (user.role === 'student') {
      const Attendance = require('../models/Attendance');
      await Attendance.deleteMany({ student: req.params.id });
    }

    // If deleting a faculty, unassign them from subjects
    if (user.role === 'faculty') {
      await Subject.updateMany(
        { assignedFaculty: req.params.id },
        { $unset: { assignedFaculty: 1 } }
      );
    }

    await User.findByIdAndDelete(req.params.id);
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
    const { name, code, departmentId, year, semester, sectionIds, facultyId } = req.body;

    if (!departmentId || !year || !semester || !sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({
        message: "Department, year, semester and at least one section are required"
      });
    }

    if (facultyId) {
      const facultyObj = await User.findById(facultyId);
      if (!facultyObj || facultyObj.role !== 'faculty') {
        return res.status(400).json({ message: "Invalid faculty selected" });
      }
      if (facultyObj.department.toString() !== departmentId.toString()) {
        return res.status(400).json({ message: "Teacher must be from the same department as the subject" });
      }
    }

    const createdSubjects = [];
    const errors = [];

    for (const sectionId of sectionIds) {
      try {
        const subject = await Subject.create({
          name,
          code,
          department: departmentId,
          year,
          semester,
          section: sectionId,
          assignedFaculty: facultyId || null
        });
        createdSubjects.push(subject);
      } catch (err) {
        if (err.code === 11000) {
          errors.push(`A subject with code ${code} already exists for this section.`);
        } else {
          errors.push(err.message);
        }
      }
    }

    if (createdSubjects.length === 0) {
      return res.status(400).json({ message: errors[0] || "Failed to create subjects" });
    }

    res.status(201).json(createdSubjects[0]); // Return first one for simpler frontend compatibility if needed, or handle array

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @route PUT /api/admin/subjects/:id
const updateSubject = async (req, res) => {
  try {
    const { name, code, departmentId, year, semester, sectionId, facultyId } = req.body;
    const subjectToUpdate = await Subject.findById(req.params.id);
    if (!subjectToUpdate) return res.status(404).json({ message: 'Subject not found' });

    const targetDeptId = departmentId || subjectToUpdate.department;
    const targetFacultyId = facultyId !== undefined ? facultyId : subjectToUpdate.assignedFaculty;

    if (targetFacultyId) {
      const facultyObj = await User.findById(targetFacultyId);
      if (facultyObj && facultyObj.department.toString() !== targetDeptId.toString()) {
        return res.status(400).json({ message: "Teacher must be from the same department as the subject" });
      }
    }

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
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    if (facultyId) {
      const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
      if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

      if (faculty.department.toString() !== subject.department.toString()) {
        return res.status(400).json({ message: 'Teacher must be from the same department as the subject' });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { assignedFaculty: facultyId || null },
      { new: true }
    ).populate('assignedFaculty', 'name email');

    res.json(updatedSubject);
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

// @route POST /api/admin/students/promote
const promoteStudents = async (req, res) => {
  try {
    const { sectionId } = req.body;
    if (!sectionId) return res.status(400).json({ message: 'sectionId is required' });

    const currentSection = await Section.findById(sectionId);
    if (!currentSection) return res.status(404).json({ message: 'Section not found' });

    const { department, year, semester, sectionName } = currentSection;

    // Determine next academic period
    let nextYear = year;
    let nextSemester;
    if (semester === 1) {
      nextSemester = 2;
    } else {
      // semester 2 -> next year, semester 1
      nextYear = year + 1;
      nextSemester = 1;
      if (nextYear > 4) {
        return res.status(400).json({ message: 'Students in Year 4 Sem 2 cannot be promoted further.' });
      }
    }

    // Find or create target section
    let targetSection = await Section.findOne({
      department,
      year: nextYear,
      semester: nextSemester,
      sectionName
    });

    if (!targetSection) {
      targetSection = await Section.create({
        department,
        year: nextYear,
        semester: nextSemester,
        sectionName
      });
    }

    // Find all students in current section
    const students = await User.find({ role: 'student', section: sectionId });
    if (students.length === 0) {
      return res.status(200).json({ message: 'No students found in this section. Nothing was updated.', updatedCount: 0 });
    }

    // Move students to target section
    const result = await User.updateMany(
      { role: 'student', section: sectionId },
      { $set: { section: targetSection._id } }
    );

    res.json({
      message: `Successfully promoted ${result.modifiedCount} student(s) from Year ${year} Sem ${semester} → Year ${nextYear} Sem ${nextSemester}.`,
      updatedCount: result.modifiedCount,
      targetSection: { year: nextYear, semester: nextSemester, sectionName }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers, createUser, createBulkUsers, updateUser, deleteUser, resetUserPassword, resetUserPasswordByEmail,
  getSubjects, createSubject, updateSubject, deleteSubject,getDashboardStats,assignFaculty,
  createDepartment,getDepartments,updateDepartment,deleteDepartment,
  createSection, getSections,updateSection,deleteSection,
  promoteStudents
};