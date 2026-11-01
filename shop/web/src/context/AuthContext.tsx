import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type { AuthResponse, User } from '../types';
import { TOKEN_KEY, USER_KEY } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  booting: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function stored(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(stored);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem(TOKEN_KEY)) {
      setBooting(false);
      return;
    }
    api
      .get<{ user: User }>('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const value = useMemo(() => ({ user, booting, login, register, logout }), [user, booting, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
