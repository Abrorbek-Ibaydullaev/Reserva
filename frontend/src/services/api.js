import axios from 'axios';

// FIXED: Uncommented and using environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with baseURL
const api = axios.create({
    baseURL: API_BASE_URL,  // FIXED: Uncommented this
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    // No refresh token, redirect to login
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Try to refresh the token
                const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth Service
export const authService = {
    // Login
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login/', {
                email,
                password
            });

            if (response.data.access && response.data.refresh) {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);

                // Fetch and store user profile
                try {
                    const userResponse = await api.get('/auth/profile/');
                    const userData = userResponse.data;
                    localStorage.setItem('user_data', JSON.stringify(userData));
                } catch (profileError) {
                    console.error('Failed to fetch user profile:', profileError);
                    // Store basic user info from login response if available
                    const basicUserData = {
                        email: email,
                        first_name: response.data.first_name || '',
                        last_name: response.data.last_name || '',
                        user_type: response.data.user_type || 'client',
                        id: response.data.user_id || null
                    };
                    localStorage.setItem('user_data', JSON.stringify(basicUserData));
                }
            }
            return response.data;
        } catch (error) {
            console.error('Login API error:', error);
            throw error;
        }
    },

    // Register
    register: async (userData) => {
        try {
            const response = await api.post('/auth/register/', {
                email: userData.email,
                password: userData.password,
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone: userData.phone_number || '',
                user_type: userData.user_type,
                ...(userData.user_type === 'business_owner' && {
                    business_name: userData.business_name
                })
            });
            return response;
        } catch (error) {
            console.error('Register API error:', error);
            throw error;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    },

    // Get current user from localStorage
    getCurrentUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    // Get user profile from API
    getUserProfile: async () => {
        try {
            const response = await api.get('/auth/profile/');
            const userData = response.data;
            localStorage.setItem('user_data', JSON.stringify(userData));
            return response;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    // Update profile
    updateProfile: async (userData) => {
        try {
            const response = await api.put('/auth/profile/', userData);
            const updatedUser = response.data;
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            return response;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    // Change password
    changePassword: async (passwordData) => {
        try {
            const response = await api.post('/auth/change-password/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
                confirm_password: passwordData.confirm_password
            });
            return response;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    // Request password reset
    requestPasswordReset: async (email) => {
        try {
            const response = await api.post('/auth/password-reset/', { email });
            return response;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    },

    // Confirm password reset
    confirmPasswordReset: async (token, password) => {
        try {
            const response = await api.post('/auth/password-reset/confirm/', {
                token,
                password
            });
            return response;
        } catch (error) {
            console.error('Password reset confirm error:', error);
            throw error;
        }
    },

    // Verify email
    verifyEmail: async (token) => {
        try {
            const response = await api.post('/auth/verify-email/', { token });
            return response;
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    }
};

// Service Service
export const serviceService = {
    getAllServices: (params) => api.get('/services/', { params }),
    getServiceById: (id) => api.get(`/services/${id}/`),
    getServiceBySlug: (slug) => api.get(`/services/slug/${slug}/`),
    getCategories: () => api.get('/services/categories/'),
    createService: (serviceData) => api.post('/services/', serviceData),
    updateService: (id, serviceData) => api.put(`/services/${id}/`, serviceData),
    deleteService: (id) => api.delete(`/services/${id}/`),
    getMyServices: () => api.get('/services/my-services/'),
    addReview: (serviceId, reviewData) => api.post(`/services/${serviceId}/reviews/`, reviewData),
    getServiceReviews: (serviceId) => api.get(`/services/${serviceId}/reviews/`),
};

// Appointment Service  
export const appointmentService = {
    // Get all appointments
    getAllAppointments: (params) => api.get('/appointments/', { params }),

    // Get single appointment
    getAppointment: (id) => api.get(`/appointments/${id}/`),

    // Create appointment (booking)
    createAppointment: (appointmentData) => api.post('/appointments/create_booking/', {
        service_id: appointmentData.service_id,
        provider_id: appointmentData.provider_id,
        client_id: appointmentData.client_id,
        start_datetime: appointmentData.start_datetime,
        client_notes: appointmentData.client_notes || ''
    }),

    // Get available slots
    getAvailableSlots: (params) => api.get('/appointments/available_slots/', {
        params: {
            service_id: params.service_id,
            provider_id: params.provider_id,
            date: params.date
        }
    }),

    // Cancel appointment
    cancelAppointment: (id, reason) => api.post(`/appointments/${id}/cancel/`, {
        reason: reason || 'Client requested cancellation'
    }),

    // Reschedule appointment
    rescheduleAppointment: (id, newStartTime) => api.post(`/appointments/${id}/reschedule/`, {
        start_datetime: newStartTime
    }),

    // Get upcoming appointments
    getUpcomingAppointments: (params) => api.get('/appointments/upcoming/', { params }),

    // Get calendar view
    getCalendar: (params) => api.get('/appointments/calendar/', {
        params: {
            provider_id: params.provider_id,
            date: params.date
        }
    }),

    // Update appointment status
    updateStatus: (id, status) => api.patch(`/appointments/${id}/`, { status }),
};

// Schedule Service
export const scheduleService = {
    // Working hours
    getWorkingHours: (providerId) => api.get('/schedules/working-hours/', {
        params: { provider: providerId }
    }),
    createWorkingHours: (data) => api.post('/schedules/working-hours/', data),
    updateWorkingHours: (id, data) => api.put(`/schedules/working-hours/${id}/`, data),
    deleteWorkingHours: (id) => api.delete(`/schedules/working-hours/${id}/`),

    // Time off
    getTimeOff: (providerId) => api.get('/schedules/time-off/', {
        params: { provider: providerId }
    }),
    createTimeOff: (data) => api.post('/schedules/time-off/', data),
    updateTimeOff: (id, data) => api.put(`/schedules/time-off/${id}/`, data),
    deleteTimeOff: (id) => api.delete(`/schedules/time-off/${id}/`),
    getUpcomingTimeOff: (providerId) => api.get('/schedules/time-off/upcoming/', {
        params: { provider_id: providerId }
    }),
};

// User Service
export const userService = {
    // Businesses
    getAllBusinesses: () => api.get('/users/businesses/'),
    getBusiness: (id) => api.get(`/users/businesses/${id}/`),
    createBusiness: (data) => api.post('/users/businesses/', data),
    updateBusiness: (id, data) => api.put(`/users/businesses/${id}/`, data),

    // Service providers
    getAllProviders: (businessId) => api.get('/users/providers/', {
        params: { business: businessId }
    }),
    getProvider: (id) => api.get(`/users/providers/${id}/`),
    createProvider: (data) => api.post('/users/providers/', data),
    updateProvider: (id, data) => api.put(`/users/providers/${id}/`, data),

    // Clients
    getAllClients: (businessId) => api.get('/users/clients/', {
        params: { business: businessId }
    }),
    getClient: (id) => api.get(`/users/clients/${id}/`),
    createClient: (data) => api.post('/users/clients/', data),
    updateClient: (id, data) => api.put(`/users/clients/${id}/`, data),

    // Notifications
    getNotifications: () => api.get('/users/notifications/'),
    markNotificationAsRead: (id) => api.put(`/users/notifications/${id}/read/`),
    markAllNotificationsAsRead: () => api.post('/users/notifications/read-all/'),
};

// Statistics Service (for dashboard)
export const statsService = {
    getDashboardStats: () => api.get('/stats/dashboard/'),
    getRevenueStats: (params) => api.get('/stats/revenue/', { params }),
    getAppointmentStats: (params) => api.get('/stats/appointments/', { params }),
};

export default api;