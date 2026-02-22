import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function SubjectDetails() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [details, setDetails] = useState(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      socket.on('my-attendance-updated', () => {
        fetchDetails();
      });
    }
    return () => {
      if (socket) {
        socket.off('my-attendance-updated');
      }
    };
  }, [socket, subjectId]);

  useEffect(() => {
    fetchDetails();
  }, [subjectId, filters]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const { data } = await api.get(`/student/attendance/subject/${subjectId}?${params}`);
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportSubjectReport = async () => {
    try {
      const params = new URLSearchParams({ subjectId });
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/student/attendance/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${details.subject.name}-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!details) return <div>Subject not found</div>;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayPatternData = Object.keys(details.dayPattern).map(day => ({
    day: dayNames[parseInt(day)],
    absent: details.dayPattern[day]
  }));

  const classesNeeded = details.summary.percentage < 75
    ? Math.ceil((75 * details.summary.total - details.summary.present * 100) / 25)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">{details.subject.name} - Attendance Details</div>
        <button className="btn" onClick={() => navigate('/student/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-number">{details.summary.total}</div>
          <div className="stat-label">Total Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2e7d32' }}>
            {details.summary.present}
          </div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#c62828' }}>
            {details.summary.absent}
          </div>
          <div className="stat-label">Absent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ 
            color: details.summary.percentage >= 75 ? '#2e7d32' : details.summary.percentage >= 60 ? '#f57f17' : '#c62828' 
          }}>
            {details.summary.percentage}%
          </div>
          <div className="stat-label">Attendance</div>
        </div>
      </div>

      {/* Attendance Insights */}
      {details.summary.percentage < 75 && (
        <div className="card">
          <div className="alert alert-error">
            <strong>⚠ Low Attendance Alert:</strong> Your attendance is {details.summary.percentage}%.
            {classesNeeded > 0 && (
              <span> You need to attend {classesNeeded} more classes to reach 75%.</span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <h3>Filter by Date Range</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={exportSubjectReport}>
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Day Pattern Chart */}
      {dayPatternData.some(d => d.absent > 0) && (
        <div className="card">
          <h3>Absent Pattern by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayPatternData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="absent" fill="#c62828" name="Absent Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attendance Records */}
      <div className="card">
        <h3>Attendance History</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Day</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {details.records.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa' }}>No records found</td></tr>
              ) : (
                details.records.map((r, i) => (
                  <tr key={r._id}>
                    <td>{i + 1}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{dayNames[new Date(r.date).getDay()]}</td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
