/**
 * API utility functions for making fetch requests with better error handling
 */

interface ApiOptions extends RequestInit {
  timeout?: number;
}

/**
 * Enhanced fetch function with better error handling and timeout support
 */
export async function apiFetch(url: string, options: ApiOptions = {}) {
  const { timeout = 10000, ...fetchOptions } = options;
  
  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Safely parse JSON from a response, with helpful error messages
 */
export async function safeParseJson(response: Response) {
  try {
    const text = await response.text();
    
    // Handle empty responses
    if (!text.trim()) {
      return null;
    }
    
    // Try to parse as JSON
    return JSON.parse(text);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse response as JSON: ${errorMessage}`);
  }
}

/**
 * Get a readable error message from a response
 */
export async function getErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await safeParseJson(response);
      return errorData?.message || `Error ${response.status}: ${response.statusText}`;
    }
    
    return `Error ${response.status}: ${response.statusText}`;
  } catch (error) {
    return `Error ${response.status}: ${response.statusText}`;
  }
}
