import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoUser: (userEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (api.getToken()) {
        const { user } = await api.getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Auth check failed, clearing token');
      api.clearToken();
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      api.setToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.signup(data);
      api.setToken(res.token);
      setToken(res.token);
      setCurrentUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setToken(null);
    setCurrentUser(null);
  };

  const switchDemoUser = async (userEmail: string) => {
    // Quick demo login with pre-configured password
    await login(userEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
