import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signOut as authSignOut, getCurrentProfile } from '../lib/auth';
import type { UserProfile } from '../types/database';

interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    // Check for existing session on mount
    useEffect(() => {
        getCurrentProfile()
            .then((profile) => {
                setState({ user: profile, loading: false, error: null });
            })
            .catch(() => {
                setState({ user: null, loading: false, error: null });
            });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event) => {
                if (event === 'SIGNED_OUT') {
                    setState({ user: null, loading: false, error: null });
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    const profile = await getCurrentProfile();
                    setState({ user: profile, loading: false, error: null });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const profile = await signIn(email, password);
            setState({ user: profile, loading: false, error: null });
        } catch (err: any) {
            setState({ user: null, loading: false, error: err.message || 'Login failed' });
            throw err;
        }
    }, []);

    const logout = useCallback(async () => {
        await authSignOut();
        setState({ user: null, loading: false, error: null });
    }, []);

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
