import express, { Request, Response } from 'express';
import { pool } from '../config/database';

const router = express.Router();

/**
 * @route   GET /api/diagnostics
 * @desc    Base diagnostics route
 * @access  Public - but consider restricting in production
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    };
    
    res.status(200).json(diagnostics);
  } catch (error: any) {
    console.error('Base diagnostics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run base diagnostics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/diagnostics/database
 * @desc    Check database connection details and run test queries
 * @access  Public - but consider restricting in production
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        connectionHealthy: false,
        testQuerySuccess: false,
        tablesFound: [],
        errorMessage: null
      }
    };

    try {
      // Test getting a client from the pool
      const client = await pool.connect();
      diagnostics.database.connectionHealthy = true;
      
      try {
        // Run a test query
        const result = await client.query('SELECT NOW() as time');
        diagnostics.database.testQuerySuccess = true;
        diagnostics.database.serverTime = result.rows[0]?.time || null;
        
        // Check if users table exists
        const tableResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        
        diagnostics.database.tablesFound = tableResult.rows.map(row => row.table_name);
        
        // Check users table structure if it exists
        if (diagnostics.database.tablesFound.includes('users')) {
          const usersStructure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'users'
          `);
          diagnostics.database.usersTableStructure = usersStructure.rows;
          
          // Count users
          const usersCount = await client.query('SELECT COUNT(*) FROM users');
          diagnostics.database.userCount = parseInt(usersCount.rows[0]?.count || '0');
        }
      } catch (queryError: any) {
        diagnostics.database.errorMessage = queryError.message;
      } finally {
        // Always release the client
        client.release();
      }
    } catch (connectionError: any) {
      diagnostics.database.errorMessage = connectionError.message;
    }

    res.status(200).json(diagnostics);
  } catch (error: any) {
    console.error('Diagnostics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run diagnostics',
      error: error.message
    });
  }
});

export default router;
