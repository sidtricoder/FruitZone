import { Pool, PoolClient, QueryResult } from 'pg';
import { pool } from '../config/database';

interface QueryOptions {
  retries?: number;
  retryDelay?: number;
}

/**
 * A robust query execution helper that handles database connection retries and error management
 * 
 * @param query SQL query string
 * @param params Query parameters
 * @param options Optional configuration for retries
 * @returns Query result
 */
export async function executeQuery<T>(
  query: string, 
  params: any[] = [], 
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const { retries = 3, retryDelay = 500 } = options;
  
  let attempts = 0;
  let lastError;
  
  while (attempts < retries) {
    let client: PoolClient | undefined;
    
    try {
      client = await pool.connect();
      const result = await client.query<T>(query, params);
      return result;
    } catch (error: any) {
      attempts++;
      lastError = error;
      
      // Log the error with query details but sanitize sensitive data
      const sanitizedParams = params.map(param => 
        typeof param === 'string' && (param.length > 20 || param.includes('@')) 
          ? `${param.substring(0, 3)}...${param.substring(param.length - 3)}` 
          : param
      );
      
      console.error(`Database query error (attempt ${attempts}/${retries}):`, {
        error: error.message,
        code: error.code,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        params: sanitizedParams
      });
      
      // Handle specific database errors
      if (error.code === '40P01') { // deadlock_detected
        console.log('Deadlock detected, retrying after delay');
      } else if (error.code === '08006' || error.code === '08001' || error.code === '57P01') {
        // connection errors - worth retrying
        console.log('Connection error, retrying after delay');
      } else if (attempts >= retries) {
        // Only throw on the last attempt for other errors
        throw error;
      }
      
      // Wait before retrying
      if (attempts < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    } finally {
      if (client) {
        client.release();
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError;
}

/**
 * Execute a transaction with multiple queries
 * 
 * @param callback Function that receives client and performs queries
 * @returns Result of the callback function
 */
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
