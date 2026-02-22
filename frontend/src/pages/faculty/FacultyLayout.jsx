import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import Navbar from '../../components/Navbar';

export default function FacultyLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      icon: '📊',
      path: '/faculty/dashboard'
    },
    {
      title: 'Mark Attendance',
      icon: '✅',
      path: '/faculty/mark-attendance'
    },
    {
      title: 'View Records',
      icon: '📋',
      path: '/faculty/view-attendance'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <Navbar />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 1002,
          background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
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
        className="mobile-menu-btn"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '60px' }}>
        <aside style={{
          width: '280px',
          background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          overflowY: 'auto',
          zIndex: 100,
          paddingTop: '60px',
          transition: 'transform 0.3s ease'
        }}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        >
          {/* Sidebar Header */}
          <div style={{
            padding: '2rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '1rem',
                letterSpacing: '2px',
                color: 'white'
              }}>
                AMS
              </span>
              <span style={{ fontSize: '1rem' }}>Faculty Portal</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#fff',
                color: '#6a1b9a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  marginBottom: '0.25rem'
                }}>
                  {user?.name}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '12px',
                  display: 'inline-block'
                }}>
                  FACULTY
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{
            flex: 1,
            padding: '1.5rem 0'
          }}>
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                onClick={handleNavClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  borderLeft: isActive(item.path) ? '3px solid #4caf50' : '3px solid transparent',
                  background: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                  fontWeight: 500,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderLeftColor = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  fontSize: '1.2rem',
                  width: '30px',
                  textAlign: 'center'
                }}>
                  {item.icon}
                </span>
                <span style={{
                  flex: 1,
                  fontSize: '0.95rem'
                }}>
                  {item.title}
                </span>
                {isActive(item.path) && (
                  <span style={{
                    position: 'absolute',
                    right: '1.5rem',
                    width: '8px',
                    height: '8px',
                    background: '#4caf50',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.8rem',
              opacity: 0.7,
              marginBottom: '0.5rem'
            }}>
              v2.0.0
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4caf50',
                animation: 'pulse 2s infinite'
              }}></span>
              System Online
            </div>
          </div>
        </aside>
        <main style={{ marginLeft: '280px', flex: 1, padding: '2rem', overflowY: 'auto', background: '#f0f2f5', minHeight: 'calc(100vh - 60px)' }} className="main-content">
          <Outlet />
        </main>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }

          .mobile-overlay {
            display: block !important;
          }

          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar-open {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0 !important;
            padding: 1rem !important;
          }
        }
      `}</style>
    </>
  );
}