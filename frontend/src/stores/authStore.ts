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
    role: 'admin' | 'coordinator' | 'teacher' | 'student';
    profile: UserProfile;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    serverError: boolean; // true when server is unreachable
    login: (email: string, password: string, proId?: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

// ── Synchronous localStorage hydration ──
// Read cached auth state ONCE at module load so the very first render
// of DashboardLayout sees isAuthenticated=true and never shows a spinner.
function getInitialAuthState() {
    if (typeof window === 'undefined') {
        return { user: null, isAuthenticated: false, isLoading: true };
    }
    try {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            return {
                user: JSON.parse(savedUser) as User,
                isAuthenticated: true,
                isLoading: false, // No spinner needed — we have a cached session
            };
        }
    } catch {}
    return {
        user: null,
        isAuthenticated: false,
        isLoading: false, // No token → not loading, just unauthenticated
    };
}

const initialState = getInitialAuthState();

export const useAuthStore = create<AuthState>((set, get) => ({
    user: initialState.user,
    isLoading: initialState.isLoading,
    isAuthenticated: initialState.isAuthenticated,
    serverError: false,

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

            // Set cookie for Server Components to read (httpOnly: false so JS can manage it)
            document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

            set({ user, isAuthenticated: true, isLoading: false, serverError: false });
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Clear the access_token cookie
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
        set({ user: null, isAuthenticated: false, isLoading: false, serverError: false });
        window.location.href = '/login';
    },

    checkAuth: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                set({ isLoading: false, isAuthenticated: false, serverError: false });
                return;
            }

            // Immediately hydrate from localStorage so the UI is not blocking
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                set({ user: JSON.parse(savedUser), isAuthenticated: true, isLoading: false, serverError: false });
            }

            // Then verify with the server in the background
            const res = await api.get('/auth/me');
            const user = res.data.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, isAuthenticated: true, isLoading: false, serverError: false });
        } catch (error: any) {
            const status = error.response?.status;
            const errorCode = error.response?.data?.code;

            // Server is down / DB unreachable (503, 500) or network error (no response)
            if (!error.response || status === 503 || status === 500 || errorCode === 'SERVER_UNAVAILABLE' || errorCode === 'SERVER_ERROR') {
                console.warn('Server unavailable during auth check – keeping session from localStorage');
                // Keep the user logged in from localStorage, but flag server error
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    set({ user: JSON.parse(savedUser), isAuthenticated: true, isLoading: false, serverError: true });
                } else {
                    // No saved data and server is down – still show loading/error, NOT login
                    set({ isLoading: false, isAuthenticated: false, serverError: true });
                }
                return;
            }

            // Genuine auth failure (401 token expired, 403 invalid token)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            set({ user: null, isAuthenticated: false, isLoading: false, serverError: false });
        }
    },
}));

