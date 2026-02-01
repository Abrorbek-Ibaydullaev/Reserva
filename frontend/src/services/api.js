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

            const userResponse = await api.get('/auth/profile/');
            localStorage.setItem(
                'user_data',
                JSON.stringify(userResponse.data)
            );
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
        const response = await api.get('/auth/profile/');
        localStorage.setItem('user_data', JSON.stringify(response.data));
        return response;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/auth/profile/', userData);
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
    getServiceById: (id) => api.get(`/services/${id}/`),
    getServiceBySlug: (slug) => api.get(`/services/slug/${slug}/`),
    getCategories: () => api.get('/services/categories/'),
    createService: (data) => api.post('/services/', data),
    updateService: (id, data) => api.put(`/services/${id}/`, data),
    deleteService: (id) => api.delete(`/services/${id}/`),
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
    getAppointment: (id) => api.get(`/appointments/${id}/`),

    createAppointment: (data) =>
        api.post('/appointments/create_booking/', {
            service_id: data.service_id,
            provider_id: data.provider_id,
            client_id: data.client_id,
            start_datetime: data.start_datetime,
            client_notes: data.client_notes || '',
        }),

    getAvailableSlots: (params) =>
        api.get('/appointments/available_slots/', { params }),

    cancelAppointment: (id, reason) =>
        api.post(`/appointments/${id}/cancel/`, {
            reason: reason || 'Client requested cancellation',
        }),

    rescheduleAppointment: (id, newStartTime) =>
        api.post(`/appointments/${id}/reschedule/`, {
            start_datetime: newStartTime,
        }),
};

/**
 * =========================
 * SCHEDULE SERVICE
 * =========================
 */
export const scheduleService = {
    getWorkingHours: (providerId) =>
        api.get('/schedules/working-hours/', {
            params: { provider: providerId },
        }),

    createWorkingHours: (data) =>
        api.post('/schedules/working-hours/', data),

    updateWorkingHours: (id, data) =>
        api.put(`/schedules/working-hours/${id}/`, data),

    deleteWorkingHours: (id) =>
        api.delete(`/schedules/working-hours/${id}/`),
};

/**
 * =========================
 * USER SERVICE
 * =========================
 */
export const userService = {
    getNotifications: () => api.get('/users/notifications/'),
    markNotificationAsRead: (id) =>
        api.put(`/users/notifications/${id}/read/`),
    markAllNotificationsAsRead: () =>
        api.post('/users/notifications/read-all/'),
    getBusinesses: () => api.get('/users/businesses/'),
};

export default api;
