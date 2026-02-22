import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty/subjects')
      .then(({ data }) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ fontSize: '1.1rem', color: '#666' }}>Loading dashboard...</div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Group subjects by section
  const subjectsBySection = subjects.reduce((acc, subject) => {
    const sectionKey = subject.section?._id || 'unassigned';
    if (!acc[sectionKey]) {
      acc[sectionKey] = {
        section: subject.section,
        subjects: []
      };
    }
    acc[sectionKey].subjects.push(subject);
    return acc;
  }, {});

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              {getGreeting()}, {user?.name}! 👋
            </h1>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
              Ready to mark attendance for your classes today?
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            background: 'rgba(255,255,255,0.2)',
            padding: '1rem 1.5rem',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>
                Status
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                {isConnected ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: '#4caf50',
                      boxShadow: '0 0 10px #4caf50'
                    }}></span>
                    Online
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: '#f44336'
                    }}></span>
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-20px', 
          right: '-20px', 
          fontSize: '8rem', 
          opacity: 0.1 
        }}>
          📚
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
            Your Assigned Subjects
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {subjects.length}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
            {subjects.length === 0 ? 'No subjects assigned yet' : 'Active courses this semester'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚡ Quick Actions
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          <button
            onClick={() => window.location.href = '/faculty/mark-attendance'}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>Mark Attendance</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Record student attendance
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/faculty/view-attendance'}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>View Records</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Check attendance history
            </div>
          </button>
        </div>
      </div>

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No Subjects Assigned</h3>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            Please contact the admin to assign subjects to your account.
          </p>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📚 Your Subjects
          </h3>
          
          {Object.entries(subjectsBySection).map(([sectionKey, { section, subjects: sectionSubjects }]) => (
            <div key={sectionKey} style={{ marginBottom: '2rem' }}>
              {section && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1rem 1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>🎓</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {section.department?.name || 'N/A'} - Section {section.sectionName}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                      Year {section.year}, Semester {section.semester}
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '1rem' 
              }}>
                {sectionSubjects.map((subject, i) => (
                  <div key={subject._id} style={{
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    background: i % 2 === 0 ? '#fafafa' : 'white',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                      <div style={{ 
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        📖
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#333', marginBottom: '0.25rem' }}>
                          {subject.name}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: '#e3f2fd',
                          color: '#1565c0',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace'
                        }}>
                          {subject.code}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}