'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, LoginInput, RegisterInput, UserRole } from '@/lib/types';
import { apiCall, API_BASE_URL } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'sms_auth_user';

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback((authUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    localStorage.setItem('sms_token', authUser.token);
    setUser(authUser);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setIsLoading(true);
    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password
      });

      if (error || !data.session) {
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
          throw new Error('Invalid email or password');
        }
        throw new Error(error?.message || 'Failed to authenticate');
      }

      // 2. Fetch User Profile from ASP.NET Core Backend
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      if (!res.ok) {
         throw new Error('Failed to fetch user profile');
      }
      
      const profile = await res.json();

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role as UserRole,
        token: data.session.access_token,
      };
      
      persist(authUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [persist]);

  const register = useCallback(async (input: RegisterInput) => {
    throw new Error('Public registration is disabled. Please contact admin@edumatrix.com.');
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sms_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { AuthContext };
