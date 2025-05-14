import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  const errorMessage = "CRITICAL ERROR: POSTGRES_URL environment variable is not set.";
  if (process.env.NODE_ENV === 'production') {
    console.error(errorMessage + " This is absolutely required for the application to run in production on Vercel.");
    // In a production environment, you might want to throw an error to halt startup
    // or ensure the application does not attempt to operate without a database.
    // throw new Error(errorMessage + " Application cannot start without POSTGRES_URL in production.");
  } else {
    console.warn(errorMessage + " Please ensure it is set in your .env file for local development. Example: postgres://user:password@host:port/database");
  }
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } // Standard for Vercel Postgres and similar managed services
    : undefined, // No SSL for local development by default, or use local SSL config if needed
});

pool.on('connect', (client: PoolClient) => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'silent') {
    // console.log('Database pool: A new client has been connected.'); // Verbose, enable for debugging pool activity
  }
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('PostgreSQL client error (idle client)', {
    errorMessage: err.message,
    // errorStack: err.stack, // Can be very verbose
    // clientInfo: client ? `Client processID: ${client.processID}` : 'Client undefined at time of error'
  });
  // This is a serious error, ensure monitoring is in place for these.
});

// Function to check database connectivity, intended to be called from server/src/index.ts at startup
export const connectDB = async (): Promise<boolean> => {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()'); // Simple query to confirm the connection is live
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'silent') {
      console.log('Successfully connected to the PostgreSQL database.');
    }
    return true;
  } catch (error: any) {
    console.error('Failed to connect to the PostgreSQL database on startup:', {
      errorMessage: error.message,
      // errorCode: error.code, // Useful for specific PG error codes
      // errorStack: error.stack,
    });
    // If DB connection is critical for app startup, especially in production, consider exiting or re-throwing
    // if (process.env.NODE_ENV === 'production') {
    //   // throw new Error(`Database connection failed: ${error.message}`);
    // }
    return false;
  } finally {
    if (client) {
      client.release(); // Always release the client
    }
  }
};
