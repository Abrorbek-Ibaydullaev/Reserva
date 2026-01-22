import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    // baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Try to refresh the token
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
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
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_data');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API service functions
export const authService = {
    login: (email, password) =>
        api.post('/token/', { email, password }).then((response) => {
            if (response.data.access && response.data.refresh) {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return response.data;
        }),

    register: (userData) => api.post('/users/register/', userData),

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },

    updateProfile: (userData) => api.put('/users/me/', userData),

    changePassword: (data) => api.put('/users/change-password/', data),
};

export const serviceService = {
    getAllServices: (params) => api.get('/services/', { params }),
    getServiceById: (id) => api.get(`/services/${id}/`),
    getServiceBySlug: (slug) => api.get(`/services/${slug}/`),
    getCategories: () => api.get('/services/categories/'),
    createService: (serviceData) => api.post('/services/my-services/', serviceData),
    updateService: (id, serviceData) => api.put(`/services/my-services/${id}/`, serviceData),
    deleteService: (id) => api.delete(`/services/my-services/${id}/`),
    getMyServices: () => api.get('/services/my-services/'),
    addReview: (slug, reviewData) => api.post(`/services/${slug}/reviews/`, reviewData),
    getServiceAddons: (serviceId) => api.get(`/services/${serviceId}/addons/`),
    getServiceReviews: (slug) => api.get(`/services/${slug}/reviews/`),
};

export const appointmentService = {
    getAllAppointments: () => api.get('/appointments/'),
    getAppointment: (id) => api.get(`/appointments/${id}/`),
    createAppointment: (appointmentData) => api.post('/appointments/', appointmentData),
    updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}/`, appointmentData),
    deleteAppointment: (id) => api.delete(`/appointments/${id}/`),
    updateStatus: (id, statusData) => api.put(`/appointments/${id}/status/`, statusData),
    rescheduleAppointment: (id, scheduleData) => api.put(`/appointments/${id}/reschedule/`, scheduleData),
    getTodayAppointments: () => api.get('/appointments/today/'),
    getUpcomingAppointments: () => api.get('/appointments/upcoming/'),
    getAppointmentHistory: (appointmentId) => api.get(`/appointments/${appointmentId}/history/`),
    getCancellationReasons: () => api.get('/appointments/cancellation-reasons/'),
};

export const scheduleService = {
    getBusinessHours: () => api.get('/schedules/business-hours/'),
    updateBusinessHours: (data) => api.post('/schedules/business-hours/', data),
    getEmployees: () => api.get('/schedules/employees/'),
    createEmployee: (data) => api.post('/schedules/employees/', data),
    updateEmployee: (id, data) => api.put(`/schedules/employees/${id}/`, data),
    deleteEmployee: (id) => api.delete(`/schedules/employees/${id}/`),
    getEmployeeSchedule: (employeeId) => api.get(`/schedules/employees/${employeeId}/schedules/`),
    updateEmployeeSchedule: (employeeId, scheduleData) => api.post(`/schedules/employees/${employeeId}/schedules/`, scheduleData),
    getTimeOffRequests: () => api.get('/schedules/time-off/'),
    createTimeOffRequest: (data) => api.post('/schedules/time-off/', data),
    updateTimeOffRequest: (id, data) => api.put(`/schedules/time-off/${id}/`, data),
    getResources: () => api.get('/schedules/resources/'),
    createResource: (data) => api.post('/schedules/resources/', data),
    updateResource: (id, data) => api.put(`/schedules/resources/${id}/`, data),
    deleteResource: (id) => api.delete(`/schedules/resources/${id}/`),
    checkAvailability: (data) => api.post('/schedules/check-availability/', data),
    getAvailableSlots: (params) => api.get('/schedules/available-slots/', { params }),
};

export const userService = {
    getNotifications: () => api.get('/users/notifications/'),
    markNotificationAsRead: (id) => api.put(`/users/notifications/${id}/read/`),
    markAllNotificationsAsRead: () => api.post('/users/notifications/read-all/'),
    getUserProfile: () => api.get('/users/profile/'),
    updateUserProfile: (data) => api.put('/users/profile/', data),
};

export default api;