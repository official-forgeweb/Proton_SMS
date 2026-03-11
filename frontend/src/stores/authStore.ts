import { create } from 'zustand';
import api from '@/lib/api';

interface UserProfile {
    first_name?: string;
    last_name?: string;
    PRO_ID?: string;
    employee_id?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
}

interface User {
    id: string;
    email: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    profile: UserProfile;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, proId?: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    login: async (email: string, password: string, proId?: string) => {
        try {
            const payload: any = { password };
            if (proId) {
                payload.pro_id = proId;
            } else {
                payload.email = email;
            }

            const res = await api.post('/auth/login', payload);
            const { user, accessToken } = res.data.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, isLoading: false });
        window.location.href = '/login';
    },

    checkAuth: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                set({ isLoading: false, isAuthenticated: false });
                return;
            }

            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                set({ user: JSON.parse(savedUser), isAuthenticated: true, isLoading: false });
            }

            const res = await api.get('/auth/me');
            const user = res.data.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
