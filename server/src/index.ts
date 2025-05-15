import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database'; // connectDB now returns a Promise<boolean>
import authRoutes from './routes/authRoutes';

console.log(`[FruitZone Backend] SERVERLESS FUNCTION MODULE LOADING. Timestamp: ${new Date().toISOString()}`);
console.log(`[FruitZone Backend] Detected NODE_ENV: ${process.env.NODE_ENV}`);

dotenv.config();
console.log(`[FruitZone Backend] After dotenv.config(), POSTGRES_URL available: ${!!process.env.POSTGRES_URL}`);

const app: Express = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// TODO: Add other routes (products, cart, orders)

// Global Error Handler - should be defined after all routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[GlobalErrorHandler] Error:', err);
  if (res.headersSent) {
    return next(err); // Delegate to default Express error handler if headers already sent
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';
  res.status(statusCode).json({
    message,
    // Optionally include stack trace in development, but not in production
    errorDetails: process.env.NODE_ENV === 'development' && err.stack ? err.stack : undefined,
  });
});

// Start server function
async function startServer() {
  try {
    const dbConnected = await connectDB(); // Await the DB connection

    if (!dbConnected) {
      console.error("CRITICAL: Database connection failed. Server will start, but API endpoints requiring database access will likely fail.");
      // In a production environment for a critical application, you might choose to prevent the server from starting.
      // For Vercel serverless functions, the function will initialize, but requests might fail.
      // Logging this clearly is important.
    } else {
      console.log("Database connection established successfully.");
    }

    // Basic Route (can be after DB connection attempt)
    app.get('/', (req: Request, res: Response) => {
      res.send('FruitZone Backend Server is Running!');
    });

    // Basic Route (can be after DB connection attempt)
    app.get('/api', (req: Request, res: Response) => {
      res.send('FruitZone API is healthy!');
    });
    
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      if (!dbConnected) {
        console.warn("Warning: Server is running, but is not connected to the database.");
      }
    });

  } catch (error) {
    console.error("Failed to start the server due to an unhandled error during startup:", error);
    // Depending on the environment, you might exit or log critical failure.
    // For Vercel, the function deployment might fail or the function might not respond correctly.
    // process.exit(1); // Be cautious with process.exit in serverless environments.
  }
}

// Initialize DB connection and start the server
if (process.env.NODE_ENV !== 'test') { // Avoid starting server during tests if not needed
    startServer();
}

export default app; // For Vercel deployment
