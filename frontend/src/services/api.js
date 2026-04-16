// src/api/api.js
import axios from 'axios';

/**
 * Base API URL
 * Must NOT end with a slash
 * Example: http://localhost:8000/api
 */
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Axios instance
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

const withPayloadConfig = (data) =>
    data instanceof FormData
        ? {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          }
        : undefined;

/**
 * Request interceptor – attach access token
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor – refresh token on 401
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh/`,
                    { refresh: refreshToken }
                );

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * =========================
 * AUTH SERVICE
 * =========================
 */
export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login/', {
            email,
            password,
        });

        if (response.data.access && response.data.refresh) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            const userData = response.data.user || (await api.get('/users/me/')).data;
            localStorage.setItem('user_data', JSON.stringify(userData));
        }

        return response.data;
    },

    register: async (userData) => {
        return api.post('/auth/register/', {
            email: userData.email,
            password: userData.password,
            password2: userData.password2,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number || '',
            user_type: userData.user_type,
        });
    },

    logout: () => {
        localStorage.clear();
    },

    getCurrentUser: () => {
        const data = localStorage.getItem('user_data');
        return data ? JSON.parse(data) : null;
    },

    getUserProfile: async () => {
        const response = await api.get('/users/me/');
        localStorage.setItem('user_data', JSON.stringify(response.data));
        return response;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/users/me/', userData, withPayloadConfig(userData));
        localStorage.setItem('user_data', JSON.stringify(response.data));
        return response;
    },

    changePassword: async ({ current_password, new_password }) => {
        return api.post('/auth/change-password/', {
            old_password: current_password,
            new_password: new_password,
        });
    },
};

/**
 * =========================
 * SERVICE SERVICE
 * =========================
 */
export const serviceService = {
    getAllServices: (params) => api.get('/services/', { params }),
    getServiceById: (id) => api.get(`/services/id/${id}/`),
    getServiceBySlug: (slug) => api.get(`/services/slug/${slug}/`),
    getCategories: () => api.get('/services/categories/'),
    createService: (data) => api.post('/services/my-services/', data),
    updateService: (id, data) => api.put(`/services/my-services/${id}/`, data),
    deleteService: (id) => api.delete(`/services/my-services/${id}/`),
    getMyServices: () => api.get('/services/my-services/'),
    addReview: (id, data) => api.post(`/services/${id}/reviews/`, data),
    getServiceReviews: (id) => api.get(`/services/${id}/reviews/`),
};

/**
 * =========================
 * APPOINTMENT SERVICE
 * =========================
 */
export const appointmentService = {
    getAllAppointments: (params) => api.get('/appointments/', { params }),
    getBusinessDashboardStats: () => api.get('/appointments/dashboard-stats/'),
    getAppointment: (id) => api.get(`/appointments/${id}/`),
    createAppointment: (data) => api.post('/appointments/', data),
    updateAppointmentStatus: (id, data) => api.put(`/appointments/${id}/status/`, data),
    cancelAppointment: (id, reason) =>
        api.post(`/appointments/${id}/cancel/`, {
            reason: reason || 'Client requested cancellation',
        }),
    rescheduleAppointment: (id, data) => api.put(`/appointments/${id}/reschedule/`, data),
    getTodayAppointments: () => api.get('/appointments/today/'),
    getUpcomingAppointments: () => api.get('/appointments/upcoming/'),
    getAvailableSlots: (params) => api.get('/schedules/available-slots/', { params }),
};

/**
 * =========================
 * SCHEDULE SERVICE
 * =========================
 */
export const scheduleService = {
    getBusinessHours: (params) => api.get('/schedules/business-hours/', { params }),
    createBusinessHours: (data) => api.post('/schedules/business-hours/', data),
    updateBusinessHours: (id, data) => api.put(`/schedules/business-hours/${id}/`, data),
    getEmployees: (params) => api.get('/schedules/employees/', { params }),
    createEmployee: (data) => api.post('/schedules/employees/', data),
    updateEmployee: (id, data) => api.put(`/schedules/employees/${id}/`, data),
    deleteEmployee: (id) => api.delete(`/schedules/employees/${id}/`),
    getEmployeeSchedules: (employeeId) => api.get(`/schedules/employees/${employeeId}/schedules/`),
    createEmployeeSchedule: (employeeId, data) => api.post(`/schedules/employees/${employeeId}/schedules/`, data),
    updateEmployeeSchedule: (employeeId, scheduleId, data) =>
        api.put(`/schedules/employees/${employeeId}/schedules/${scheduleId}/`, data),
    deleteEmployeeSchedule: (employeeId, scheduleId) =>
        api.delete(`/schedules/employees/${employeeId}/schedules/${scheduleId}/`),
    getMyEmployeeProfile: () => api.get('/schedules/me/employee-profile/'),
    updateMyEmployeeProfile: (data) => api.put('/schedules/me/employee-profile/', data),
    getMyWeeklyHours: () => api.get('/schedules/me/weekly-hours/'),
    updateMyWeeklyHour: (id, data) => api.put(`/schedules/me/weekly-hours/${id}/`, data),
    getMySchedules: () => api.get('/schedules/me/schedules/'),
    createMySchedule: (data) => api.post('/schedules/me/schedules/', data),
    updateMySchedule: (id, data) => api.put(`/schedules/me/schedules/${id}/`, data),
    deleteMySchedule: (id) => api.delete(`/schedules/me/schedules/${id}/`),
    getMyTimeOff: () => api.get('/schedules/me/time-off/'),
    createMyTimeOff: (data) => api.post('/schedules/me/time-off/', data),
    updateMyTimeOff: (id, data) => api.put(`/schedules/me/time-off/${id}/`, data),
    deleteMyTimeOff: (id) => api.delete(`/schedules/me/time-off/${id}/`),
    getTimeOffRequests: () => api.get('/schedules/time-off/'),
    createTimeOffRequest: (data) => api.post('/schedules/time-off/', data),
    updateTimeOffRequest: (id, data) => api.put(`/schedules/time-off/${id}/`, data),
    deleteTimeOffRequest: (id) => api.delete(`/schedules/time-off/${id}/`),
    getResources: () => api.get('/schedules/resources/'),
    createResource: (data) => api.post('/schedules/resources/', data),
    updateResource: (id, data) => api.put(`/schedules/resources/${id}/`, data),
    deleteResource: (id) => api.delete(`/schedules/resources/${id}/`),
};

/**
 * =========================
 * USER SERVICE
 * =========================
 */
export const userService = {
    getMe: () => api.get('/users/me/'),
    updateMe: (data) => api.put('/users/me/', data, withPayloadConfig(data)),
    getProfile: () => api.get('/users/profile/'),
    updateProfile: (data) => api.put('/users/profile/', data, withPayloadConfig(data)),
    getGalleryImages: () => api.get('/users/gallery/'),
    uploadGalleryImage: (data) => api.post('/users/gallery/', data, withPayloadConfig(data)),
    deleteGalleryImage: (id) => api.delete(`/users/gallery/${id}/`),
    getNotifications: () => api.get('/users/notifications/'),
    markNotificationAsRead: (id) =>
        api.put(`/users/notifications/${id}/read/`),
    markAllNotificationsAsRead: () =>
        api.post('/users/notifications/read-all/'),
    getBusinesses: () => api.get('/users/businesses/'),
};

export default api;
