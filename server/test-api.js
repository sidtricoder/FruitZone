// Test script for API endpoints
const http = require('http');

// Function to make a request to the API
function testAPIEndpoint(endpoint, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: `/api/${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsedData });
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          resolve({ statusCode: res.statusCode, headers: res.headers, rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Problem with request: ${error.message}`);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('Starting API tests...');
  
  try {
    // Test health endpoint
    console.log('\n--- Testing Health Endpoint ---');
    const healthResult = await testAPIEndpoint('health', 'GET');
    console.log(`Health check result: ${healthResult.statusCode}`);
    console.log(healthResult.data);
    
    // Test database diagnostics endpoint
    console.log('\n--- Testing Database Diagnostics Endpoint ---');
    const dbResult = await testAPIEndpoint('diagnostics/database', 'GET');
    console.log(`Database diagnostics result: ${dbResult.statusCode}`);
    console.log(dbResult.data);
    
    // Test send OTP endpoint
    console.log('\n--- Testing Send OTP Endpoint ---');
    const otpResult = await testAPIEndpoint('auth/send-otp', 'POST', {
      mobile_number: '1234567890'
    });
    console.log(`OTP result: ${otpResult.statusCode}`);
    console.log(otpResult.data);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
