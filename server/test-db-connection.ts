// test-db-connection.ts
// This script tests the database connection directly without starting the server

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// First ensure we can load the env file correctly
const envPath = path.resolve(__dirname, '.env');
console.log(`Testing DB Connection Script Starting...`);
console.log(`Looking for .env file at: ${envPath}`);
console.log(`File exists: ${fs.existsSync(envPath) ? 'Yes' : 'No'}`);

// If .env exists, log its contents (except for sensitive info)
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const sanitizedContent = envContent
    .split('\n')
    .map(line => {
      if (line.includes('PASSWORD') || line.includes('SECRET')) {
        return line.replace(/=.+/, '=[REDACTED]');
      }
      return line;
    })
    .join('\n');
    
  console.log(`\nEnvironment file contents (sanitized):\n${sanitizedContent}`);
}

// Load environment variables
console.log('\nLoading environment variables...');
dotenv.config();

// Show loaded env variables (sanitized)
console.log('Loaded environment variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '[REDACTED]' : 'not set'}`);
console.log(`SUPABASE_DB_URL: ${process.env.SUPABASE_DB_URL ? '[REDACTED]' : 'not set'}`);

import { connectDB, pool } from './src/config/database';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('-'.repeat(50));
  console.log('DATABASE CONNECTION TEST');
  console.log('-'.repeat(50));
  
  console.log('\nChecking environment variables:');
  // Check if SUPABASE_DB_URL is set and has the correct format
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('❌ SUPABASE_DB_URL environment variable is not set.');
    return;
  } else {
    if (!connectionString.startsWith('postgresql://')) {
      console.error('❌ SUPABASE_DB_URL has incorrect format. Should start with postgresql://');
      console.error('Current format:', connectionString.substring(0, 20) + '...');
    } else {
      // Safely log connection string by hiding password
      const sanitizedConnectionString = connectionString.replace(/\/\/[^:]+:([^@]+)@/, '//[user]:[HIDDEN_PASSWORD]@');
      console.log('✅ SUPABASE_DB_URL is set with correct format:', sanitizedConnectionString);
    }
  }

  // Check JWT_SECRET
  if (process.env.JWT_SECRET) {
    console.log('✅ JWT_SECRET is set');
  } else {
    console.warn('⚠️ JWT_SECRET is not set');
  }

  console.log('\nTesting database connection:');
  try {
    const connected = await connectDB();
    if (connected) {
      console.log('✅ Successfully connected to Supabase database');
      
      // Try to query users table
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'users'
          );
        `);
        
        if (result.rows[0].exists) {
          console.log('✅ Found users table in database');
          
          // Check users table schema
          const schemaResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
          `);
          
          console.log('\nUsers table schema:');
          schemaResult.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
          });
          
          // Count users
          const countResult = await client.query('SELECT COUNT(*) FROM users;');
          console.log(`\nTotal users in database: ${countResult.rows[0].count}`);
        } else {
          console.error('❌ Users table not found in database');
        }
      } finally {
        client.release();
      }
    } else {
      console.error('❌ Failed to connect to Supabase database');
    }
  } catch (error) {
    console.error('❌ Error testing database connection:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('\nDatabase connection pool closed');
  }
}

testConnection();
