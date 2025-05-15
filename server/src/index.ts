import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { connectDB } from './config/database'; // connectDB now returns a Promise<boolean>
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import diagnosticRoutes from './routes/diagnosticRoutes';
import { corsMiddleware } from './middleware/corsMiddleware';
import { ensureDatabaseConnection } from './middleware/databaseMiddleware';
import initSchema from './scripts/init-db-schema';

console.log(`[FruitZone Backend] SERVERLESS FUNCTION MODULE LOADING. Timestamp: ${new Date().toISOString()}`);
console.log(`[FruitZone Backend] Detected NODE_ENV: ${process.env.NODE_ENV}`);

// Read and log the .env file directly
const envPath = path.resolve(__dirname, '../.env');
console.log(`[FruitZone Backend] Checking .env file at: ${envPath}`);
if (fs.existsSync(envPath)) {
  console.log('[FruitZone Backend] .env file found, reading contents:');
  const envContents = fs.readFileSync(envPath, 'utf8');
  const sanitizedContents = envContents
    .split('\n')
    .map(line => {
      // Hide sensitive information
      if (line.includes('PASSWORD') || line.includes('SECRET')) {
        return line.replace(/=.+/, '=[REDACTED]');
      }
      return line;
    })
    .join('\n');
  console.log(sanitizedContents);
} else {
  console.log('[FruitZone Backend] .env file not found!');
}

// Load environment variables
dotenv.config();

// Log all environment variables
console.log('[FruitZone Backend] Environment variables loaded:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || '(not set)'}`);
console.log(`- PORT: ${process.env.PORT || '(not set)'}`);
console.log(`- SUPABASE_DB_URL: ${process.env.SUPABASE_DB_URL ? (process.env.SUPABASE_DB_URL.substring(0, 15) + '...') : '(not set)'}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '[REDACTED]' : '(not set)'}`);

const app: Express = express();
const port = process.env.PORT || 5001;

// Middleware
// Configure CORS based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, allow all origins (Vercel deployments)
  app.use(cors({
    origin: '*', // Allow all origins in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // Cache preflight requests for 24 hours
  }));
  console.log('[FruitZone Backend] CORS configured to allow all origins in production');
} else {
  // In development, only allow specific origins
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true
  }));
  console.log('[FruitZone Backend] CORS configured for development environment');
}

// Handle OPTIONS preflight requests explicitly
app.options('*', cors());

// Apply our custom CORS middleware as an additional safeguard
app.use(corsMiddleware);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
// Apply database connection check middleware to auth routes
app.use('/api/auth', ensureDatabaseConnection, authRoutes);

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
  try {    const dbConnected = await connectDB(); // Await the DB connection

    if (!dbConnected) {
      console.error("CRITICAL: Database connection failed. Server will start, but API endpoints requiring database access will likely fail.");
      // In a production environment for a critical application, you might choose to prevent the server from starting.
      // For Vercel serverless functions, the function will initialize, but requests might fail.
      // Logging this clearly is important.
    } else {
      console.log("Database connection established successfully.");
      
      // Initialize the database schema in production to ensure tables exist
      // This is especially important for Vercel serverless functions where we may need to create tables on first run
      if (process.env.NODE_ENV === 'production') {
        try {
          console.log("Running schema initialization in production environment...");
          await initSchema();
        } catch (schemaError) {
          console.error("Schema initialization error:", schemaError);
          // Continue running the server even if schema initialization fails
        }
      }
    }

    // Basic Route (can be after DB connection attempt)
    app.get('/', (req: Request, res: Response) => {
      res.send('FruitZone Backend Server is Running!');
    });

    // Basic Route (can be after DB connection attempt)
    app.get('/api', (req: Request, res: Response) => {
      res.send('FruitZone API is healthy!');
    });    // Health check routes
    app.use('/api/health', healthRoutes);
    
    // Diagnostic routes
    app.use('/api/diagnostics', diagnosticRoutes);
    
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
