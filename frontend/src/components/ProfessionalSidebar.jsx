import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function ProfessionalSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavItems = () => {
    if (!user) return [];

    const baseItems = [
      {
        title: 'Dashboard',
        icon: '📊',
        path: user.role === 'admin' ? '/admin/dashboard' : 
                user.role === 'faculty' ? '/faculty/dashboard' : 
                '/student/dashboard',
        roles: ['admin', 'faculty', 'student']
      }
    ];

    const roleSpecificItems = {
      admin: [
        {
          title: 'Manage Users',
          icon: '👥',
          path: '/admin/users',
          roles: ['admin']
        },
        {
          title: 'Departments',
          icon: '🏢',
          path: '/admin/departments',
          roles: ['admin']
        },
        {
          title: 'Subjects',
          icon: '📚',
          path: '/admin/subjects',
          roles: ['admin']
        },
                {
          title: 'Reports',
          icon: '📈',
          path: '/admin/analytics',
          roles: ['admin']
        },
        {
          title: 'Section Reports',
          icon: '📑',
          path: '/admin/section-reports',
          roles: ['admin']
        },
              ],
      faculty: [
        {
          title: 'Mark Attendance',
          icon: '✅',
          path: '/faculty/mark-attendance',
          roles: ['faculty']
        },
        {
          title: 'View Attendance',
          icon: '👁️',
          path: '/faculty/view-attendance',
          roles: ['faculty']
        },
        {
          title: 'My Schedule',
          icon: '📅',
          path: '/faculty/schedule',
          roles: ['faculty']
        }
      ],
      student: [
        {
          title: 'My Attendance',
          icon: '📊',
          path: '/student/attendance',
          roles: ['student']
        },
        {
          title: 'Calendar',
          icon: '📅',
          path: '/student/calendar',
          roles: ['student']
        },
        {
          title: 'Request Regularization',
          icon: '📝',
          path: '/student/regularization',
          roles: ['student']
        },
        {
          title: 'Compliance Status',
          icon: '⚖️',
          path: '/student/compliance',
          roles: ['student']
        }
      ]
    };

    return [...baseItems, ...(roleSpecificItems[user.role] || [])];
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1002,
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '0.75rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'none',
          fontSize: '1.2rem',
          width: '45px',
          height: '45px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="mobile-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'none'
          }}
        />
      )}

      <aside className={`professional-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              letterSpacing: '2px'
            }}>
              AMS
            </span>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role?.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              onClick={handleNavClick}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.title}</span>
              {isActive(item.path) && <span className="nav-indicator"></span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-info">
            <div className="version">v2.0.0</div>
            <div className="status">
              <span className="status-dot online"></span>
              System Online
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
