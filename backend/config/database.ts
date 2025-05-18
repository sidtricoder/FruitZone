import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file if it exists (for local development)
try {
  const envPath = path.resolve(__dirname, '../.env'); // Changed from '../../.env'
  console.log(`Attempting to load environment from: ${envPath}`);
  if (fs.existsSync(envPath)) {
    console.log(`Environment file exists: true`);
    dotenv.config({ path: envPath });
  } else {
    console.log(`Environment file not found, will use environment variables set in the system`);
  }
} catch (error) {
  console.log(`Error checking for .env file, will use environment variables set in the system:`, error);
}

// Validate connection string
const connectionString = process.env.SUPABASE_DB_URL;

// Log the connection string (hiding sensitive info)
if (connectionString) {
  // Safely log connection string by hiding password
  const sanitizedConnectionString = connectionString.replace(/\/\/[^:]+:([^@]+)@/, '//[user]:[HIDDEN_PASSWORD]@');
  console.log(`Database connection string format: ${sanitizedConnectionString}`);
} else {
  const errorMessage = "CRITICAL ERROR: SUPABASE_DB_URL environment variable is not set.";
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage + " This is required for the application to run in production.");
    // Potentially throw an error in production to prevent startup without DB config
    // throw new Error(errorMessage + " Application cannot start without SUPABASE_DB_URL in production.");
  } else {
    console.warn(errorMessage + " Please ensure it is set in your .env file for local development. Get it from your Supabase project settings (Database -> Connection string).");
  }
}

// Basic validation for Supabase connection string format
if (connectionString) {
  // Check if it's a proper PostgreSQL connection string
  if (!connectionString.startsWith('postgresql://')) {
    console.error("ERROR: SUPABASE_DB_URL is not a valid PostgreSQL connection string. It should start with 'postgresql://'");
    console.error("Please get the correct connection string from Supabase dashboard -> Project Settings -> Database -> Connection string");
  }
  
  // Check if it's from Supabase
  if (!connectionString.includes('supabase.co')) {
    console.warn("Warning: The SUPABASE_DB_URL doesn't appear to be a valid Supabase connection string. Make sure it contains 'supabase.co'.");
  }
}

// Create the connection pool with detailed logging
console.log('Creating database connection pool...');
export const pool = new Pool({
  connectionString,
  // Supabase requires SSL, so ensure it's always enabled when connecting to Supabase
  ssl: {
    rejectUnauthorized: false // This is needed for most hosted Postgres services
  },
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
});

// Connection event listeners
pool.on('connect', (client: PoolClient) => {
  console.log('Supabase DB Pool: New client connected.');
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Supabase DB Pool: Idle client error:', err.message);
  console.error('Error stack:', err.stack);
  
  // Check for common connection errors
  if (err.message.includes('password authentication')) {
    console.error('HINT: This appears to be an authentication error. Check your database username and password.');
  } else if (err.message.includes('does not exist')) {
    console.error('HINT: This appears to be a database not found error. Check your database name.');
  } else if (err.message.includes('connect ETIMEDOUT')) {
    console.error('HINT: Connection timed out. Check your network and database host.');
  }
});

export const connectDB = async (): Promise<boolean> => {
  if (!connectionString) { // Check again in case pool was created with undefined string
    console.error("Database connection string (SUPABASE_DB_URL) is not available. Cannot connect.");
    return false;
  }
  
  if (!connectionString.startsWith('postgresql://')) {
    console.error("ERROR: Cannot connect to Supabase. The connection string format is incorrect.");
    console.error("Expected format: postgresql://[user]:[password]@[host]:[port]/[db_name]");
    console.error("Please update your .env file with the correct PostgreSQL connection string from Supabase dashboard.");
    return false;
  }
  
  console.log('Attempting to connect to the database...');
  let client: PoolClient | undefined;
  try {
    console.log('Getting client from pool...');
    client = await pool.connect();
    
    console.log('Running test query...');
    const result = await client.query('SELECT NOW()');
    console.log(`Database connection test successful. Server time: ${result.rows[0].now}`);
    
    // Additional validation: check if the users table exists
    try {
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);
      
      if (tableResult.rows[0].exists) {
        console.log("✅ 'users' table found in the database.");
      } else {
        console.warn("⚠️ 'users' table not found in the database. You may need to create it.");
      }
    } catch (tableError) {
      console.warn("Could not verify table structure:", tableError);
    }
    
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'silent') {
      console.log('Successfully connected to the Supabase PostgreSQL database.');
    }    return true;
  } catch (error: any) {
    console.error('Failed to connect to the Supabase PostgreSQL database on startup:');
    console.error(`Error message: ${error.message || 'No message'}`);
    console.error(`Error code: ${error.code || 'unknown'}`);
    
    // Provide more helpful error messages for common Postgres error codes
    if (error.code === '28P01') {
      console.error('Authentication failed. Check your username and password in SUPABASE_DB_URL.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error('Could not resolve host. Check your internet connection and the host in SUPABASE_DB_URL.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check that the database is running and accessible.');
    }
    
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};
