import React, { createContext, useContext, useState } from 'react';
import { businessAuth, clearSession, getStoredUser } from '../services/api';

const AuthContext = createContext(null);

// Turn an axios error into a readable message (backend uses { detail }).
const errMessage = (error, fallback) =>
  error?.response?.data?.detail ||
  (typeof error?.response?.data === 'string' ? error.response.data : null) ||
  fallback;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const isAuthenticated = !!user;

  const register = async (payload) => {
    try {
      const data = await businessAuth.register(payload);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, status: error.response?.status, message: errMessage(error, 'Registration failed') };
    }
  };

  const login = async (email, password, recaptchaToken) => {
    try {
      const data = await businessAuth.login(email, password, recaptchaToken);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, status: error.response?.status, message: errMessage(error, 'Login failed') };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const data = await businessAuth.googleLogin(credential);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      // 403 → "No business account found with this email..."
      return { success: false, status: error.response?.status, message: errMessage(error, 'Google sign-in failed') };
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, register, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
