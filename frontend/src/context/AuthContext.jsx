// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService, fixMediaUrl, api } from '../services/api';

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
      const authSetAt = Number(localStorage.getItem('auth_set_at') || 0);
      const now = Date.now();

      // If tokens were set more than 24 hours ago, try to proactively refresh
      if (token && authSetAt && now - authSetAt > 24 * 60 * 60 * 1000) {
        try {
          const refresh = localStorage.getItem('refresh_token');
          if (!refresh) throw new Error('No refresh token');
          const resp = await api.post('/auth/refresh/', { refresh });
          const newAccess = resp.data?.access;
          if (newAccess) {
            localStorage.setItem('access_token', newAccess);
            localStorage.setItem('auth_set_at', String(Date.now()));
          }
        } catch (e) {
          clearAuthData();
          return;
        }
      }
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
   * @param {string} email
   * @param {string} password
   * @param {string|null} recaptchaToken - reCAPTCHA v2 token from the widget
   */
  const login = async (email, password, recaptchaToken = null) => {
    try {
      await authService.login(email, password, recaptchaToken);
      try { localStorage.setItem('auth_set_at', String(Date.now())); } catch (e) { /* ignore */ }

      const userData = authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data || 'Login failed',
      };
    }
  };

  /**
   * GOOGLE SIGN-IN / SIGN-UP
   * Sends the Google ID token (credential) to the backend, which signs the
   * user in or creates the account, then returns { access, refresh, user }.
   * Used by both the Login and Register pages.
   */
  const loginWithGoogle = async (credential) => {
    try {
      const data = await authService.googleLogin(credential);
      const userData = authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData, created: data?.created };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.detail || error.response?.data || 'Google sign-in failed',
      };
    }
  };

  /**
   * REGISTER
   * The backend returns access + refresh tokens alongside the new user, so
   * no separate login request (and therefore no second reCAPTCHA) is needed.
   */
  const register = async (userData) => {
    try {
      const payload = {
        ...userData,
        password2: userData.password2 || userData.password,
      };

      // Registration endpoint now returns { access, refresh, user }
      const response = await authService.register(payload);
      const { access, refresh, user: registeredUser } = response.data;

      // Store tokens exactly as authService.login does
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      try { localStorage.setItem('auth_set_at', String(Date.now())); } catch (e) { /* ignore */ }
      const normalizedUser = {
        ...registeredUser,
        profile_picture: fixMediaUrl(registeredUser.profile_picture),
      };
      localStorage.setItem('user_data', JSON.stringify(normalizedUser));

      setUser(normalizedUser);
      setIsAuthenticated(true);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data || 'Registration failed',
      };
    }
  };


  /**
   * LOGOUT
   */
  const logout = () => {
    authService.logout();
    clearAuthData();
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        loginWithGoogle,
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
