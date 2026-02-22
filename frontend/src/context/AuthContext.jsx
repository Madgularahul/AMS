import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    
    // Set up auto-logout timer
    setupAutoLogout(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    // Clear any existing timers
    if (window.logoutTimer) {
      clearTimeout(window.logoutTimer);
    }
  };

  const setupAutoLogout = (token) => {
    try {
      // Decode JWT token to get expiry time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      if (timeUntilExpiry > 0) {
        // Show warning 5 minutes before expiry
        const warningTime = timeUntilExpiry - (5 * 60 * 1000);
        
        if (warningTime > 0) {
          setTimeout(() => {
            alert('⚠️ Your session will expire in 5 minutes. Please save your work.');
          }, warningTime);
        }

        // Auto logout when token expires
        window.logoutTimer = setTimeout(() => {
          alert('🔒 Your session has expired. Please login again.');
          logout();
          window.location.href = '/login';
        }, timeUntilExpiry);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  // Check token expiry on mount and periodically
  useEffect(() => {
    if (user?.token) {
      setupAutoLogout(user.token);
    }

    // Check every minute if token is close to expiry
    const interval = setInterval(() => {
      if (user?.token) {
        try {
          const payload = JSON.parse(atob(user.token.split('.')[1]));
          const expiryTime = payload.exp * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;

          // If token expires in less than 1 minute, logout
          if (timeUntilExpiry < 60000 && timeUntilExpiry > 0) {
            alert('🔒 Your session has expired. Please login again.');
            logout();
            window.location.href = '/login';
          }
        } catch (error) {
          // If we can't decode the token, logout immediately
          logout();
          window.location.href = '/login';
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
      if (window.logoutTimer) {
        clearTimeout(window.logoutTimer);
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);