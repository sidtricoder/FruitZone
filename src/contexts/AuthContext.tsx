import { createContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '../lib/config';
import { apiFetch, safeParseJson, getErrorMessage } from '../lib/api';

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
    console.log(`[Auth] Requesting OTP for mobile number: ${mobileNumber}`);
    console.log(`[Auth] Using endpoint: ${API_ENDPOINTS.SEND_OTP}`);
    
    try {
      // Use enhanced API fetch with timeout
      const response = await apiFetch(API_ENDPOINTS.SEND_OTP, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ mobile_number: mobileNumber }),
        timeout: 15000 // 15 seconds timeout
      });
      
      console.log(`[Auth] OTP request response status: ${response.status}`);
      
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      
      // Successfully sent OTP, we don't need to parse response body for this endpoint
      return;
    } catch (error) {
      console.error('OTP request failed:', error);
      
      // Enhance error message for network-related failures
      if (!navigator.onLine) {
        throw new Error('Network error: You appear to be offline. Please check your internet connection.');
      }
      
      // Re-throw the original or enhanced error
      throw error;
    }
  };  const login = async (mobileNumber: string, otp: string) => {
    try {
      // Use enhanced API fetch with timeout
      const response = await apiFetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: mobileNumber, otp }),
        timeout: 15000 // 15 seconds timeout
      });
      
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(errorMessage);
      }
      
      // Parse the response using our safe JSON parser
      const data = await safeParseJson(response);
      
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response format: Missing token or user data');
      }
      
      // Store authentication data
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Login failed:', error);
      
      // Enhance error message for network-related failures
      if (!navigator.onLine) {
        throw new Error('Network error: You appear to be offline. Please check your internet connection.');
      }
      
      // Re-throw the original or enhanced error
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
