// Test with fetch API
const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5002/api/health');
    const healthData = await healthResponse.text();
    console.log('Health status:', healthResponse.status);
    console.log('Health response:', healthData);
    
    console.log('\nTesting send-otp endpoint...');
    const otpResponse = await fetch('http://localhost:5002/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify({ mobile_number: '1234567890' })
    });
    
    const otpData = await otpResponse.text();
    console.log('OTP status:', otpResponse.status);
    console.log('OTP response:', otpData);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testEndpoint();
