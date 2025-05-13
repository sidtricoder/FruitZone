import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Vercel Postgres provides the connection string via POSTGRES_URL or similar environment variables.
// For local development, you can set POSTGRES_URL in your .env file.
const connectionString = process.env.POSTGRES_URL;

if (!connectionString && process.env.NODE_ENV !== 'production') {
  console.warn(
    "Warning: POSTGRES_URL environment variable is not set. " +
    "For local development, please ensure it's in your .env file. " +
    "Example: postgres://user:password@host:port/database"
  );
  // If you were to use individual parameters for local fallback (less common for Vercel Postgres):
  // pool = new Pool({
  //   user: process.env.PGUSER,
  //   host: process.env.PGHOST,
  //   database: process.env.PGDATABASE,
  //   password: process.env.PGPASSWORD,
  //   port: Number(process.env.PGPORT),
  // });
} else if (!connectionString && process.env.NODE_ENV === 'production') {
    console.error("FATAL ERROR: POSTGRES_URL is not set in production environment.");
    // In a serverless environment, throwing an error or logging is more appropriate than process.exit
    throw new Error("FATAL ERROR: POSTGRES_URL is not set in production environment.");
}

export const pool = new Pool({
  connectionString,
  // Vercel Postgres typically requires SSL and handles it via the connection string.
  // For local connections to some Postgres instances, you might need to configure SSL explicitly.
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  // However, for Vercel Postgres, the connectionString is usually sufficient.
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Vercel Postgres Connected successfully via pool.');
    await client.query('SELECT NOW()'); // Test query
    client.release();
  } catch (error) {
    console.error('Vercel Postgres connection error:', error);
    // The function attempting the DB operation should handle the error.
  }
};

// Optional: A function to get a client from the pool for transactions
// export const getClient = async () => {
//   const client = await pool.connect();
//   return client;
// };
