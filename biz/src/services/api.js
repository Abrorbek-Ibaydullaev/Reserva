import axios from 'axios';

// Base API URL — must end with /api. Self-heals if VITE_API_BASE_URL omits it.
const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE_URL = raw.endsWith('/api') ? raw : `${raw}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biz_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const storeSession = (data) => {
  if (data?.access && data?.refresh) {
    localStorage.setItem('biz_access_token', data.access);
    localStorage.setItem('biz_refresh_token', data.refresh);
    if (data.user) localStorage.setItem('biz_user', JSON.stringify(data.user));
  }
  return data;
};

export const clearSession = () => {
  localStorage.removeItem('biz_access_token');
  localStorage.removeItem('biz_refresh_token');
  localStorage.removeItem('biz_user');
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('biz_user') || 'null');
  } catch {
    return null;
  }
};

export const businessAuth = {
  // Manual business registration (owner + business details).
  register: async ({ full_name, email, phone_number, business_name, password, password2 }) => {
    const res = await api.post('auth/business/register/', {
      full_name, email, phone_number, business_name, password, password2,
    });
    return storeSession(res.data);
  },

  // Manual email/password login — reuses the shared login endpoint.
  login: async (email, password, recaptchaToken = null) => {
    const payload = { email, password };
    if (recaptchaToken) payload.recaptcha_token = recaptchaToken;
    const res = await api.post('auth/login/', payload);
    return storeSession(res.data);
  },

  // Google login — approved business owners ONLY (backend never creates here).
  googleLogin: async (credential) => {
    const res = await api.post('auth/business/google/', { credential });
    return storeSession(res.data);
  },
};
