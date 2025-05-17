// config.ts - Environment configuration 
// This file contains configuration that changes between environments

/**
 * Determine the API base URL based on the current environment
 * Always use the deployed backend URL
 */
export const getApiBaseUrl = (): string => {
  // Always use the deployed backend URL
  return 'https://fruit-zone-backend-j7qfnwibu-sidtricoders-projects.vercel.app/api';
};

// Export API endpoints
export const API_ENDPOINTS = {
  SEND_OTP: `${getApiBaseUrl()}/auth/send-otp`,
  VERIFY_OTP: `${getApiBaseUrl()}/auth/verify-otp`,
};
