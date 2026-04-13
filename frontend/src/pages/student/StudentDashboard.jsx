import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import QuickActions from '../../components/QuickActions';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [percentages, setPercentages] = useState([]);
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = () => {
    api.get('/student/attendance/percentage')
      .then(({ data }) => {
        setPercentages(data);
        setLastUpdate(new Date());
      })
      .catch(console.error);

    api.get('/student/attendance/trends?days=30')
      .then(({ data }) => setTrends(data))
      .catch(console.error);

    api.get('/student/attendance/insights')
      .then(({ data }) => setInsights(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time attendance updates
    if (socket) {
      socket.on('my-attendance-updated', () => {
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('my-attendance-updated');
      }
    };
  }, [socket]);

  const overall = percentages.length
    ? (() => {
        const totalPresent = percentages.reduce((sum, s) => sum + s.presentCount, 0);
        const totalClasses = percentages.reduce((sum, s) => sum + s.totalClasses, 0);
        return totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(2) : '0.00';
      })()
    : 0;

  const getBarClass = (pct) => {
    if (pct >= 75) return '';
    if (pct >= 60) return 'warn';
    return 'danger';
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <div>
      {/* Welcome Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00897b 0%, #26a69a 100%)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,137,123,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {getTimeGreeting()}, {user?.name}! 👋
            </div>
            <div style={{ fontSize: '1rem', opacity: 0.9 }}>
              Track your attendance and stay on top of your academic progress
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {lastUpdate && (
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#4caf50',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(102,126,234,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4rem', opacity: 0.2 }}>📚</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{percentages.length}</div>
          <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Enrolled Subjects</div>
        </div>

        <div style={{
          background: overall >= 75 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 
                      overall >= 60 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(17,153,142,0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4rem', opacity: 0.2 }}>
            {overall >= 75 ? '✅' : overall >= 60 ? '⚠️' : '❌'}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{overall}%</div>
          <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Overall Attendance</div>
        </div>

        {insights && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              color: 'white',
              boxShadow: '0 4px 12px rgba(79,172,254,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4rem', opacity: 0.2 }}>📊</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {insights.overall.totalClasses}
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Total Classes</div>
            </div>

            <div style={{
              background: insights.overall.classesNeededFor75 > 0 ? 
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              borderRadius: '12px',
              padding: '1.5rem',
              color: 'white',
              boxShadow: '0 4px 12px rgba(240,147,251,0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4rem', opacity: 0.2 }}>
                {insights.overall.classesNeededFor75 > 0 ? '🎯' : '🎉'}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {insights.overall.classesNeededFor75}
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>Classes Needed for 75%</div>
            </div>
          </>
        )}
      </div>

      {/* Attendance Insights Alert */}
      {insights && insights.overall.status !== 'good' && (
        <div className={`alert ${insights.overall.status === 'warning' ? 'alert-error' : 'alert-error'}`}>
          <strong>⚠ Attendance Alert:</strong> Your overall attendance is {insights.overall.percentage}%.
          {insights.overall.classesNeededFor75 > 0 && (
            <span> You need to attend {insights.overall.classesNeededFor75} more classes to reach 75%.</span>
          )}
        </div>
      )}

      {/* Trends Chart */}
      {trends.length > 0 && (
        <div className="card">
          <h3>Attendance Trends (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends.map(t => ({
              ...t,
              displayDate: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.floor(trends.length / 8)}
              />
              <YAxis 
                label="Attendance"
                domain={[0, 100]}
              />
              <Tooltip 
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value, name) => [
                  name === 'present' ? `${value}` : value,
                  name === 'present' ? 'Present' : name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Area type="monotone" dataKey="present" stroke="#2e7d32" name="Present" fill="#2e7d32" />
              <Area type="monotone" dataKey="absent" stroke="#c62828" name="Absent" fill="#ffcdd2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subject Comparison Chart */}
      {percentages.length > 0 && (
        <div className="card">
          <h3>Subject-wise Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={percentages.map(s => ({
              name: s.subject.name.length > 15 ? s.subject.name.substring(0, 15) + '...' : s.subject.name,
              percentage: parseFloat(s.percentage)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="percentage" fill="#1a237e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          marginBottom: '1.5rem', 
          color: '#00897b', 
          fontSize: '1.3rem',
          borderBottom: '2px solid #e0f2f1',
          paddingBottom: '0.75rem'
        }}>
          📚 Attendance Summary by Subject
        </h3>
        {percentages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ color: '#00897b', fontSize: '1.1rem', fontWeight: 500 }}>No attendance records yet.</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Your attendance will appear here once classes begin.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Total</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  {insights && <th>Action Needed</th>}
                </tr>
              </thead>
              <tbody>
                {percentages.map((s, idx) => {
                  const pct = parseFloat(s.percentage);
                  return (
                    <tr key={s.subject._id} style={{ 
                      background: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2f1'}
                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f9f9f9'}
                    >
                      <td>
                        <a
                          href={`/student/subject/${s.subject._id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/student/subject/${s.subject._id}`;
                          }}
                          style={{ 
                            color: '#00897b', 
                            textDecoration: 'none', 
                            cursor: 'pointer', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {s.subject.name} <span style={{ fontSize: '0.8rem' }}>→</span>
                        </a>
                      </td>
                      <td><strong>{s.subject.code}</strong></td>
                      <td><strong>{s.totalClasses}</strong></td>
                      <td style={{ color: '#2e7d32', fontWeight: 600 }}>{s.presentCount}</td>
                      <td style={{ color: '#c62828', fontWeight: 600 }}>{s.absentCount}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="pct-bar-wrapper">
                            <div className={`pct-bar ${getBarClass(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontWeight: 600 }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        {pct >= 75
                          ? <span className="badge badge-present" style={{ padding: '0.4rem 0.8rem' }}>✓ Good</span>
                          : pct >= 60
                          ? <span className="badge" style={{ background: '#fff3e0', color: '#f57f17', padding: '0.4rem 0.8rem' }}>⚠ Warning</span>
                          : <span className="badge badge-absent" style={{ padding: '0.4rem 0.8rem' }}>⚠ Low</span>
                        }
                      </td>
                      {insights && (
                        <td>
                          {insights.bySubject.find(i => i.subject._id === s.subject._id)?.classesNeededFor75 > 0 ? (
                            <small style={{ 
                              color: '#c62828', 
                              fontWeight: 600,
                              background: '#ffebee',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }}>
                              Need {insights.bySubject.find(i => i.subject._id === s.subject._id).classesNeededFor75} more
                            </small>
                          ) : (
                            <small style={{ 
                              color: '#2e7d32', 
                              fontWeight: 600 
                            }}>
                              ✓ On track
                            </small>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overall Distribution Pie Chart */}
      {insights && (
        <div className="card">
          <h3>Overall Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Present', value: insights.overall.presentClasses },
                  { name: 'Absent', value: insights.overall.absentClasses }
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

      {percentages.some((s) => parseFloat(s.percentage) < 75) && (
        <div className="alert alert-error">
          ⚠ You have subjects with attendance below 75%. Please attend more classes.
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions studentId={user?._id} />
    </div>
  );
}