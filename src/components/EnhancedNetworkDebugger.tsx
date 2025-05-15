import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DebugResult {
  type: 'info' | 'success' | 'error';
  message: string;
  details?: string;
}

/**
 * An enhanced utility component for debugging network issues in production
 */
export function EnhancedNetworkDebugger() {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Function to add a result to the list
  const addResult = (result: DebugResult) => {
    setResults(prev => [result, ...prev].slice(0, 10)); // Keep only the 10 most recent results
  };

  // Test basic network connectivity
  const testConnectivity = async () => {
    addResult({ type: 'info', message: 'Testing internet connectivity...' });
    
    if (!navigator.onLine) {
      addResult({ 
        type: 'error', 
        message: 'Your device appears to be offline',
        details: 'Please check your internet connection and try again'
      });
      return false;
    }

    addResult({ type: 'success', message: 'Your device is online' });
    return true;
  };
  // Test if the backend API is reachable
  const testBackendApi = async () => {
    try {
      addResult({ type: 'info', message: 'Testing backend API connectivity...' });
      
      // Use a simple HEAD request to check if the API is available
      const apiUrl = window.location.hostname !== 'localhost' ? '/api/health' : 'http://localhost:5002/api/health';
      
      // Create an AbortController to set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(apiUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        addResult({ type: 'success', message: 'Backend API is reachable' });
        return true;
      } else {
        addResult({ 
          type: 'error', 
          message: `Backend API responded with status: ${response.status}`,
          details: `This indicates a problem with the backend server. Status: ${response.statusText}`
        });
        return false;
      }
    } catch (error) {
      let message = 'Failed to connect to backend API';
      let details = 'This may indicate that the server is down or there is a network issue';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          message = 'Connection to backend API timed out';
          details = 'The server took too long to respond. It may be overloaded or unreachable.';
        } else {
          details = `Error: ${error.message}`;
        }
      }
      
      addResult({ type: 'error', message, details });
      return false;
    }
  };

  // Enhanced test for the OTP endpoint with CORS diagnostics
  const testOtpEndpoint = async () => {
    try {
      addResult({ type: 'info', message: 'Testing OTP endpoint...' });
      
      // Determine API URL based on environment
      const isProduction = window.location.hostname !== 'localhost';
      const baseUrl = isProduction ? '/api' : 'http://localhost:5002/api';
      const apiUrl = `${baseUrl}/auth/send-otp`;
      
      addResult({ 
        type: 'info', 
        message: `Using endpoint: ${apiUrl}`,
        details: `Environment: ${isProduction ? 'Production' : 'Development'}`
      });
      
      // Create an AbortController to set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout
      
      // Send test OPTIONS preflight request first to test CORS
      try {
        const optionsResponse = await fetch(apiUrl, {
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type',
            'Origin': window.location.origin
          },
          signal: controller.signal
        });
        
        if (optionsResponse.ok) {
          addResult({ 
            type: 'success', 
            message: 'CORS preflight request succeeded',
            details: `Response status: ${optionsResponse.status}`
          });
        } else {
          addResult({ 
            type: 'error', 
            message: 'CORS preflight request failed',
            details: `Response status: ${optionsResponse.status}. This suggests a CORS configuration issue on the server.`
          });
        }
      } catch (preflightError) {
        addResult({ 
          type: 'error', 
          message: 'CORS preflight request failed with exception',
          details: `Error: ${preflightError instanceof Error ? preflightError.message : 'Unknown error'}`
        });
      }
      
      // Now send an actual POST request
      addResult({ type: 'info', message: 'Testing POST to OTP endpoint...' });
      
      // Send a test request with a dummy mobile number
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-Info': 'Diagnostic request from NetworkDebugger',
          'Origin': window.location.origin
        },
        body: JSON.stringify({ mobile_number: '0000000000' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log response headers for debugging
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      addResult({ 
        type: 'info', 
        message: 'Response headers received',
        details: JSON.stringify(headers, null, 2)
      });
      
      // Get the response body for diagnostics
      let responseBody = {};
      try {
        const textResponse = await response.text();
        if (textResponse) {
          try {
            responseBody = JSON.parse(textResponse);
            addResult({ 
              type: 'info', 
              message: 'Response body received',
              details: JSON.stringify(responseBody, null, 2)
            });
          } catch (jsonError) {
            addResult({ 
              type: 'error', 
              message: 'Failed to parse response as JSON',
              details: `Raw response: ${textResponse.substring(0, 500)}`
            });
            responseBody = { nonJsonResponse: textResponse };
          }
        } else {
          addResult({ 
            type: 'info', 
            message: 'Empty response body received'
          });
        }
      } catch (parseError) {
        responseBody = { error: 'Could not read response body' };
        addResult({ 
          type: 'error', 
          message: 'Failed to read response body',
          details: `Error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        });
      }
      
      // Check response status
      if (response.status === 400) {
        // This is actually expected for our test case (invalid number)
        addResult({ 
          type: 'success', 
          message: 'OTP endpoint is functioning correctly',
          details: 'The endpoint correctly rejected our invalid test request'
        });
        return true;
      } else if (response.ok) {
        addResult({ 
          type: 'success', 
          message: 'OTP endpoint responded successfully',
        });
        return true;
      } else {
        addResult({ 
          type: 'error', 
          message: `OTP endpoint responded with status: ${response.status}`,
          details: `Response body: ${JSON.stringify(responseBody)}`
        });
        return false;
      }
    } catch (error) {
      let message = 'Failed to connect to OTP endpoint';
      let details = 'This may indicate an issue with the API or network connectivity';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          message = 'Connection to OTP endpoint timed out';
          details = 'The request took too long to complete';
        } else {
          details = `Error: ${error.message}`;
        }
      }
      
      addResult({ type: 'error', message, details });
      return false;
    }
  };
  // Test database connectivity
  const testDatabaseConnection = async () => {
    try {
      addResult({ type: 'info', message: 'Testing database connectivity...' });
      
      // Call the diagnostics endpoint to check database status
      const apiUrl = window.location.hostname !== 'localhost' 
        ? '/api/diagnostics/database' 
        : 'http://localhost:5002/api/diagnostics/database';
      
      // Create an AbortController to set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout for DB ops
      
      try {
        const response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          addResult({ 
            type: 'error', 
            message: `Database diagnostics returned status ${response.status}`,
            details: await response.text()
          });
          return false;
        }
        
        const data = await response.json();
        
        // Check database connection health
        if (data.database.connectionHealthy) {
          addResult({ 
            type: 'success', 
            message: 'Database connection is healthy',
            details: `Tables found: ${data.database.tablesFound.join(', ')}`
          });
          
          // Check specifically for users table
          if (data.database.tablesFound.includes('users')) {
            addResult({ 
              type: 'success', 
              message: 'Users table exists in database',
              details: `User count: ${data.database.userCount || 0}`
            });
          } else {
            addResult({ 
              type: 'error', 
              message: 'Users table not found in database',
              details: 'The required users table is missing, which will cause authentication failures'
            });
            return false;
          }
          
          return true;
        } else {
          addResult({ 
            type: 'error', 
            message: 'Database connection is not healthy',
            details: data.database.errorMessage || 'Unknown database error'
          });
          return false;
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          addResult({ 
            type: 'error', 
            message: 'Database diagnostics request timed out',
            details: 'This could indicate a slow database connection or server processing issues'
          });
        } else {
          addResult({ 
            type: 'error', 
            message: 'Failed to check database connectivity',
            details: error.message
          });
        }
        return false;
      }
    } catch (error: any) {
      addResult({ 
        type: 'error', 
        message: 'An error occurred while testing database connection',
        details: error.message
      });
      return false;
    }
  };

  // Run all tests in sequence
  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    // Add environment info
    addResult({ 
      type: 'info', 
      message: 'Environment Information',
      details: `URL: ${window.location.href}\nHostname: ${window.location.hostname}\nOrigin: ${window.location.origin}`
    });
    
    const isConnected = await testConnectivity();
    if (isConnected) {
      const isApiReachable = await testBackendApi();
      if (isApiReachable) {
        // Test database connection before testing OTP
        const dbIsConnected = await testDatabaseConnection();
        if (dbIsConnected) {
          await testOtpEndpoint();
        }
      }
    }
    
    setIsLoading(false);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)}>
          Debug Network
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Network Diagnostics</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              Close
            </Button>
          </div>
          <CardDescription>
            Debug network connectivity issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAllTests} 
            disabled={isLoading} 
            className="w-full mb-4"
          >
            {isLoading ? 'Running Tests...' : 'Run Network Tests'}
          </Button>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg text-sm ${
                  result.type === 'error' ? 'bg-red-100 text-red-800' : 
                  result.type === 'success' ? 'bg-green-100 text-green-800' : 
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <p className="font-medium">{result.message}</p>
                {result.details && <p className="text-xs mt-1 opacity-80 whitespace-pre-wrap">{result.details}</p>}
              </div>
            ))}
            
            {results.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 py-4">
                Click "Run Network Tests" to diagnose connection issues
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
