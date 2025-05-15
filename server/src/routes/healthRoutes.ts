import express from 'express';
import { pool } from '../config/database';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Return basic system health
    const serverTime = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';
    
    // Check database connection
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT NOW()');
        dbStatus = 'connected';
      } finally {
        client.release();
      }
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }
    
    // Send health information
    res.status(200).json({
      status: 'ok',
      serverTime,
      environment,
      database: {
        status: dbStatus,
        error: dbError
      },
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error in health check'
    });
  }
});

/**
 * @route   HEAD /api/health
 * @desc    Lightweight health check for monitoring
 * @access  Public
 */
router.head('/', (req, res) => {
  res.status(200).end();
});

export default router;
