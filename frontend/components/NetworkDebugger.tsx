import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DebugResult {
  type: 'info' | 'success' | 'error';
  message: string;
  details?: string;
}

/**
 * A utility component for debugging network issues in production
 */
export function NetworkDebugger() {
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

  // Test sending a request to the OTP endpoint (without actually expecting success)
  const testOtpEndpoint = async () => {
    try {      addResult({ type: 'info', message: 'Testing OTP endpoint...' });
      
      // Use the deployed backend URL
      const baseUrl = 'https://server-orcin-beta.vercel.app/api';
      const apiUrl = `${baseUrl}/auth/send-otp`;
      
      // Create an AbortController to set a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Send a test request with a dummy mobile number
      // We expect this to fail with a 400 because it's not a real number
      // But it helps us diagnose connectivity and endpoint availability
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: '0000000000' }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Get the response body for diagnostics
      let responseBody = {};
      try {
        const textResponse = await response.text();
        if (textResponse) {
          responseBody = JSON.parse(textResponse);
        }
      } catch (parseError) {
        responseBody = { error: 'Could not parse response body' };
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

  // Run all tests in sequence
  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    const isConnected = await testConnectivity();
    if (isConnected) {
      const isApiReachable = await testBackendApi();
      if (isApiReachable) {
        await testOtpEndpoint();
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
                {result.details && <p className="text-xs mt-1 opacity-80">{result.details}</p>}
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
