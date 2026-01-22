import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Login failed';
      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message ||
                         'Registration failed';
      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return { success: true, data: response };
    } catch (error) {
      toast.error('Failed to update profile');
      return { success: false, error };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword({
        old_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.old_password?.[0] ||
                         error.response?.data?.new_password?.[0] ||
                         'Failed to change password';
      toast.error(errorMessage);
      return { success: false, error };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};