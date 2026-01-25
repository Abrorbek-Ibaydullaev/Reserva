import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const currentUser = authService.getCurrentUser();
      const token = localStorage.getItem('access_token');

      if (currentUser && token) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);

      if (result.success) {
        const userData = result.user || authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      }

      return { success: false, message: result.message };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);

      if (result.success) {
        if (result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
          return { success: true, user: result.user };
        }
        return { success: true, message: 'Registration successful' };
      }

      return { success: false, message: result.message };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    clearAuthData();
    navigate('/login');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);