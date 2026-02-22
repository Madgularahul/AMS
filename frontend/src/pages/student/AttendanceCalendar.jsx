import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AttendanceCalendar() {
  const [calendarData, setCalendarData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedMonth, selectedYear]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/student/attendance/calendar?year=${selectedYear}&month=${selectedMonth}`);
      setCalendarData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData.find(d => d.date === dateStr);
    days.push({
      day,
      date: dateStr,
      data: dayData
    });
  }

  const getDayColor = (dayData) => {
    if (!dayData || !dayData.data) return '#f5f5f5';
    if (dayData.data.presentCount > 0 && dayData.data.absentCount === 0) return '#c8e6c9';
    if (dayData.data.absentCount > 0 && dayData.data.presentCount === 0) return '#ffcdd2';
    if (dayData.data.presentCount > 0 && dayData.data.absentCount > 0) return '#fff9c4';
    return '#f5f5f5';
  };

  const getDayStatus = (dayData) => {
    if (!dayData || !dayData.data) return 'No classes';
    if (dayData.data.presentCount > 0 && dayData.data.absentCount === 0) return 'All Present';
    if (dayData.data.absentCount > 0 && dayData.data.presentCount === 0) return 'All Absent';
    if (dayData.data.presentCount > 0 && dayData.data.absentCount > 0) return 'Mixed';
    return 'No classes';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayData = calendarData.find(d => d.date === selectedDate);

  return (
    <div>
      <div className="page-title">Attendance Calendar</div>

      {/* Month/Year Selector */}
      <div className="card">
        <div className="form-row" style={{ maxWidth: '400px' }}>
          <div className="form-group">
            <label>Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
            />
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <h3>{monthNames[selectedMonth - 1]} {selectedYear}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '0.5rem', color: '#666' }}>
              {day}
            </div>
          ))}
          {days.map((dayData, idx) => (
            <div
              key={idx}
              onClick={() => dayData && setSelectedDate(dayData.date)}
              style={{
                aspectRatio: '1',
                backgroundColor: getDayColor(dayData),
                border: selectedDate === dayData?.date ? '3px solid #1a237e' : '1px solid #ddd',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: dayData ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60px'
              }}
            >
              {dayData && (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{dayData.day}</div>
                  {dayData.data && (
                    <div style={{ fontSize: '0.7rem', textAlign: 'center' }}>
                      <div style={{ color: '#2e7d32' }}>✓ {dayData.data.presentCount}</div>
                      {dayData.data.absentCount > 0 && (
                        <div style={{ color: '#c62828' }}>✗ {dayData.data.absentCount}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#c8e6c9', border: '1px solid #ddd', borderRadius: '4px' }}></div>
            <span>All Present</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffcdd2', border: '1px solid #ddd', borderRadius: '4px' }}></div>
            <span>All Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fff9c4', border: '1px solid #ddd', borderRadius: '4px' }}></div>
            <span>Mixed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}></div>
            <span>No Classes</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && selectedDayData && (
        <div className="card">
          <h3>Details for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          <p><strong>Status:</strong> {getDayStatus({ data: selectedDayData })}</p>
          {selectedDayData.records.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayData.records.map((r, i) => (
                    <tr key={i}>
                      <td>{r.subject?.name}</td>
                      <td>{r.subject?.code}</td>
                      <td>
                        <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
