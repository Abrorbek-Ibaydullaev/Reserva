// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
export const API_TIMEOUT = 30000;

// Application Configuration
export const APP_CONFIG = {
    APP_NAME: 'Reserva',
    APP_VERSION: '1.0.0',
    DEFAULT_LANGUAGE: 'en',
    DATE_FORMAT: 'MM/dd/yyyy',
    TIME_FORMAT: 'hh:mm a',
    ITEMS_PER_PAGE: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
};

// Local Storage Keys
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    THEME_MODE: 'theme_mode',
    LANGUAGE: 'language',
};

// Routes Configuration
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    SERVICES: '/services',
    SERVICE_DETAIL: '/services/:slug',
    BUSINESS_DASHBOARD: '/dashboard',
    BUSINESS_APPOINTMENTS: '/dashboard/appointments',
    BUSINESS_SERVICES: '/dashboard/services',
    BUSINESS_EMPLOYEES: '/dashboard/employees',
    BUSINESS_SCHEDULE: '/dashboard/schedule',
    CUSTOMER_PROFILE: '/profile',
    CUSTOMER_APPOINTMENTS: '/appointments',
    BOOK_APPOINTMENT: '/book/:serviceSlug',
    ABOUT: '/about',
    CONTACT: '/contact',
    PRIVACY_POLICY: '/privacy',
    TERMS_CONDITIONS: '/terms',
    NOT_FOUND: '/404',
};

// Theme Configuration
export const THEME = {
    COLORS: {
        PRIMARY: '#4A90E2',
        SECONDARY: '#50E3C2',
        SUCCESS: '#7ED321',
        WARNING: '#F5A623',
        ERROR: '#D0021B',
        INFO: '#4A90E2',
        DARK: '#333333',
        LIGHT: '#F8F9FA',
        GRAY: '#9B9B9B',
        WHITE: '#FFFFFF',
        BLACK: '#000000',
    },
    FONTS: {
        PRIMARY: '"Poppins", sans-serif',
        SECONDARY: '"Roboto", sans-serif',
    },
    BREAKPOINTS: {
        XS: 0,
        SM: 600,
        MD: 960,
        LG: 1280,
        XL: 1920,
    },
};

// API Endpoints
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/token/',
        REFRESH: '/token/refresh/',
        REGISTER: '/users/register/',
        PROFILE: '/users/me/',
        CHANGE_PASSWORD: '/users/change-password/',
    },
    USERS: {
        BASE: '/users/',
        NOTIFICATIONS: '/users/notifications/',
    },
    SERVICES: {
        BASE: '/services/',
        CATEGORIES: '/services/categories/',
        MY_SERVICES: '/services/my-services/',
        REVIEWS: (slug) => `/services/${slug}/reviews/`,
        ADDONS: (serviceId) => `/services/${serviceId}/addons/`,
    },
    SCHEDULES: {
        BUSINESS_HOURS: '/schedules/business-hours/',
        EMPLOYEES: '/schedules/employees/',
        EMPLOYEE_SCHEDULE: (employeeId) => `/schedules/employees/${employeeId}/schedules/`,
        TIME_OFF: '/schedules/time-off/',
        RESOURCES: '/schedules/resources/',
        CHECK_AVAILABILITY: '/schedules/check-availability/',
        AVAILABLE_SLOTS: '/schedules/available-slots/',
    },
    APPOINTMENTS: {
        BASE: '/appointments/',
        STATUS: (id) => `/appointments/${id}/status/`,
        RESCHEDULE: (id) => `/appointments/${id}/reschedule/`,
        CUSTOMER_APPOINTMENTS: (customerId) => `/appointments/customer/${customerId}/`,
        TODAY: '/appointments/today/',
        UPCOMING: '/appointments/upcoming/',
        HISTORY: (appointmentId) => `/appointments/${appointmentId}/history/`,
        CANCELLATION_REASONS: '/appointments/cancellation-reasons/',
    },
};

// Validation Rules
export const VALIDATION_RULES = {
    EMAIL: {
        required: 'Email is required',
        pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address',
        },
    },
    PASSWORD: {
        required: 'Password is required',
        minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
        },
    },
    PHONE: {
        pattern: {
            value: /^\+?1?\d{9,15}$/,
            message: 'Invalid phone number',
        },
    },
    REQUIRED: (field) => ({
        required: `${field} is required`,
    }),
};