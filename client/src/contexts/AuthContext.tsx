import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage, setUnauthorizedListener, TOKEN_KEY } from '../api/client';
import { User } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextType {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(token ? 'loading' : 'anonymous');

  const saveSession = useCallback((nextToken: string | null, nextUser: User | null) => {
    try {
      if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage can be unavailable (private mode); the session then lasts for this tab only.
    }
    setToken(nextToken);
    setUser(nextUser);
    setStatus(nextToken && nextUser ? 'authenticated' : 'anonymous');
  }, []);

  const logout = useCallback(() => saveSession(null, null), [saveSession]);

  // Restore the user profile for a stored token (e.g. after a page refresh).
  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    api
      .get<{ user: User }>('/auth/me')
      .then(({ data }) => !cancelled && saveSession(token, data.user))
      .catch(() => !cancelled && saveSession(null, null));
    return () => {
      cancelled = true;
    };
  }, [token, user, saveSession]);

  useEffect(() => {
    setUnauthorizedListener(logout);
    return () => setUnauthorizedListener(null);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
        saveSession(data.token, data.user);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Login failed. Please try again.'));
      }
    },
    [saveSession]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        const { data } = await api.post<{ token: string; user: User }>('/auth/register', { username, email, password });
        saveSession(data.token, data.user);
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Registration failed. Please try again.'));
      }
    },
    [saveSession]
  );

  const value = useMemo(
    () => ({ user, token, status, isAuthenticated: status === 'authenticated', login, register, logout }),
    [user, token, status, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
