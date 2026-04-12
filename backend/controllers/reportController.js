const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Section = require('../models/Section');
const XLSX = require('xlsx');

// =============================
// GET Attendance Analytics
// =============================
const getAttendanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, sectionId } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Get all attendance records
    let attendanceRecords = await Attendance.find(filter)
      .populate({
        path: 'student',
        select: 'name email department section',
        populate: { path: 'department', select: 'name code' }
      })
      .populate('subject', 'name code department')
      .populate('markedBy', 'name');

    // Filter by department if specified
    if (departmentId) {
      attendanceRecords = attendanceRecords.filter(
        record => (record.student?.department?._id || record.student?.department)?.toString() === departmentId
      );
    }

    // Filter by section if specified
    if (sectionId) {
      attendanceRecords = attendanceRecords.filter(
        record => record.student?.section?.toString() === sectionId
      );
    }

    // Calculate statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

    // Return empty data structure if no records
    if (totalRecords === 0) {
      return res.json({
        summary: {
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          attendanceRate: 0
        },
        byDepartment: {},
        bySubject: []
      });
    }

    // By department
    const byDepartment = {};
    attendanceRecords.forEach(record => {
      const deptId = record.student?.department?._id?.toString() || 'unknown';
      if (!byDepartment[deptId]) {
        byDepartment[deptId] = { present: 0, absent: 0, total: 0 };
      }
      byDepartment[deptId].total++;
      if (record.status === 'Present') byDepartment[deptId].present++;
      else byDepartment[deptId].absent++;
    });

    // By subject
    const bySubject = {};
    attendanceRecords.forEach(record => {
      const subjId = record.subject?._id?.toString() || 'unknown';
      if (!bySubject[subjId]) {
        bySubject[subjId] = {
          name: record.subject?.name || 'Unknown',
          present: 0,
          absent: 0,
          total: 0
        };
      }
      bySubject[subjId].total++;
      if (record.status === 'Present') bySubject[subjId].present++;
      else bySubject[subjId].absent++;
    });

    res.json({
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate: parseFloat(attendanceRate)
      },
      byDepartment,
      bySubject: Object.values(bySubject)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// GET Attendance Trends
// =============================
const getAttendanceTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await Attendance.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Group by date
    const trends = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!trends[dateKey]) {
        trends[dateKey] = { present: 0, absent: 0, total: 0 };
      }
      trends[dateKey].total++;
      if (record.status === 'Present') trends[dateKey].present++;
      else trends[dateKey].absent++;
    });

    // Convert to array format for charts
    const trendArray = Object.keys(trends).map(date => ({
      date,
      present: trends[date].present,
      absent: trends[date].absent,
      total: trends[date].total,
      rate: trends[date].total > 0 
        ? ((trends[date].present / trends[date].total) * 100).toFixed(2)
        : 0
    }));

    res.json(trendArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Generate Attendance Report
// =============================
const generateAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, subjectId, studentId } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }
    if (subjectId) filter.subject = subjectId;
    if (studentId) filter.student = studentId;

    const records = await Attendance.find(filter)
      .populate('student', 'name email rollNumber department section')
      .populate('subject', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Filter by department if specified
    let filteredRecords = records;
    if (departmentId) {
      filteredRecords = records.filter(
        r => (r.student?.department?._id || r.student?.department)?.toString() === departmentId
      );
    }

    res.json({
      records: filteredRecords,
      total: filteredRecords.length,
      present: filteredRecords.filter(r => r.status === 'Present').length,
      absent: filteredRecords.filter(r => r.status === 'Absent').length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Generate Student Report
// =============================
const generateStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { student: studentId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const student = await User.findById(studentId)
      .populate('department', 'name code')
      .populate('section', 'sectionName year semester')
      .select('-password');

    // Calculate by subject
    const bySubject = {};
    records.forEach(record => {
      const subjId = record.subject._id.toString();
      if (!bySubject[subjId]) {
        bySubject[subjId] = {
          subject: record.subject,
          present: 0,
          absent: 0,
          total: 0
        };
      }
      bySubject[subjId].total++;
      if (record.status === 'Present') bySubject[subjId].present++;
      else bySubject[subjId].absent++;
    });

    const subjectStats = Object.values(bySubject).map(s => ({
      ...s,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00'
    }));

    res.json({
      student,
      records,
      summary: {
        total: records.length,
        present: records.filter(r => r.status === 'Present').length,
        absent: records.filter(r => r.status === 'Absent').length
      },
      bySubject: subjectStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Generate Subject Report
// =============================
const generateSubjectReport = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { subject: subjectId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const subject = await Subject.findById(subjectId)
      .populate('department', 'name code')
      .populate('assignedFaculty', 'name email');

    // Calculate by student
    const byStudent = {};
    records.forEach(record => {
      const studId = record.student._id.toString();
      if (!byStudent[studId]) {
        byStudent[studId] = {
          student: record.student,
          present: 0,
          absent: 0,
          total: 0
        };
      }
      byStudent[studId].total++;
      if (record.status === 'Present') byStudent[studId].present++;
      else byStudent[studId].absent++;
    });

    const studentStats = Object.values(byStudent).map(s => ({
      ...s,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00'
    }));

    res.json({
      subject,
      records,
      summary: {
        total: records.length,
        present: records.filter(r => r.status === 'Present').length,
        absent: records.filter(r => r.status === 'Absent').length
      },
      byStudent: studentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Export to Excel
// =============================
const exportToExcel = async (req, res) => {
  try {
    const { startDate, endDate, departmentId, sectionId } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    let records = await Attendance.find(filter)
      .populate({ path: 'student', select: 'name email rollNumber', populate: [
        { path: 'department', select: 'name code' },
        { path: 'section', select: 'sectionName year semester' }
      ]})
      .populate('subject', 'name code')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Filter by department if specified
    if (departmentId) {
      records = records.filter(r => r.student?.department?._id?.toString() === departmentId || r.student?.department?.toString() === departmentId);
    }
    // Filter by section if specified
    if (sectionId) {
      records = records.filter(r => r.student?.section?._id?.toString() === sectionId || r.student?.section?.toString() === sectionId);
    }

    // Prepare data for Excel
    const excelData = records.map(r => ({
      'Date': new Date(r.date).toLocaleDateString(),
      'Student Name': r.student?.name || 'N/A',
      'Roll Number': r.student?.rollNumber || 'N/A',
      'Email': r.student?.email || 'N/A',
      'Department': r.student?.department?.name || 'N/A',
      'Section': r.student?.section?.sectionName ? `${r.student.section.sectionName} (Y${r.student.section.year}S${r.student.section.semester})` : 'N/A',
      'Subject': r.subject?.name || 'N/A',
      'Subject Code': r.subject?.code || 'N/A',
      'Status': r.status,
      'Marked By': r.markedBy?.name || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================
// Generate Section Report
// =============================
const generateSectionReport = async (req, res) => {
  try {
    const { sectionId, startDate, endDate } = req.query;

    if (!sectionId) {
      return res.status(400).json({ message: 'sectionId is required' });
    }

    // Get section details
    const section = await Section.findById(sectionId).populate('department');
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get all students in this section
    const students = await User.find({ section: sectionId, role: 'student' })
      .populate('department', 'name code')
      .select('-password');

    // If no students in section, return empty report
    if (students.length === 0) {
      return res.json({
        section,
        summary: {
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          attendanceRate: 0,
          totalStudents: 0
        },
        periodData: [],
        byStudent: [],
        bySubject: []
      });
    }

    // Calculate date range
    const filter = {
      student: { $in: students.map(s => s._id) }
    };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Get all attendance records for students in this section
    const attendanceRecords = await Attendance.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Calculate date-wise data for trend chart
    const periodDataMap = {};
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      
      if (!periodDataMap[dateKey]) {
        periodDataMap[dateKey] = { present: 0, absent: 0, total: 0 };
      }
      periodDataMap[dateKey].total++;
      if (record.status === 'Present') periodDataMap[dateKey].present++;
      else periodDataMap[dateKey].absent++;
    });

    const periodData = Object.keys(periodDataMap)
      .sort()
      .map(key => ({
        period: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: periodDataMap[key].present,
        absent: periodDataMap[key].absent,
        total: periodDataMap[key].total,
        rate: periodDataMap[key].total > 0
          ? ((periodDataMap[key].present / periodDataMap[key].total) * 100).toFixed(2)
          : '0.00'
      }));

    // Calculate by student
    const byStudentMap = {};
    attendanceRecords.forEach(record => {
      const studId = record.student._id.toString();
      if (!byStudentMap[studId]) {
        byStudentMap[studId] = {
          student: record.student,
          present: 0,
          absent: 0,
          total: 0
        };
      }
      byStudentMap[studId].total++;
      if (record.status === 'Present') byStudentMap[studId].present++;
      else byStudentMap[studId].absent++;
    });

    const byStudent = Object.values(byStudentMap).map(s => ({
      ...s,
      totalClasses: s.total,
      presentCount: s.present,
      absentCount: s.absent,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00'
    })).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

    // Calculate by subject
    const bySubjectMap = {};
    attendanceRecords.forEach(record => {
      const subjId = record.subject?._id?.toString() || 'unknown';
      if (!bySubjectMap[subjId]) {
        bySubjectMap[subjId] = {
          name: record.subject?.name || 'Unknown',
          present: 0,
          absent: 0,
          total: 0
        };
      }
      bySubjectMap[subjId].total++;
      if (record.status === 'Present') bySubjectMap[subjId].present++;
      else bySubjectMap[subjId].absent++;
    });

    const bySubject = Object.values(bySubjectMap).map(s => ({
      name: s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name,
      present: s.present,
      absent: s.absent,
      total: s.total
    }));

    // Summary
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : '0.00';

    // Handle empty data case
    if (totalRecords === 0) {
      return res.json({
        section,
        summary: {
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          attendanceRate: 0,
          totalStudents: students.length
        },
        periodData: [],
        byStudent: [],
        bySubject: []
      });
    }

    res.json({
      section,
      summary: {
        totalRecords,
        presentCount,
        absentCount,
        attendanceRate: parseFloat(attendanceRate),
        totalStudents: students.length
      },
      periodData,
      byStudent,
      bySubject
    });
  } catch (error) {
    console.error('Section report error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate section report' });
  }
};

// =============================
// Export Section Report to Excel
// =============================
const exportSectionReportExcel = async (req, res) => {
  try {
    const { sectionId, startDate, endDate } = req.query;

    if (!sectionId) {
      return res.status(400).json({ message: 'sectionId is required' });
    }

    // Get section details
    const section = await Section.findById(sectionId).populate('department');
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get students
    const students = await User.find({ section: sectionId, role: 'student' }).select('-password');
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this section' });
    }

    const filter = {
      student: { $in: students.map(s => s._id) }
    };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Prepare Excel data
    const excelData = attendanceRecords.map(r => ({
      'Date': new Date(r.date).toLocaleDateString(),
      'Student Name': r.student?.name || 'N/A',
      'Roll Number': r.student?.rollNumber || 'N/A',
      'Email': r.student?.email || 'N/A',
      'Subject': r.subject?.name || 'N/A',
      'Subject Code': r.subject?.code || 'N/A',
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    
    // Add summary sheet
    const dateRange = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
      : 'All time';
    
    const summaryData = [
      ['Section Report Summary'],
      ['Section', section.sectionName],
      ['Department', section.department?.name || 'N/A'],
      ['Year/Semester', `Year ${section.year}, Sem ${section.semester}`],
      ['Date Range', dateRange],
      [''],
      ['Total Records', attendanceRecords.length],
      ['Present', attendanceRecords.filter(r => r.status === 'Present').length],
      ['Absent', attendanceRecords.filter(r => r.status === 'Absent').length]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Data');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=section-report-${section.sectionName}-${startDate || 'all'}-to-${endDate || 'now'}-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export section report error:', error);
    res.status(500).json({ message: error.message || 'Failed to export section report' });
  }
};

// =============================
// Export to PDF
// =============================
const exportToPDF = async (req, res) => {
  try {
    // For now, return JSON. Can integrate with PDF library later
    res.json({ message: 'PDF export coming soon. Use Excel export for now.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateAttendanceReport,
  generateStudentReport,
  generateSubjectReport,
  generateSectionReport,
  exportToExcel,
  exportSectionReportExcel,
  exportToPDF,
  getAttendanceAnalytics,
  getAttendanceTrends
};
