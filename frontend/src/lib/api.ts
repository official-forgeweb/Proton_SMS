import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
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

// Response interceptor - handle token expiry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                const url = error.config?.url;
                if (!url?.includes('/auth/login') && !url?.includes('/auth/register')) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
