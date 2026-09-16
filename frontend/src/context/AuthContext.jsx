import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aether_user') || localStorage.getItem('vishnu_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('aether_token') || localStorage.getItem('vishnu_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('aether_token') || localStorage.getItem('vishnu_token');
      if (storedToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
          localStorage.setItem('aether_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleExpired = () => logout();
    window.addEventListener('auth_session_expired', handleExpired);
    return () => window.removeEventListener('auth_session_expired', handleExpired);
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('aether_token', data.access_token);
    localStorage.setItem('aether_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (username, email, password) => {
    const data = await authService.register(username, email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('aether_token', data.access_token);
    localStorage.setItem('aether_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aether_token');
    localStorage.removeItem('aether_user');
    localStorage.removeItem('vishnu_token');
    localStorage.removeItem('vishnu_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
