import React, { createContext, useContext, useState, useEffect } from 'react';
import { isTokenExpired, clearAuthData, getToken } from '../utils';
import ApiService from '../api';

export interface User {
  username: string;
  email?: string;
  full_name?: string;
  disabled?: boolean;
  avatar_url?: string;
  title?: string;
  department?: string;
  location?: string;
  phone?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  registerWithCode: (payload: {
    email: string;
    verification_code: string;
    password: string;
    username: string;
    full_name: string;
    department: string;
    location: string;
  }) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
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

  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await ApiService.login(emailOrUsername, password, rememberMe);
      if (response.access_token) {
        setIsAuthenticated(true);
        // Store auth state immediately so checkAuth doesn't fail
        localStorage.setItem('isAuthenticated', 'true');
        await checkAuth(); // Get user info
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await ApiService.register(email, password, username);
      if (response.access_token) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        await checkAuth(); // Get user info
      }
    } catch (error) {
      throw error;
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      await ApiService.sendVerificationCode(email);
    } catch (error) {
      throw error;
    }
  };

  const registerWithCode = async (payload: {
    email: string;
    verification_code: string;
    password: string;
    username: string;
    full_name: string;
    department: string;
    location: string;
  }) => {
    try {
      const response = await ApiService.registerWithCode(payload);
      if (response.access_token) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        await checkAuth(); // Get user info
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
      const token = getToken();
      const isAuthStored = (localStorage.getItem('isAuthenticated') === 'true') || (sessionStorage.getItem('isAuthenticated') === 'true');
      
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

  // Periodically check if token is expired, auto logout if expired
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired()) {
        console.log('Token expired, automatically logging out...');
        logout();
      }
    };

    // Initial check
    checkTokenExpiry();

    // Check token expiration every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    registerWithCode,
    sendVerificationCode,
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
