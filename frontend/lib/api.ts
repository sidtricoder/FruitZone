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
  
  console.log(`[API] Making request to: ${url}`, {
    method: fetchOptions.method || 'GET',
    headers: fetchOptions.headers
  });
  
  try {
    // Add timeout to fetch request
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    // Ensure credentials are included (helps with cookies and CORS)
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include',
      mode: 'cors'
    });
    
    clearTimeout(id);
    
    // Log response details for debugging
    console.log(`[API] Response from ${url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    return response;
  } catch (error: any) {
    console.error(`[API] Request to ${url} failed:`, error);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    
    // Enhance error message for common fetch errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Network request failed. This could be due to CORS, network connectivity, or server issues.');
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
