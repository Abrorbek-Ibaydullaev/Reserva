// src/api/api.js
import axios from 'axios';

/**
 * Base API URL — must NOT end with a slash
 */
const rawApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? 'https://reserva-production.up.railway.app/api'
        : 'http://localhost:8000/api');
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

// Strip /api suffix. Production builds force https to avoid Mixed Content blocks.
const RAW_BACKEND_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
const BACKEND_ORIGIN = import.meta.env.PROD
    ? RAW_BACKEND_ORIGIN.replace(/^http:\/\//, 'https://')
    : RAW_BACKEND_ORIGIN;

export const fixMediaUrl = (url) => {
    if (!url) return url;
    // Preserve localhost for Django dev; production uses https for remote media.
    if (url.startsWith('http://')) {
        try {
            const parsed = new URL(url);
            if (['localhost', '127.0.0.1'].includes(parsed.hostname)) return url;
        } catch {
            return url;
        }
        return import.meta.env.PROD ? url.replace('http://', 'https://') : url;
    }
    if (url.startsWith('https://')) return url;
    // Relative path — prepend backend origin
    if (url.startsWith('/')) return `${BACKEND_ORIGIN}${url}`;
    return url;
};

/**
 * Axios instance
 */
export const api = axios.create({
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
        const requestUrl = originalRequest?.url || '';
        const isAuthRequest = requestUrl.includes('/auth/login/') || requestUrl.includes('/auth/register/');

        if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
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
                try { localStorage.setItem('auth_set_at', String(Date.now())); } catch (e) { /* ignore */ }

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
    login: async (email, password, recaptchaToken = null) => {
        const payload = { email, password };
        if (recaptchaToken) {
            payload.recaptcha_token = recaptchaToken;
        }
        const response = await api.post('/auth/login/', payload);

        if (response.data.access && response.data.refresh) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            try { localStorage.setItem('auth_set_at', String(Date.now())); } catch (e) { /* ignore */ }
            const raw = response.data.user || (await api.get('/users/me/')).data;
            const userData = { ...raw, profile_picture: fixMediaUrl(raw.profile_picture) };
            localStorage.setItem('user_data', JSON.stringify(userData));
        }

        return response.data;
    },

    register: async (userData) => {
        const payload = {
            email: userData.email,
            password: userData.password,
            password2: userData.password2,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number || '',
            user_type: userData.user_type,
        };
        if (userData.recaptcha_token) {
            payload.recaptcha_token = userData.recaptcha_token;
        }
        return api.post('/auth/register/', payload);
    },

    logout: () => {
        localStorage.clear();
    },

    getCurrentUser: () => {
        const data = localStorage.getItem('user_data');
        if (!data) return null;
        const user = JSON.parse(data);
        // Fix stale relative media URLs from old sessions
        return { ...user, profile_picture: fixMediaUrl(user.profile_picture) };
    },

    getUserProfile: async () => {
        const response = await api.get('/users/me/');
        const fixed = { ...response.data, profile_picture: fixMediaUrl(response.data.profile_picture) };
        localStorage.setItem('user_data', JSON.stringify(fixed));
        return response;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/users/me/', userData, withPayloadConfig(userData));
        const fixed = { ...response.data, profile_picture: fixMediaUrl(response.data.profile_picture) };
        localStorage.setItem('user_data', JSON.stringify(fixed));
        return response;
    },

    changePassword: async ({ current_password, new_password }) => {
        return api.post('/auth/change-password/', {
            old_password: current_password,
            new_password: new_password,
        });
    },

    forgotPassword: async (email) => {
        return api.post('/auth/forgot-password/', { email });
    },

    resetPassword: async ({ token, new_password }) => {
        return api.post('/auth/reset-password/', { token, new_password });
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
    addReview: (id, data) => api.post(`/services/id/${id}/reviews/`, data),
    getServiceReviews: (id) => api.get(`/services/id/${id}/reviews/`),
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
    updateMe: (data) => api.patch('/users/me/', data, withPayloadConfig(data)),
    changeMyPassword: (data) => api.patch('/users/me/password/', data),
    getProfile: () => api.get('/users/profile/'),
    updateProfile: (data) => api.patch('/users/profile/', data, withPayloadConfig(data)),
    getGalleryImages: () => api.get('/users/gallery/'),
    uploadGalleryImage: (data) => api.post('/users/gallery/', data, withPayloadConfig(data)),
    deleteGalleryImage: (id) => api.delete(`/users/gallery/${id}/`),
    getTelegramLink: () => api.get('/users/telegram/'),
    disconnectTelegram: () => api.delete('/users/telegram/'),
    getNotifications: () => api.get('/notifications/'),
    markNotificationAsRead: (id) =>
        api.patch(`/notifications/${id}/read/`),
    markAllNotificationsAsRead: () =>
        api.patch('/notifications/read-all/'),
    clearAllNotifications: () =>
        api.delete('/notifications/clear-all/'),
    getBusinesses: (params) => api.get('/users/businesses/', { params }),
};

export default api;
