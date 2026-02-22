import { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#1a237e', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    departmentId: '',
    sectionId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchDepartments();
    fetchSections();
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchTrends();
  }, [filters]);

  // Listen for real-time updates
  useEffect(() => {
    const handleRefresh = () => {
      fetchAnalytics();
      fetchTrends();
    };
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    try {
      const { data } = await api.get('/admin/sections');
      setSections(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSections = sections.filter(
    sec => !filters.departmentId || (sec.department?._id || sec.department)?.toString() === filters.departmentId
  );

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);

      const { data } = await api.get(`/reports/analytics?${params}`);
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const { data } = await api.get('/reports/trends?days=30');
      setTrends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.sectionId) params.append('sectionId', filters.sectionId);

      const response = await api.get(`/reports/export/excel?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  
  // Handle empty data gracefully
  if (!analytics || analytics.summary.totalRecords === 0) {
    return (
      <div>
        <div className="page-title">Analytics & Reports</div>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No Attendance Data Available</h3>
            <p>Start marking attendance to see analytics and reports.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Use the filters below to set a date range, or wait for attendance records to be created.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const subjectData = analytics.bySubject && analytics.bySubject.length > 0 
    ? analytics.bySubject.map(s => ({
        name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
        present: s.present,
        absent: s.absent,
        rate: parseFloat(((s.present / s.total) * 100).toFixed(2))
      }))
    : [];

  return (
    <div>
      <div className="page-title">Analytics & Reports</div>

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>
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
          <div className="form-group">
            <label>Department</label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value, sectionId: '' })}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={filters.sectionId}
              onChange={(e) => setFilters({ ...filters, sectionId: e.target.value })}
            >
              <option value="">All Sections</option>
              {filteredSections.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.sectionName} - Year {s.year}, Sem {s.semester}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={exportToExcel}>
              📊 Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-number">{analytics.summary.totalRecords}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#2e7d32' }}>
            {analytics.summary.presentCount}
          </div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#c62828' }}>
            {analytics.summary.absentCount}
          </div>
          <div className="stat-label">Absent</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#1a237e' }}>
            {analytics.summary.attendanceRate}%
          </div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {/* Trends Chart */}
      {trends.length > 0 && (
        <div className="card">
          <h3>Attendance Trends (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#1a237e" name="Attendance Rate %" />
              <Line type="monotone" dataKey="present" stroke="#2e7d32" name="Present" />
              <Line type="monotone" dataKey="absent" stroke="#c62828" name="Absent" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject Performance */}
      {subjectData.length > 0 && (
        <div className="card">
          <h3>Subject-wise Attendance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#2e7d32" name="Present" />
              <Bar dataKey="absent" fill="#c62828" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pie Chart */}
      {analytics.summary.totalRecords > 0 && (
        <div className="card">
          <h3>Overall Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Present', value: analytics.summary.presentCount },
                  { name: 'Absent', value: analytics.summary.absentCount }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#2e7d32" />
                <Cell fill="#c62828" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
