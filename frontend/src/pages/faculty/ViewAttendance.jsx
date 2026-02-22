import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ViewAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState({ sectionId: '', subjectId: '', date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/faculty/subjects').then(({ data }) => setSubjects(data)).catch(console.error);
  }, []);

  // Get unique sections from faculty's assigned subjects
  const sections = [...new Map(
    subjects.filter(s => s.section).map(s => [s.section._id, s.section])
  ).values()];

  const filteredSubjects = filter.sectionId
    ? subjects.filter(s => s.section?._id === filter.sectionId)
    : subjects;

  const fetchRecords = async () => {
    if (!filter.subjectId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: filter.subjectId });
      if (filter.date) params.append('date', filter.date);
      const { data } = await api.get(`/faculty/attendance?${params}`);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionId) => {
    setFilter({ ...filter, sectionId, subjectId: '' });
    setRecords([]);
  };

  const selectedSubjectInfo = subjects.find(s => s._id === filter.subjectId);

  // Calculate statistics
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  // Group records by date
  const recordsByDate = records.reduce((acc, record) => {
    const dateKey = new Date(record.date).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div className="page-title" style={{ marginBottom: '0.5rem' }}>
            📊 View Attendance Records
          </div>
          <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
            View and analyze attendance history for your classes
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔍 Filter Records
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              Section
            </label>
            <select
              value={filter.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Section --</option>
              {sections.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.sectionName} - Year {sec.year}, Sem {sec.semester}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              Subject
            </label>
            <select
              value={filter.subjectId}
              onChange={(e) => setFilter({ ...filter, subjectId: e.target.value })}
              disabled={!filter.sectionId}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: !filter.sectionId ? 0.6 : 1
              }}
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.9)'
            }}>
              Date (optional)
            </label>
            <input 
              type="date" 
              value={filter.date} 
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>
        <button 
          onClick={fetchRecords} 
          disabled={!filter.subjectId || loading}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: (!filter.subjectId || loading) ? 'rgba(255,255,255,0.3)' : 'white',
            color: (!filter.subjectId || loading) ? 'rgba(255,255,255,0.6)' : '#667eea',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: (!filter.subjectId || loading) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <span>⏳</span>
              Loading...
            </>
          ) : (
            <>
              <span>🔍</span>
              Fetch Records
            </>
          )}
        </button>
      </div>

      {/* Selected Subject Info */}
      {selectedSubjectInfo && records.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '2.5rem' }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {selectedSubjectInfo.name}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {selectedSubjectInfo.code} • {selectedSubjectInfo.section?.department?.name || 'N/A'} • Section {selectedSubjectInfo.section?.sectionName}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {records.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{records.length}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Records</div>
          </div>
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{presentCount}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Present</div>
          </div>
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{absentCount}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Absent</div>
          </div>
          <div style={{
            padding: '1.5rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{attendanceRate}%</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Attendance Rate</div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 Results
          {records.length > 0 && (
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: '400', 
              color: '#666',
              background: '#f5f5f5',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              {records.length} records
            </span>
          )}
        </h3>
        
        {records.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Records Found</h3>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              {!filter.subjectId 
                ? 'Select a section and subject to view attendance records.'
                : 'No attendance records found for the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Student</th>
                  <th style={{ width: '150px' }}>Roll Number</th>
                  <th>Subject</th>
                  <th style={{ width: '150px' }}>Date</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id} style={{ background: i % 2 === 0 ? '#fafafa' : 'white' }}>
                    <td style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>
                      {i + 1}
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {r.student?.name || 'N/A'}
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#666' }}>
                      {r.student?.rollNumber || '-'}
                    </td>
                    <td style={{ color: '#666' }}>
                      {r.subject?.name || 'N/A'}
                    </td>
                    <td style={{ color: '#666' }}>
                      {new Date(r.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: r.status === 'Present' ? '#e8f5e9' : '#ffebee',
                        color: r.status === 'Present' ? '#2e7d32' : '#c62828'
                      }}>
                        {r.status === 'Present' ? '✓ Present' : '✗ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}