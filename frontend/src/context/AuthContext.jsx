// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const currentUser = authService.getCurrentUser();

      if (!token) {
        clearAuthData();
        return;
      }

      if (currentUser?.id && currentUser?.user_type) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        const response = await userService.getMe();
        localStorage.setItem('user_data', JSON.stringify(response.data));
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch {
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * LOGIN
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      await authService.login(email, password);

      const userData = authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * REGISTER
   */
  const register = async (userData) => {
    try {
      setLoading(true);

      // Ensure password2
      const payload = {
        ...userData,
        password2: userData.password2 || userData.password,
      };

      // 1. Register
      await authService.register(payload);

      // 2. Auto-login
      await authService.login(payload.email, payload.password);

      // 3. Load user
      const currentUser = authService.getCurrentUser();

      setUser(currentUser);
      setIsAuthenticated(true);

      return { success: true, user: currentUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };


  /**
   * LOGOUT
   */
  const logout = () => {
    authService.logout();
    clearAuthData();
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
