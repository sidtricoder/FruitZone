// Simple script to validate environment variables
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');
require('dotenv').config();

console.log('\n=== Environment Validation ===\n');

// Check for required environment variables
const requiredVars = ['SUPABASE_DB_URL', 'JWT_SECRET'];
const missingVars = [];

// In development mode, allow placeholders or bypass checks entirely
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  console.log('ℹ️ Running in development mode - relaxing environment validation');
}

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    if (isDevelopment) {
      console.log(`⚠️ Warning: ${varName} is not set, but continuing in development mode`);
    } else {
      missingVars.push(varName);
    }
  }
});

if (missingVars.length && !isDevelopment) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
} else {
  console.log('✅ All required environment variables are present or bypassed in development');
}

// Validate the connection string format
const connectionString = process.env.SUPABASE_DB_URL;
if (connectionString) {
  if (!connectionString.startsWith('postgresql://')) {
    console.error('❌ SUPABASE_DB_URL has incorrect format - should start with postgresql://');
  } else {
    console.log('✅ SUPABASE_DB_URL starts with postgresql://');
  }

  if (!connectionString.includes('supabase.co')) {
    console.warn('⚠️ SUPABASE_DB_URL may not be a Supabase URL (does not contain supabase.co)');
  } else {
    console.log('✅ SUPABASE_DB_URL points to supabase.co');
  }

  // Check for special characters in connection string
  try {
    // Extract the username/password part
    const match = connectionString.match(/postgresql:\/\/([^@]+)@/);
    if (match && match[1]) {
      const userPass = match[1];
      if (userPass.includes('@') && !userPass.includes('%40')) {
        console.error('❌ SUPABASE_DB_URL contains an unencoded @ in username/password');
        console.error('   Hint: Replace @ with %40 in your password');
      } else {
        console.log('✅ No unencoded special characters in username/password');
      }
    }
  } catch (e) {
    console.error('❌ Error parsing connection string');
  }
} else {
  console.error('❌ SUPABASE_DB_URL is not set');
}

console.log('\n=== End Validation ===\n');
