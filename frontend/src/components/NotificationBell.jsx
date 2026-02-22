import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './NotificationBell.css';

export default function NotificationBell() {
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.length;

  useEffect(() => {
    // Auto-close after 5 seconds
    if (isOpen && notifications.length > 0) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, notifications.length]);

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="clear-btn">
                Clear All
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No new notifications</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  <div className="notification-content">
                    <p>{notif.message}</p>
                    <small>
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </small>
                  </div>
                  <button
                    onClick={() => removeNotification(notif.id)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
