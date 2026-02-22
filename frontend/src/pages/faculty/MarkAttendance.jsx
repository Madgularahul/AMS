import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';

export default function MarkAttendance() {
  const { socket } = useSocket();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Get unique sections from faculty's assigned subjects
  const sections = [...new Map(
    subjects.filter(s => s.section).map(s => [s.section._id, s.section])
  ).values()];

  const filteredSubjects = selectedSection
    ? subjects.filter(s => s.section?._id === selectedSection)
    : subjects;

  useEffect(() => {
    api.get('/faculty/subjects')
      .then((res) => setSubjects(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;

    api.get(`/faculty/students?subjectId=${selectedSubject}`)
    .then((res) => {
      setStudents(res.data);

      const defaults = {};
      res.data.forEach((s) => (defaults[s._id] = 'Present'));
      setAttendance(defaults);
    })
    .catch(console.error);

  }, [selectedSubject]);

  const handleSectionChange = (sectionId) => {
    setSelectedSection(sectionId);
    setSelectedSubject('');
    setStudents([]);
    setAttendance({});
  };

  const toggle = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return setMsg({ type: 'error', text: 'Please select a subject' });
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      const records = students.map((s) => ({ studentId: s._id, status: attendance[s._id] || 'Absent' }));
      await api.post('/faculty/attendance', { subjectId: selectedSubject, date, records });
      setMsg({ type: 'success', text: `✅ Attendance saved successfully for ${records.length} students!` });
      setLastSaved(new Date());
      
      // Request dashboard refresh for admins
      if (socket) {
        socket.emit('request-dashboard-update');
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save attendance' });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter((v) => v === 'Present').length;
  const absentCount = students.length - presentCount;

  const selectedSubjectInfo = subjects.find(s => s._id === selectedSubject);

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
            ✅ Mark Attendance
          </div>
          <p style={{ color: '#666', fontSize: '0.95rem', margin: 0 }}>
            Record student attendance for your classes
          </p>
        </div>
        {lastSaved && (
          <div style={{ 
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: '#e8f5e9',
            color: '#2e7d32',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ✓ Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Selection Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎯 Select Class
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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
              value={selectedSection}
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedSection}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.95)',
                color: '#333',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: !selectedSection ? 0.6 : 1
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
              Date
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
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
      </div>

      {/* Selected Subject Info */}
      {selectedSubjectInfo && (
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Date</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* Students List */}
      {students.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👥 Students
              <span style={{ 
                fontSize: '0.9rem', 
                fontWeight: '400', 
                color: '#666',
                background: '#f5f5f5',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px'
              }}>
                {students.length} total
              </span>
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => {
                  const all = {};
                  students.forEach((s) => (all[s._id] = 'Present'));
                  setAttendance(all);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2e7d32',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ✓ All Present
              </button>
              <button 
                onClick={() => {
                  const all = {};
                  students.forEach((s) => (all[s._id] = 'Absent'));
                  setAttendance(all);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#c62828',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ✗ All Absent
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{presentCount}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Present</div>
            </div>
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{absentCount}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Absent</div>
            </div>
            <div style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Attendance Rate</div>
            </div>
          </div>

          {msg.text && (
            <div style={{
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              background: msg.type === 'success' ? '#e8f5e9' : '#ffebee',
              border: `2px solid ${msg.type === 'success' ? '#4caf50' : '#f44336'}`,
              color: msg.type === 'success' ? '#2e7d32' : '#c62828',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>
                {msg.type === 'success' ? '✅' : '⚠️'}
              </span>
              {msg.text}
            </div>
          )}

          {/* Students Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {students.map((s) => (
              <div 
                key={s._id}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: `2px solid ${attendance[s._id] === 'Present' ? '#4caf50' : '#f44336'}`,
                  background: attendance[s._id] === 'Present' ? '#f1f8f4' : '#fff5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333', marginBottom: '0.25rem' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {s.rollNumber || s.email}
                  </div>
                </div>
                <button
                  onClick={() => toggle(s._id)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: attendance[s._id] === 'Present' ? '#4caf50' : '#f44336',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '100px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {attendance[s._id] || 'Absent'}
                </button>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: submitting 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: submitting ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
          >
            {submitting ? (
              <>
                <span>⏳</span>
                Saving Attendance...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Attendance
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {students.length === 0 && selectedSubject && (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Students Found</h3>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            There are no students enrolled in this section yet.
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Please contact the admin to add students to this section.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!selectedSubject && (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>Select a Class</h3>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            Choose a section and subject from the filters above to start marking attendance.
          </p>
        </div>
      )}
    </div>
  );
}