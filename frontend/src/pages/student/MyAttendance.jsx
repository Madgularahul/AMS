import { useState, useEffect } from 'react';
import api from '../../utils/api';
import QuickActions from '../../components/QuickActions';

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({
    subjectId: '',
    status: '',
    startDate: '',
    endDate: '',
    month: '',
    week: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, records]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/attendance');
      setRecords(data);
      // Extract unique subjects
      const unique = {};
      data.forEach((r) => { if (r.subject) unique[r.subject._id] = r.subject; });
      setSubjects(Object.values(unique));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filteredData = [...records];

    // Filter by subject
    if (filters.subjectId) {
      filteredData = filteredData.filter(r => r.subject?._id === filters.subjectId);
    }

    // Filter by status
    if (filters.status) {
      filteredData = filteredData.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Filter by date range
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter(r => new Date(r.date) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(r => new Date(r.date) <= end);
    }

    // Filter by month
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      filteredData = filteredData.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getFullYear() === parseInt(year) && 
               recordDate.getMonth() + 1 === parseInt(month);
      });
    }

    // Filter by week
    if (filters.week) {
      const [year, week] = filters.week.split('-W');
      const startOfWeek = getStartOfWeek(parseInt(year), parseInt(week));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      filteredData = filteredData.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      });
    }

    setFiltered(filteredData);
  };

  const getStartOfWeek = (year, week) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.subjectId) params.append('subjectId', filters.subjectId);

      const response = await api.get(`/student/attendance/export?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my-attendance-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    const week = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00897b 0%, #26a69a 100%)',
        borderRadius: '12px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,137,123,0.2)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          📋 My Attendance Records
        </div>
        <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '0.5rem' }}>
          View and filter your complete attendance history
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102,126,234,0.2)'
      }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.75rem' }}>
          🔍 Filter Records
        </h3>
        <div className="form-row">
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>Subject</label>
            <select
              value={filters.subjectId}
              onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
              style={{ background: 'white', color: '#333' }}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ background: 'white', color: '#333' }}
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, month: '', week: '' })}
              style={{ background: 'white', color: '#333' }}
            />
          </div>
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, month: '', week: '' })}
              style={{ background: 'white', color: '#333' }}
            />
          </div>
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value, startDate: '', endDate: '', week: '' })}
              style={{ background: 'white', color: '#333' }}
            />
          </div>
          <div className="form-group">
            <label style={{ color: 'white', fontWeight: 600 }}>Week</label>
            <input
              type="week"
              value={filters.week}
              onChange={(e) => setFilters({ ...filters, week: e.target.value, startDate: '', endDate: '', month: '' })}
              style={{ background: 'white', color: '#333' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => setFilters({ subjectId: '', status: '', startDate: '', endDate: '', month: '', week: '' })}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              fontWeight: 600
            }}
          >
            🔄 Clear Filters
          </button>
          <button 
            className="btn btn-primary" 
            onClick={exportToExcel}
            style={{ 
              background: 'white', 
              color: '#667eea',
              fontWeight: 600,
              border: 'none'
            }}
          >
            📊 Export to Excel
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(17,153,142,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {filtered.filter((r) => r.status === 'Present').length}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Present Days</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(250,112,154,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {filtered.filter((r) => r.status === 'Absent').length}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Absent Days</div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(79,172,254,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {filtered.length}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Records</div>
        </div>
      </div>

      {/* Records */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ 
            margin: 0, 
            border: 'none', 
            padding: 0,
            color: '#00897b',
            fontSize: '1.3rem'
          }}>
            📚 Attendance Records
          </h3>
          <span style={{ 
            fontSize: '0.95rem', 
            fontWeight: 600, 
            color: '#666',
            background: '#e0f2f1',
            padding: '0.5rem 1rem',
            borderRadius: '20px'
          }}>
            {filtered.filter((r) => r.status === 'Present').length} P / {filtered.filter((r) => r.status === 'Absent').length} A
          </span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  Loading...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                  <div style={{ color: '#00897b', fontSize: '1.1rem', fontWeight: 500 }}>No records found</div>
                  <div style={{ color: '#999', fontSize: '0.9rem', marginTop: '0.5rem' }}>Try adjusting your filters</div>
                </td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r._id} style={{ 
                  background: i % 2 === 0 ? '#fff' : '#f9f9f9',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2f1'}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f9f9f9'}
                >
                  <td style={{ fontWeight: 600 }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.subject?.name}</div>
                    <small style={{ color: '#888' }}>({r.subject?.code})</small>
                  </td>
                  <td>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <span className={`badge badge-${r.status.toLowerCase()}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      {r.status === 'Present' ? '✓' : '✗'} {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions filters={filters} />
    </div>
  );
}