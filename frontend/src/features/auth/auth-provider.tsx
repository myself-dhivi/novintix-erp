'use client';
import type { AuthUser } from '@novintix/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api/auth.api';
import { connectSocket, disconnectSocket } from '@/lib/socket/socket';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hydrate = useCallback(async () => {
    try {
      await authApi.refresh();
      const current = await authApi.me();
      setUser(current);
      connectSocket();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const hydrateTimer = window.setTimeout(() => void hydrate(), 0);
    const expired = () => {
      setUser(null);
      disconnectSocket();
    };
    window.addEventListener('auth:expired', expired);
    return () => {
      window.clearTimeout(hydrateTimer);
      window.removeEventListener('auth:expired', expired);
    };
  }, [hydrate]);
  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (email: string, password: string) => {
        await authApi.login({ email, password });
        const current = await authApi.me();
        setUser(current);
        connectSocket();
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
        disconnectSocket();
      },
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
export function usePermission(permission: string) {
  return useAuth().user?.permissions.includes(permission) ?? false;
}
