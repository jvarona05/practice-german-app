'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { User } from '@german-app/shared';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    api.auth.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken } = await api.auth.login(email, password);
    localStorage.setItem('token', accessToken);
    const me = await api.auth.me();
    setUser(me);
  };

  const register = async (email: string, password: string, name: string) => {
    const { accessToken } = await api.auth.register(email, password, name);
    localStorage.setItem('token', accessToken);
    const me = await api.auth.me();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
