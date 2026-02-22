import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    const basePath = user?.role === 'admin' ? '/admin' : user?.role === 'faculty' ? '/faculty' : '/student';
    navigate(`${basePath}/settings`);
  };

  return (
    <nav className="navbar">
      <h2>
        <span style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '0.3rem 0.8rem',
          borderRadius: '6px',
          marginRight: '0.75rem',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          AMS
        </span>
        Attendance Management System
      </h2>
      <div className="navbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isConnected && (
            <span style={{ fontSize: '0.75rem', color: '#4caf50' }}>● Live</span>
          )}
          <NotificationBell />
        </div>
        <span>
          {user?.name} &nbsp;|&nbsp;
          <span className={`badge badge-${user?.role}`}>{user?.role?.toUpperCase()}</span>
        </span>
        <button 
          className="btn-logout" 
          onClick={handleSettings}
          style={{ marginRight: '0.5rem' }}
        >
          ⚙️ Settings
        </button>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}