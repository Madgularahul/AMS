import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to Socket.io server
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'https://ams-ny0y.onrender.com', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join user-specific and role-specific rooms
      newSocket.emit('join-room', {
        userId: user._id,
        role: user.role
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for attendance updates
    newSocket.on('attendance-updated', (data) => {
      const notification = {
        id: Date.now(),
        type: 'attendance',
        message: `Attendance marked for ${data.count} students`,
        data,
        timestamp: new Date()
      };
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    });

    // Listen for personal attendance updates (for students)
    newSocket.on('my-attendance-updated', (data) => {
      const notification = {
        id: Date.now(),
        type: 'my-attendance',
        message: `Your attendance marked: ${data.status} for ${data.subjectName}`,
        data,
        timestamp: new Date()
      };
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    // Listen for dashboard updates
    newSocket.on('dashboard-update', (data) => {
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      isConnected,
      clearNotifications,
      removeNotification
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
