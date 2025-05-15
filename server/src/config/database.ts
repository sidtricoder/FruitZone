import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  const errorMessage = "CRITICAL ERROR: SUPABASE_DB_URL environment variable is not set.";
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage + " This is required for the application to run in production.");
    // Potentially throw an error in production to prevent startup without DB config
    // throw new Error(errorMessage + " Application cannot start without SUPABASE_DB_URL in production.");
  } else {
    console.warn(errorMessage + " Please ensure it is set in your .env file for local development. Get it from your Supabase project settings (Database -> Connection string).");
  }
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } // Supabase typically requires SSL. rejectUnauthorized: false is common for managed services.
    : (process.env.NODE_ENV === 'development' && connectionString && connectionString.includes('supabase.co')) 
      ? { rejectUnauthorized: false } // Also use SSL for Supabase in dev
      : undefined, // No SSL if not connecting to Supabase or if explicitly configured otherwise for local non-Supabase PG
});

pool.on('connect', (client: PoolClient) => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'silent') {
    // console.log('Supabase DB Pool: New client connected.'); // Verbose
  }
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('Supabase DB Pool: Idle client error', {
    errorMessage: err.message,
    // errorStack: err.stack,
  });
});

export const connectDB = async (): Promise<boolean> => {
  if (!connectionString) { // Check again in case pool was created with undefined string
    console.error("Database connection string (SUPABASE_DB_URL) is not available. Cannot connect.");
    return false;
  }
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'silent') {
      console.log('Successfully connected to the Supabase PostgreSQL database.');
    }
    return true;
  } catch (error: any) {
    console.error('Failed to connect to the Supabase PostgreSQL database on startup:', {
      errorMessage: error.message,
      // errorCode: error.code,
      // errorStack: error.stack,
    });
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};
