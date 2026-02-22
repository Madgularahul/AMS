import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    api.get("/admin/dashboard")
      .then(res => {
        setStats(res.data);
        setLastUpdate(new Date());
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    
    // Listen for real-time updates
    const handleRefresh = () => {
      fetchStats();
    };
    window.addEventListener('dashboard-refresh', handleRefresh);
    
    // Also listen to socket events
    if (socket) {
      socket.on('attendance-updated', () => {
        fetchStats();
      });
    }

    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
      if (socket) {
        socket.off('attendance-updated');
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ fontSize: '1.1rem', color: '#666' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <div style={{ fontSize: '1.1rem', color: '#666' }}>Failed to load dashboard data</div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div>
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
            {getGreeting()}, {user?.name}! 👋
          </h1>
          <p style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>
            Welcome to your admin dashboard. Here's an overview of your institution.
          </p>
        </div>
        {lastUpdate && (
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.85rem', 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🕐</span>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        
        {/* Students Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
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
            👨‍🎓
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
              Total Students
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.students}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Enrolled in the system
            </div>
          </div>
        </div>

        {/* Faculty Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
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
            👨‍🏫
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
              Total Faculty
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.faculty}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Teaching staff members
            </div>
          </div>
        </div>

        {/* Departments Card */}
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)',
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
            🏛️
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem', fontWeight: '500' }}>
              Departments
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.departments}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Academic departments
            </div>
          </div>
        </div>

        {/* Subjects Card */}
        <div style={{
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)',
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
              Total Subjects
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.subjects}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              Courses available
            </div>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <button
            onClick={() => window.location.href = '/admin/users'}
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
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>Manage Users</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Add or edit users
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/admin/departments'}
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
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏛️</div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>Departments</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Manage structure
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/admin/subjects'}
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
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>Subjects</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Manage courses
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/admin/analytics'}
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
            <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333' }}>Analytics</div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              View reports
            </div>
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: 'none'
      }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ℹ️ System Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
              Total Users
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
              {stats.students + stats.faculty}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
              Student-Faculty Ratio
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
              {stats.faculty > 0 ? Math.round(stats.students / stats.faculty) : 0}:1
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
              Avg Subjects per Dept
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
              {stats.departments > 0 ? Math.round(stats.subjects / stats.departments) : 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
              System Status
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2e7d32' }}>
              ✓ Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}