'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'dhanak_admin_token';

interface AuthContextValue {
    token: string | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    googleLogin: (credential: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, restore token from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored && !isTokenExpired(stored)) {
            setToken(stored);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return { success: false, error: data.message || 'Invalid credentials' };
            }

            const newToken: string = data.data.token;
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            return { success: true };
        } catch {
            return { success: false, error: 'Unable to connect to server' };
        }
    }, []);

    const googleLogin = useCallback(async (credential: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: credential }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                return { success: false, error: data.message || 'Google login failed' };
            }

            const newToken: string = data.data.token;
            localStorage.setItem(TOKEN_KEY, newToken);
            setToken(newToken);
            return { success: true };
        } catch {
            return { success: false, error: 'Unable to connect to server' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ token, isAdmin: token !== null, isLoading, login, googleLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
