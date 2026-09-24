import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const saved = localStorage.getItem('mms_admin');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('mms_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authService.getCurrentAdmin();
        if (res.data?.admin) {
          setAdmin(res.data.admin);
          localStorage.setItem('mms_admin', JSON.stringify(res.data.admin));
        }
      } catch (err) {
        console.warn('Session verification failed, clearing credentials:', err);
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('mms_token');
        localStorage.removeItem('mms_admin');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [token]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await authService.login(credentials);
    const newToken = res.data.token;
    const currentAdmin = res.data.admin;

    setToken(newToken);
    setAdmin(currentAdmin);

    localStorage.setItem('mms_token', newToken);
    localStorage.setItem('mms_admin', JSON.stringify(currentAdmin));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('mms_token');
      localStorage.removeItem('mms_admin');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
