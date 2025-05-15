// config.ts - Environment configuration 
// This file contains configuration that changes between environments

/**
 * Determine the API base URL based on the current environment
 * - In development: uses localhost with port 5002
 * - In production: uses relative path /api which will be routed via Vercel to the appropriate backend
 */
export const getApiBaseUrl = (): string => {
  // Check if we're running in a production environment (like Vercel)
  // window.location.hostname won't be localhost in production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // In production, use relative API path which will be handled by Vercel routing
    return '/api';
  }
  // In development, use localhost with port 5002
  return 'http://localhost:5002/api';
};

// Export API endpoints
export const API_ENDPOINTS = {
  SEND_OTP: `${getApiBaseUrl()}/auth/send-otp`,
  VERIFY_OTP: `${getApiBaseUrl()}/auth/verify-otp`,
};
