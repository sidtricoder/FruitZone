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
      const apiUrl = 'https://server-orcin-beta.vercel.app/api/health';
      
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
    try {      addResult({ type: 'info', message: 'Testing OTP endpoint...' });
      
      // Always use the deployed backend URL
      const baseUrl = 'https://server-orcin-beta.vercel.app/api';
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
  };  // Direct API Test with echo endpoint - Bypassing regular mechanisms
  const testDirectOtpRequest = async () => {
    try {      addResult({ type: 'info', message: 'Testing API with simple echo endpoint...' });
      
      // Use the deployed backend URL
      const echoUrl = 'https://server-orcin-beta.vercel.app/api/test/echo';
      addResult({ type: 'info', message: `Sending GET to: ${echoUrl}` });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        // First test - simple GET request
        const echoResponse = await fetch(echoUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        if (echoResponse.ok) {
          const echoData = await echoResponse.json();
          addResult({
            type: 'success',
            message: 'Echo GET request succeeded!',
            details: `Request received by server: ${JSON.stringify(echoData.requestInfo, null, 2)}`
          });
        } else {
          addResult({
            type: 'error',
            message: `Echo GET request failed: ${echoResponse.status} ${echoResponse.statusText}`,
            details: await echoResponse.text()
          });
        }
      } catch (echoError: any) {
        addResult({
          type: 'error',
          message: 'Echo GET request failed with exception',
          details: echoError.message || String(echoError)
        });
      }
        // Now try the OTP endpoint
      const apiUrl = 'https://server-orcin-beta.vercel.app/api/auth/send-otp';
      addResult({ type: 'info', message: `Sending POST to OTP endpoint: ${apiUrl}` });
      
      // Try with various combinations of headers and settings
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ mobile_number: '1234567890' }),
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        addResult({
          type: 'success',
          message: 'Direct OTP request succeeded!',
          details: JSON.stringify(data, null, 2)
        });
        return true;
      } else {
        const text = await response.text();
        addResult({
          type: 'error',
          message: `Direct OTP request failed: ${response.status} ${response.statusText}`,
          details: text
        });
        return false;
      }
    } catch (error: any) {
      addResult({
        type: 'error',
        message: 'Direct OTP request failed with exception',
        details: error.message || String(error)
      });
      return false;
    }
  };

  // Test database connectivity
  const testDatabaseConnection = async () => {
    try {
      addResult({ type: 'info', message: 'Testing database connectivity...' });
            // Call the diagnostics endpoint to check database status
      const apiUrl = 'https://server-orcin-beta.vercel.app/api/diagnostics/database';
      
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
        <CardContent>          <Button 
            onClick={runAllTests} 
            disabled={isLoading} 
            className="w-full mb-2"
          >
            {isLoading ? 'Running Tests...' : 'Run Network Tests'}
          </Button>
          
          <Button 
            onClick={testDirectOtpRequest} 
            disabled={isLoading} 
            className="w-full mb-4" 
            variant="outline"
          >
            Test Direct OTP Request
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
