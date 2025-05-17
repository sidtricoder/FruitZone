import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

/**
 * Middleware to ensure database connection is available
 * This helps mitigate issues with serverless functions where the connection might be recycled
 */
export const ensureDatabaseConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to get a client from the pool
    const client = await pool.connect();
    
    try {
      // Test the connection with a simple query
      await client.query('SELECT 1');
      console.log('[DatabaseMiddleware] Database connection verified');
      next();
    } catch (error) {
      console.error('[DatabaseMiddleware] Database query error:', error);
      res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable',
        timestamp: new Date().toISOString()
      });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('[DatabaseMiddleware] Failed to connect to database:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
};
