import React, { createContext, useContext, useState, useEffect } from 'react';
import { isTokenExpired, clearAuthData } from '../utils';
import ApiService from '../api';

export interface User {
  username: string;
  email?: string;
  full_name?: string;
  disabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      const response = await ApiService.login(username, password);
      if (response.access_token) {
        setIsAuthenticated(true);
        await checkAuth(); // 获取用户信息
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      clearAuthData();
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
      
      if (!token || !isAuthStored || isTokenExpired()) {
        throw new Error('Token invalid or expired');
      }

      // Validate token and get user info
      const userInfo = await ApiService.getCurrentUser();
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 定期检查token是否过期
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (isAuthenticated && isTokenExpired()) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
