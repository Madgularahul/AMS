const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

// @route GET /api/student/attendance
const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('subject', 'name code')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/percentage
const getAttendancePercentage = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).populate('subject', 'name code');

    // Group by subject
    const subjectMap = {};
    records.forEach((record) => {
      const key = record.subject._id.toString();
      if (!subjectMap[key]) {
        subjectMap[key] = {
          subject: record.subject,
          total: 0,
          present: 0,
        };
      }
      subjectMap[key].total += 1;
      if (record.status === 'Present') subjectMap[key].present += 1;
    });

    const result = Object.values(subjectMap).map((s) => ({
      subject: s.subject,
      totalClasses: s.total,
      presentCount: s.present,
      absentCount: s.total - s.present,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : '0.00',
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/trends
const getAttendanceTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await Attendance.find({
      student: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('subject', 'name code')
      .sort({ date: 1 });

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

    // Generate all dates in the range to ensure continuous data
    const trendArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dayData = trends[dateKey] || { present: 0, absent: 0, total: 0 };
        
        trendArray.push({
          date: dateKey,
          present: dayData.present,
          absent: dayData.absent,
          total: dayData.total,
          rate: dayData.total > 0
            ? ((dayData.present / dayData.total) * 100).toFixed(2)
            : '0.00'
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(trendArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/calendar
const getAttendanceCalendar = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1, 1);
    const endDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      student: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('subject', 'name code')
      .sort({ date: 1 });

    // Group by date
    const calendarData = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = {
          date: dateKey,
          records: [],
          presentCount: 0,
          absentCount: 0
        };
      }
      calendarData[dateKey].records.push({
        subject: record.subject,
        status: record.status
      });
      if (record.status === 'Present') calendarData[dateKey].presentCount++;
      else calendarData[dateKey].absentCount++;
    });

    res.json(Object.values(calendarData));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/insights
const getAttendanceInsights = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('subject', 'name code');

    // Calculate insights
    const subjectMap = {};
    records.forEach(record => {
      const key = record.subject._id.toString();
      if (!subjectMap[key]) {
        subjectMap[key] = {
          subject: record.subject,
          total: 0,
          present: 0,
          absent: 0
        };
      }
      subjectMap[key].total++;
      if (record.status === 'Present') subjectMap[key].present++;
      else subjectMap[key].absent++;
    });

    const insights = Object.values(subjectMap).map(s => {
      const pct = s.total > 0 ? (s.present / s.total) * 100 : 0;
      const targetPct = 75;
      const classesNeeded = pct < targetPct
        ? Math.ceil((targetPct * s.total - s.present * 100) / (100 - targetPct))
        : 0;

      return {
        subject: s.subject,
        percentage: pct.toFixed(2),
        totalClasses: s.total,
        presentCount: s.present,
        absentCount: s.absent,
        classesNeededFor75: classesNeeded,
        status: pct >= 75 ? 'good' : pct >= 60 ? 'warning' : 'danger'
      };
    });

    // Overall stats
    const totalClasses = records.length;
    const presentClasses = records.filter(r => r.status === 'Present').length;
    const overallPct = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
    const overallClassesNeeded = overallPct < 75
      ? Math.ceil((75 * totalClasses - presentClasses * 100) / 25)
      : 0;

    res.json({
      overall: {
        percentage: overallPct.toFixed(2),
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        classesNeededFor75: overallClassesNeeded,
        status: overallPct >= 75 ? 'good' : overallPct >= 60 ? 'warning' : 'danger'
      },
      bySubject: insights
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/subject/:subjectId
const getSubjectAttendanceDetails = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = {
      student: req.user._id,
      subject: subjectId
    };

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

    const subject = await Subject.findById(subjectId);

    // Calculate statistics
    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : '0.00';

    // Group by date for pattern analysis
    const byDate = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, status: record.status };
      }
    });

    // Find absent patterns (day of week)
    const dayPattern = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    records.filter(r => r.status === 'Absent').forEach(record => {
      const day = new Date(record.date).getDay();
      dayPattern[day]++;
    });

    res.json({
      subject,
      records,
      summary: {
        total,
        present,
        absent,
        percentage: parseFloat(percentage)
      },
      byDate: Object.values(byDate),
      dayPattern
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/student/attendance/export
const exportMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, subjectId } = req.query;
    const XLSX = require('xlsx');

    const filter = { student: req.user._id };
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

    const records = await Attendance.find(filter)
      .populate('subject', 'name code')
      .sort({ date: -1 });

    const excelData = records.map(r => ({
      'Date': new Date(r.date).toLocaleDateString(),
      'Subject': r.subject?.name || 'N/A',
      'Subject Code': r.subject?.code || 'N/A',
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=my-attendance-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyAttendance,
  getAttendancePercentage,
  getAttendanceTrends,
  getAttendanceCalendar,
  getAttendanceInsights,
  getSubjectAttendanceDetails,
  exportMyAttendance
};