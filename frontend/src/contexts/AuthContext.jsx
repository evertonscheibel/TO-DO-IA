import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isUpdating = useRef(false);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
            if (token) localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/auth/me');
            setUser(res.data.data.user);
        } catch (err) {
            console.error('Auth error in loadUser:', err);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    if (!isUpdating.current) {
                        isUpdating.current = true;
                        console.warn('Session expired (401), clearing state...');
                        localStorage.removeItem('token');
                        setUser(null);
                        setLoading(false);
                        // Force a small delay before allowing another update
                        setTimeout(() => { isUpdating.current = false; }, 2000);
                    }
                }
                return Promise.reject(error);
            }
        );

        loadUser();

        return () => api.interceptors.response.eject(interceptor);
    }, [loadUser]);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user: userData } = res.data.data;
        localStorage.setItem('token', token);
        setUser(userData);
        setLoading(false);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
