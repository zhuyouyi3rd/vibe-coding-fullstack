import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, TOKEN_KEY, USER_KEY } from '../lib/api';
import type { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  booting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(storedUser);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const setUser = useCallback((next: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUserState(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem(TOKEN_KEY)) {
      setBooting(false);
      return;
    }
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, [logout, setUser]);

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    },
    [setUser],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    },
    [setUser],
  );

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: AuthUser }>('/auth/me');
    setUser(data.user);
  }, [setUser]);

  const value = useMemo(
    () => ({ user, booting, login, register, logout, refreshUser, setUser }),
    [user, booting, login, register, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
