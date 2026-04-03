import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 15000, // 15s timeout to avoid hanging requests
});

// Request interceptor - attach token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle ONLY genuine auth failures
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const errorCode = error.response?.data?.code;

        // Only redirect to login for genuine authentication failures
        // NOT for server errors (5xx), network errors, or permission issues
        if (typeof window !== 'undefined') {
            const url = error.config?.url;
            const isAuthEndpoint = url?.includes('/auth/login') || url?.includes('/auth/register');

            if (!isAuthEndpoint) {
                // 401 with TOKEN_EXPIRED or user-not-found → session is truly dead
                if (status === 401 && (errorCode === 'TOKEN_EXPIRED' || error.response?.data?.message === 'User not found')) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // 403 with INVALID_TOKEN → token is corrupted/forged
                if (status === 403 && errorCode === 'INVALID_TOKEN') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
            }

            // For 503, 500, network errors → do NOT touch tokens or redirect.
            // The page components will handle showing a connection error state.
        }

        return Promise.reject(error);
    }
);

export default api;
