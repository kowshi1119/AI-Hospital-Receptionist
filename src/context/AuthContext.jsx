/**
 * Authentication Context
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 503) {
          errorMessage = 'Database not initialized. Please contact administrator.';
        } else if (status === 401) {
          errorMessage = data?.error || 'Invalid username or password.';
        } else if (status === 403) {
          errorMessage = data?.error || 'Account not approved or disabled.';
        } else if (data?.error) {
          errorMessage = data.error;
        }
      } else if (error.message) {
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to server. Please check if backend is running.';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    setUser: (updated) => {
      setUser(updated);
      if (updated) {
        localStorage.setItem('user', JSON.stringify(updated));
      } else {
        localStorage.removeItem('user');
      }
    },
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isDoctor: user?.role === 'Doctor',
    isReceptionist: user?.role === 'Receptionist',
    isStaff: user?.role === 'Staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
