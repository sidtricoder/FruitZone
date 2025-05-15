import { createContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '../lib/config';

export interface User {
  id: number;
  mobile_number: string;
  is_verified: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobileNumber: string, otp: string) => Promise<void>;
  requestOtp: (mobileNumber: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);  const requestOtp = async (mobileNumber: string) => {
    try {
      // Use environment-aware API endpoint
      const response = await fetch(API_ENDPOINTS.SEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP request failed:', error);
      throw error;
    }
  };  const login = async (mobileNumber: string, otp: string) => {
    try {
      // Use environment-aware API endpoint
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        requestOtp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
